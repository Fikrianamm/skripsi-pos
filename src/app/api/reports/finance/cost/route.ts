import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized", status: 401 };
  const allowed = ["admin", "kasir"];
  if (!allowed.includes(session.user.role)) return { error: "Forbidden", status: 403 };
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

    const costs = await prisma.cost.findMany({
      where: { tanggal: { gte: start, lte: end } },
      include: {
        akun: { select: { namaAkun: true, kelompok: true } },
      },
      orderBy: { tanggal: "asc" },
    });

    // Group by kelompok akun
    const grouped: Record<
      string,
      { kategori: string; items: typeof costs; total: number }
    > = {};

    for (const c of costs) {
      const kelompok = c.akun.kelompok;
      if (!grouped[kelompok])
        grouped[kelompok] = { kategori: kelompok, items: [], total: 0 };
      grouped[kelompok].items.push(c);
      grouped[kelompok].total += Number(c.nominal);
    }

    const grandTotal = costs.reduce((s, c) => s + Number(c.nominal), 0);

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
