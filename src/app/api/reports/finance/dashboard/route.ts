import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function requireAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return { error: "Unauthorized", status: 401, session: null };
  if (session.user.role !== "admin")
    return { error: "Forbidden", status: 403, session: null };
  return { error: null, status: 200, session };
}

export async function GET(request: NextRequest) {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const searchParams = request.nextUrl.searchParams;
    const bulan = searchParams.get("bulan");
    const tahun = searchParams.get("tahun");

    // Filter time range (Current Year / Month default)
    const now = new Date();
    const qBulan = bulan ? parseInt(bulan) : now.getMonth() + 1;
    const qTahun = tahun ? parseInt(tahun) : now.getFullYear();

    // To compute Pendapatan vs Beban, we sum the balances by Account groups 
    // from the general ledger Jurnal Umum for the selected month/year.
    const allJurnal = await prisma.jurnalUmum.findMany({
      where: {
        bulan: qBulan,
        tahun: qTahun,
      },
      include: {
        akunDebet: { select: { kelompok: true } },
        akunKredit: { select: { kelompok: true } },
      },
    });

    let totalPendapatan = 0;
    let totalHPP = 0;
    let totalBebanOperasional = 0;

    // Loop through every paired journal entry
    for (const j of allJurnal) {
      const nom = Number(j.debet); // Debet and Kredit values are always identical per JurnalUmum schema

      // Check for Revenue Accounts (Pendapatan is increased by KREDIT)
      if (j.akunKredit.kelompok === "PENDAPATAN") totalPendapatan += nom;
      // Revenue reversed by DEBET (e.g., retur/refund)
      if (j.akunDebet.kelompok === "PENDAPATAN") totalPendapatan -= nom;

      // Check for HPP (HPP is increased by DEBET)
      if (j.akunDebet.kelompok === "BEBAN_HPP") totalHPP += nom;
      if (j.akunKredit.kelompok === "BEBAN_HPP") totalHPP -= nom;

      // Check for Operasional (Beban is increased by DEBET)
      const opGroups = ["BEBAN_MARKETING", "BEBAN_GAJI", "BEBAN_ADMINISTRASI"];
      if (opGroups.includes(j.akunDebet.kelompok)) totalBebanOperasional += nom;
      if (opGroups.includes(j.akunKredit.kelompok)) totalBebanOperasional -= nom;
    }

    const totalBebanTotal = totalHPP + totalBebanOperasional;
    const profit = totalPendapatan - totalBebanTotal;
    const margin = totalPendapatan > 0 ? (profit / totalPendapatan) * 100 : 0;

    // TODO: Compare with BudgetTarget table if target is dynamically stored.
    // For now, hardcode target to 15% as per user requirement.
    const targetMargin = 15;

    return NextResponse.json({
      period: { bulan: qBulan, tahun: qTahun },
      metrics: {
        totalPendapatan,
        totalPengeluaran: totalBebanTotal,
        profit,
        margin: Number(margin.toFixed(2)),
        targetMargin,
      },
      isMeetingTarget: margin >= targetMargin,
    });
  } catch (err) {
    console.error("[GET_DASHBOARD_FINANCE_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
