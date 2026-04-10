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

// GET /api/reports/finance/tabungan?tahun=2026
// Ambil data tabungan dari JurnalUmum — akun dengan kelompok yang namaAkun mengandung "Tabungan"
// (Akun 1-004 s/d 1-010 semua AKTIVA_LANCAR bertipe Tabungan)
export async function GET(request: NextRequest) {
  try {
    const { error, status } = await requireAdmin();
    if (error) return NextResponse.json({ error }, { status });

    const sp = request.nextUrl.searchParams;
    const tahun = parseInt(sp.get("tahun") || String(new Date().getFullYear()));

    const startDate = new Date(tahun, 0, 1);
    const endDate   = new Date(tahun, 11, 31, 23, 59, 59, 999);

    // Ambil semua jurnal dalam tahun tersebut yang sisi DEBET-nya adalah akun Tabungan
    const jurnals = await prisma.jurnalUmum.findMany({
      where: {
        tanggal: { gte: startDate, lte: endDate },
        akunDebet: { namaAkun: { contains: "Tabungan" } },
      },
      select: {
        nominal: true,
        tanggal: true,
        akunDebet: { select: { namaAkun: true } },
      },
      orderBy: { tanggal: "asc" },
    });

    // Pivot: per jenis tabungan × bulan
    const jenisMap: Record<string, { nama: string; byBulan: Record<number, number>; total: number }> = {};

    for (const j of jurnals) {
      const jenis = j.akunDebet.namaAkun;
      const bulan = new Date(j.tanggal).getMonth() + 1;
      const nom   = Number(j.nominal);

      if (!jenisMap[jenis]) jenisMap[jenis] = { nama: jenis, byBulan: {}, total: 0 };
      jenisMap[jenis].byBulan[bulan] = (jenisMap[jenis].byBulan[bulan] ?? 0) + nom;
      jenisMap[jenis].total += nom;
    }

    const grandTotal = Object.values(jenisMap).reduce((s, j) => s + j.total, 0);

    return NextResponse.json({
      tahun,
      rows: Object.values(jenisMap).sort((a, b) => a.nama.localeCompare(b.nama)),
      grandTotal,
    });
  } catch (err) {
    console.error("[LAPORAN_TABUNGAN_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
