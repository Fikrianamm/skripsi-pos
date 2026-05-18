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

// Aggregates saldo per account group from JurnalUmum.
// PENDAPATAN is increased by KREDIT, BEBAN_* is increased by DEBET.
async function aggregateByKelompok(bulan: number, tahun: number) {
  const startDate = new Date(tahun, bulan - 1, 1);
  const endDate = new Date(tahun, bulan, 0, 23, 59, 59, 999);

  // 1. Ambil semua akun yang relevan untuk Laba Rugi (Pendapatan & Beban)
  const allAccounts = await prisma.akun.findMany({
    where: {
      kelompok: { in: ["PENDAPATAN", "BEBAN_USAHA"] },
      isActive: true,
    },
    select: { id: true, kodeAkun: true, namaAkun: true, kelompok: true },
    orderBy: { kodeAkun: "asc" },
  });

  // 2. Inisialisasi saldoMap dengan semua akun tersebut
  const saldoMap: Record<string, Record<string, number>> = {
    PENDAPATAN: {},
    BEBAN_USAHA: {},
  };

  for (const acc of allAccounts) {
    const key = `${acc.kodeAkun}|${acc.namaAkun}`;
    saldoMap[acc.kelompok][key] = 0;
  }

  // 3. Ambil data jurnal
  const jurnals = await prisma.jurnalUmum.findMany({
    where: {
      tanggal: { gte: startDate, lte: endDate },
      deletedAt: null,
    },
    include: {
      akunDebet: { select: { kelompok: true, kodeAkun: true, namaAkun: true } },
      akunKredit: { select: { kelompok: true, kodeAkun: true, namaAkun: true } },
    },
  });

  for (const j of jurnals) {
    const nom = Number(j.nominal);
    const debetKey = `${j.akunDebet.kodeAkun}|${j.akunDebet.namaAkun}`;
    const kreditKey = `${j.akunKredit.kodeAkun}|${j.akunKredit.namaAkun}`;

    // PENDAPATAN increases on KREDIT side
    if (j.akunKredit.kelompok === "PENDAPATAN") {
      saldoMap.PENDAPATAN[kreditKey] =
        (saldoMap.PENDAPATAN[kreditKey] ?? 0) + nom;
    }
    if (j.akunDebet.kelompok === "PENDAPATAN") {
      saldoMap.PENDAPATAN[debetKey] =
        (saldoMap.PENDAPATAN[debetKey] ?? 0) - nom;
    }

    // BEBAN increases on DEBET side
    const grp = "BEBAN_USAHA";
    if (j.akunDebet.kelompok === grp) {
      saldoMap[grp][debetKey] = (saldoMap[grp][debetKey] ?? 0) + nom;
    }
    if (j.akunKredit.kelompok === grp) {
      saldoMap[grp][kreditKey] = (saldoMap[grp][kreditKey] ?? 0) - nom;
    }
  }

  function toRows(group: Record<string, number>) {
    return Object.entries(group).map(([key, total]) => {
      const [kode, nama] = key.split("|");
      return { kode, nama, total };
    });
    // Menghilangkan filter total !== 0 agar semua tampil sesuai permintaan user
  }

  const pendapatan = toRows(saldoMap.PENDAPATAN);
  const bebanUsaha = toRows(saldoMap.BEBAN_USAHA);

  const totalPendapatan = pendapatan.reduce((s, r) => s + r.total, 0);
  const totalBebanUsaha = bebanUsaha.reduce((s, r) => s + r.total, 0);
  const labaBersih = totalPendapatan - totalBebanUsaha;
  const margin = totalPendapatan > 0 ? (labaBersih / totalPendapatan) * 100 : 0;

  return {
    pendapatan,
    bebanUsaha,
    totalPendapatan,
    totalBebanUsaha,
    labaBersih,
    margin: Number(margin.toFixed(2)),
  };
}

// GET /api/reports/finance/laba-rugi?bulan=3&tahun=2026
export async function GET(request: NextRequest) {
  try {
    const { error, status } = await requireAdmin();
    if (error) return NextResponse.json({ error }, { status });

    const sp = request.nextUrl.searchParams;
    const now = new Date();
    const bulan = parseInt(sp.get("bulan") || String(now.getMonth() + 1));
    const tahun = parseInt(sp.get("tahun") || String(now.getFullYear()));

    const data = await aggregateByKelompok(bulan, tahun);

    return NextResponse.json({ bulan, tahun, ...data });
  } catch (err) {
    console.error("[LABA_RUGI_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
