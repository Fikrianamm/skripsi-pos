import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function requireDashboardAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized", status: 401 };
  return { error: null, status: 200 };
}

export async function GET(request: NextRequest) {
  try {
    const { error, status } = await requireDashboardAccess();
    if (error) return NextResponse.json({ error }, { status });

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(
      searchParams.get("month") || String(now.getMonth() + 1),
    );
    const year = parseInt(
      searchParams.get("year") || String(now.getFullYear()),
    );

    // Start of today (local-ish: use UTC start of day relative to now)
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );

    const [
      sumPayToday,
      totalCustomer,
      newOrdersToday,
      activeOrders,
      piutangOrders,
      allBahanBaku,
      allProducts,
      recentOrders,
    ] = await Promise.all([
      // 0: Today's payment total
      prisma.payment.aggregate({
        _sum: { nominal: true },
        where: { tanggal: { gte: startOfToday }, deletedAt: null },
      }),
      // 1: Total customers
      prisma.customer.count({ where: { deletedAt: null } }),
      // 2: New orders today
      prisma.order.count({ where: { createdAt: { gte: startOfToday }, deletedAt: null } }),
      // 3: Active orders (not SELESAI or BATAL)
      prisma.order.count({
        where: { statusProduksi: { notIn: ["SELESAI", "BATAL"] }, deletedAt: null },
      }),
      // 4: Piutang
      prisma.order.findMany({
        where: { statusPembayaran: { in: ["BELUM_BAYAR", "DP"] }, deletedAt: null },
        select: {
          grandTotal: true,
          payments: { select: { nominal: true } },
        },
      }),
      // 5: Fetch all active materials
      prisma.bahanBaku.findMany({
        where: { isActive: true, minStok: { not: null } },
        select: { id: true, nama: true, stok: true, minStok: true, unit: { select: { nama: true } } },
      }),
      // 6: Fetch all products
      prisma.product.findMany({
         where: {
          isService: false,
          deletedAt: null,
          OR: [
            { minStok: { not: null } },
            { stok: { lte: 0 } },
          ],
        },
        select: { id: true, nama: true, stok: true, minStok: true, unit: { select: { nama: true } } },
      }),
      // 7: Recent orders (last 5)
      prisma.order.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          nomorOrder: true,
          grandTotal: true,
          statusPembayaran: true,
          statusProduksi: true,
          createdAt: true,
          customer: { select: { nama: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // Filter low stock in JS
    const lowStockBahanBaku = allBahanBaku
      .filter((b) => Number(b.stok) < Number(b.minStok))
      .sort((a, b) => Number(a.stok) - Number(b.stok))
      .slice(0, 10);

    const lowStockProducts = allProducts
      .filter((p) => {
        const stok = Number(p.stok ?? 0);
        const min = Number(p.minStok ?? 0);
        // Tampilkan jika stok habis (stok <= 0) ATAU stok di bawah minimum
        return stok <= 0 || (p.minStok !== null && stok < min);
      })
      .sort((a, b) => Number(a.stok ?? 0) - Number(b.stok ?? 0))
      .slice(0, 10);

    const todaySales = Number(sumPayToday._sum.nominal ?? 0);

    const totalPiutang = piutangOrders.reduce((sum, o) => {
      const dibayar = o.payments.reduce((s, p) => s + Number(p.nominal), 0);
      return sum + Math.max(0, Number(o.grandTotal) - dibayar);
    }, 0);

    // Weekly chart data for the current month
    const weeks = Array.from({ length: 5 }, (_, i) => ({
      label: `Minggu ${i + 1}`,
      pendapatan: 0,
      pengeluaran: 0,
    }));
    const months: { label: string; pendapatan: number; pengeluaran: number }[] =
      Array.from({ length: 12 }, (_, i) => ({
        label: new Date(year, i, 1).toLocaleDateString("id-ID", {
          month: "short",
        }),
        pendapatan: 0,
        pengeluaran: 0,
      }));

    // Re-fetch journals for the whole year AND prev month for chart data & KPIs
    const startPrevJurnal = new Date(year, month - 2, 1);
    const startOfYear = new Date(year, 0, 1);
    const queryStart = startPrevJurnal < startOfYear ? startPrevJurnal : startOfYear;
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const jurnals = await prisma.jurnalUmum.findMany({
      where: { tanggal: { gte: queryStart, lte: endOfYear }, deletedAt: null },
      include: {
        akunDebet: { select: { kelompok: true } },
        akunKredit: { select: { kelompok: true } },
      },
    });

    let totalPendapatan = 0;
    let totalPengeluaran = 0;
    let prevPendapatan = 0;
    let prevPengeluaran = 0;

    for (const j of jurnals) {
      const jDate = new Date(j.tanggal);
      const m = jDate.getMonth();
      const jYear = jDate.getFullYear();
      const jMonth = m + 1;
      const nom = Number(j.nominal);

      let isPend = 0;
      let isPeng = 0;

      if (j.akunKredit?.kelompok === "PENDAPATAN") isPend += nom;
      if (j.akunDebet?.kelompok === "PENDAPATAN") isPend -= nom;

      if (j.akunDebet?.kelompok === "BEBAN_USAHA") isPeng += nom;
      if (j.akunKredit?.kelompok === "BEBAN_USAHA") isPeng -= nom;

      // Only add to months array if it's in the requested year
      if (jYear === year) {
        months[m].pendapatan += isPend;
        months[m].pengeluaran += isPeng;
      }

      // Current month totals
      if (jYear === year && jMonth === month) {
        totalPendapatan += isPend;
        totalPengeluaran += isPeng;

        const day = jDate.getDate();
        const w = Math.min(Math.floor((day - 1) / 7), 4);
        weeks[w].pendapatan += isPend;
        weeks[w].pengeluaran += isPeng;
      }

      // Prev month totals
      let pMonth = month - 1;
      let pYear = year;
      if (pMonth === 0) {
        pMonth = 12;
        pYear = year - 1;
      }
      if (jYear === pYear && jMonth === pMonth) {
        prevPendapatan += isPend;
        prevPengeluaran += isPeng;
      }
    }

    const pctChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return NextResponse.json({
      // Summary stats
      totalPendapatan,
      totalPengeluaran,
      labaBersih: totalPendapatan - totalPengeluaran,
      totalPiutang,
      todaySales,
      totalCustomer,
      newOrdersToday,
      activeOrders,
      // Trend percentages
      persenPendapatan: pctChange(totalPendapatan, prevPendapatan),
      persenPengeluaran: pctChange(totalPengeluaran, prevPengeluaran),
      persenLabaBersih: pctChange(
        totalPendapatan - totalPengeluaran,
        prevPendapatan - prevPengeluaran,
      ),
      // Alerts & recent
      lowStockAlerts: [
        ...lowStockBahanBaku.map((b) => ({
          id: b.id,
          nama: b.nama,
          type: "bahan_baku" as const,
          stok: Number(b.stok),
          minStok: Number(b.minStok),
          unit: { nama: b.unit.nama ?? "" },
        })),
        ...lowStockProducts.map((p) => ({
          id: p.id,
          nama: p.nama,
          type: "product" as const,
          stok: Number(p.stok),
          minStok: Number(p.minStok),
          unit: { nama: p.unit.nama ?? "" },
        })),
      ],
      recentOrders,
      // Chart
      chartData: months,
      chartDataWeekly: weeks,
    });
  } catch (err) {
    console.error("[FINANCE DASHBOARD ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
