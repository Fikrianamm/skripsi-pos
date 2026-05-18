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

// GET /api/reports/finance/cost?bulan=3&tahun=2026
export async function GET(request: NextRequest) {
  try {
    const { error, status } = await requireAdmin();
    if (error) return NextResponse.json({ error }, { status });

    const sp  = request.nextUrl.searchParams;
    const now = new Date();
    const bulan = parseInt(sp.get("bulan") || String(now.getMonth() + 1));
    const tahun = parseInt(sp.get("tahun") || String(now.getFullYear()));

    const start = new Date(tahun, bulan - 1, 1);
    const end   = new Date(tahun, bulan, 0, 23, 59, 59, 999);

    // Ambil dari JurnalUmum — filter akun debet bertipe BEBAN_USAHA
    const jurnals = await prisma.jurnalUmum.findMany({
      where: {
        deletedAt: null,
        tanggal: { gte: start, lte: end },
        akunDebet: { kelompok: "BEBAN_USAHA" },
      },
      include: {
        akunDebet: { select: { namaAkun: true, kelompok: true } },
        akunKredit: { select: { namaAkun: true } },
      },
      orderBy: { tanggal: "asc" },
    });

    // Group by nama akun beban (akunDebet)
    const grouped: Record<
      string,
      { kategori: string; items: typeof jurnals; total: number }
    > = {};

    for (const j of jurnals) {
      const namaAkun = j.akunDebet.namaAkun;
      if (!grouped[namaAkun])
        grouped[namaAkun] = { kategori: namaAkun, items: [], total: 0 };
      grouped[namaAkun].items.push(j);
      grouped[namaAkun].total += Number(j.nominal);
    }

    const grandTotal = jurnals.reduce((s, j) => s + Number(j.nominal), 0);

    return NextResponse.json({
      bulan,
      tahun,
      groups: Object.values(grouped).sort((a, b) => b.total - a.total),
      grandTotal,
    });
  } catch (err) {
    console.error("[LAPORAN_COST_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
