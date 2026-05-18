import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized", status: 401 };
  if (session.user.role !== "admin") return { error: "Forbidden. Laporan hanya dapat diakses oleh administrator.", status: 403 };
  return { error: null, status: 200 };
}

// GET /api/reports/finance/neraca?tahun=2026&bulan=3
// Balance Sheet: Accumulates ALL journals UP TO the given period (not just current month).
export async function GET(request: NextRequest) {
  try {
    const { error, status } = await requireAdmin();
    if (error) return NextResponse.json({ error }, { status });

    const sp = request.nextUrl.searchParams;
    const now = new Date();
    const bulan = parseInt(sp.get("bulan") || String(now.getMonth() + 1));
    const tahun = parseInt(sp.get("tahun") || String(now.getFullYear()));

    // Get all journals UP TO (and including) the given period
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59, 999); // last day of given month

    const jurnals = await prisma.jurnalUmum.findMany({
      where: {
        tanggal: { lte: endDate },
        deletedAt: null,
      },
      include: {
        akunDebet:  { select: { id: true, kodeAkun: true, namaAkun: true, kelompok: true, posisiNormal: true } },
        akunKredit: { select: { id: true, kodeAkun: true, namaAkun: true, kelompok: true, posisiNormal: true } },
      },
    });

    // 1. Ambil semua akun yang relevan untuk Neraca
    const allAccounts = await prisma.akun.findMany({
      where: {
        kelompok: { in: ["AKTIVA_LANCAR", "KEWAJIBAN", "MODAL", "PENDAPATAN", "BEBAN_USAHA"] },
        isActive: true,
      },
      select: { id: true, kodeAkun: true, namaAkun: true, kelompok: true, posisiNormal: true },
    });

    // 2. Inisialisasi balanceMap dengan semua akun tersebut
    const balanceMap: Record<string, {
      id: string; kodeAkun: string; namaAkun: string;
      kelompok: string; posisiNormal: string; saldo: number;
    }> = {};

    for (const acc of allAccounts) {
      balanceMap[acc.id] = { ...acc, saldo: 0 };
    }

    // 3. Masukkan saldo dari jurnal
    for (const j of jurnals) {
      const nom = Number(j.nominal);
      
      // Debet side: increases DEBET-normal accounts, decreases KREDIT-normal accounts
      if (balanceMap[j.akunDebet.id]) {
        if (j.akunDebet.posisiNormal === "DEBET") {
          balanceMap[j.akunDebet.id].saldo += nom;
        } else {
          balanceMap[j.akunDebet.id].saldo -= nom;
        }
      }

      // Kredit side: increases KREDIT-normal accounts, decreases DEBET-normal accounts
      if (balanceMap[j.akunKredit.id]) {
        if (j.akunKredit.posisiNormal === "KREDIT") {
          balanceMap[j.akunKredit.id].saldo += nom;
        } else {
          balanceMap[j.akunKredit.id].saldo -= nom;
        }
      }
    }

    const accounts = Object.values(balanceMap);

    // Group by kelompok
    const grouped: Record<string, typeof accounts> = {};
    for (const acc of accounts) {
      if (!grouped[acc.kelompok]) grouped[acc.kelompok] = [];
      grouped[acc.kelompok].push(acc);
    }

    // Sort each group by kodeAkun
    for (const key in grouped) {
      grouped[key].sort((a, b) => a.kodeAkun.localeCompare(b.kodeAkun));
    }

    const sum = (grp: string) =>
      (grouped[grp] ?? []).reduce((s, a) => s + a.saldo, 0);

    const totalAktivaLancar = sum("AKTIVA_LANCAR");
    const totalAktiva = totalAktivaLancar;

    const totalKewajiban = sum("KEWAJIBAN");
    const totalModal     = sum("MODAL");

    // Laba berjalan (accumulated from income statement accounts)
    const totalPendapatan = sum("PENDAPATAN");
    const totalBeban = sum("BEBAN_USAHA");
    const labaBerjalan = totalPendapatan - totalBeban;

    const totalPasiva = totalKewajiban + totalModal + labaBerjalan;

    return NextResponse.json({
      bulan, tahun,
      aktiva: {
        lancar: grouped["AKTIVA_LANCAR"] ?? [],
        totalLancar: totalAktivaLancar,
        total:       totalAktiva,
      },
      pasiva: {
        kewajiban:    grouped["KEWAJIBAN"] ?? [],
        modal:        grouped["MODAL"] ?? [],
        labaBerjalan,
        totalKewajiban,
        totalModal,
        total:        totalPasiva,
      },
      isBalanced: Math.abs(totalAktiva - totalPasiva) < 1, // Allow Rp1 rounding error
    });
  } catch (err) {
    console.error("[NERACA_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
