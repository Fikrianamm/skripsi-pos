import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized", status: 401 };
  if (session.user.role !== "admin") return { error: "Forbidden", status: 403 };
  return { error: null, status: 200 };
}

export async function GET(request: NextRequest) {
  try {
    const { error, status } = await requireAdmin();
    if (error) return NextResponse.json({ error }, { status });

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()));

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    // Pendapatan: all payments in period grouped by metodePembayaran
    const payments = await prisma.payment.findMany({
      where: { tanggal: { gte: start, lte: end } },
      select: { nominal: true, metodePembayaran: true },
    });

    const pendapatanByMetode: Record<string, number> = {};
    let totalPendapatan = 0;
    for (const p of payments) {
      pendapatanByMetode[p.metodePembayaran] =
        (pendapatanByMetode[p.metodePembayaran] ?? 0) + Number(p.nominal);
      totalPendapatan += Number(p.nominal);
    }

    // Beban: all costs in period with category
    const costs = await prisma.cost.findMany({
      where: { tanggal: { gte: start, lte: end } },
      select: {
        nominal: true,
        costCategory: { select: { nama: true, jenisBeban: true } },
      },
    });

    const bebanPokok: Record<string, number> = {};
    const bebanOperasional: Record<string, number> = {};
    let totalBebanPokok = 0;
    let totalBebanOperasional = 0;

    for (const c of costs) {
      const jenis = c.costCategory.jenisBeban.toUpperCase();
      const nama = c.costCategory.nama;
      const val = Number(c.nominal);

      if (jenis === "HPP" || jenis === "PRODUKSI") {
        bebanPokok[nama] = (bebanPokok[nama] ?? 0) + val;
        totalBebanPokok += val;
      } else if (jenis === "OPERASIONAL") {
        bebanOperasional[nama] = (bebanOperasional[nama] ?? 0) + val;
        totalBebanOperasional += val;
      }
    }

    const labaKotor = totalPendapatan - totalBebanPokok;
    const labaBersih = labaKotor - totalBebanOperasional;

    return NextResponse.json({
      period: { month, year },
      pendapatan: {
        items: Object.entries(pendapatanByMetode).map(([k, v]) => ({ nama: k, nominal: v })),
        total: totalPendapatan,
      },
      bebanPokok: {
        items: Object.entries(bebanPokok).map(([k, v]) => ({ nama: k, nominal: v })),
        total: totalBebanPokok,
      },
      labaKotor,
      bebanOperasional: {
        items: Object.entries(bebanOperasional).map(([k, v]) => ({ nama: k, nominal: v })),
        total: totalBebanOperasional,
      },
      labaBersih,
    });
  } catch (err) {
    console.error("[LABA RUGI ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
