import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function requireDashboardAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized", status: 401 };
  const allowed = ["admin", "kasir"];
  if (!session.user.role || !allowed.includes(session.user.role)) return { error: "Forbidden", status: 403 };
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

    const startCurrent = new Date(year, month - 1, 1);
    const endCurrent = new Date(year, month, 0, 23, 59, 59, 999);
    const startPrev = new Date(year, month - 2, 1);
    const endPrev = new Date(year, month - 1, 0, 23, 59, 59, 999);

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
      paymentCurrent,
      paymentPrev,
      costCurrent,
      costPrev,
      todayPayment,
      totalCustomer,
      newOrdersToday,
      activeOrders,
      piutangOrders,
      allBahanBaku,
      allProducts,
      recentOrders,
      chartPayments,
      chartCosts,
    ] = await Promise.all([
      // Monthly payments
      prisma.payment.aggregate({
        _sum: { nominal: true },
        where: { tanggal: { gte: startCurrent, lte: endCurrent } },
      }),
      prisma.payment.aggregate({
        _sum: { nominal: true },
        where: { tanggal: { gte: startPrev, lte: endPrev } },
      }),
      // Monthly costs
      prisma.cost.aggregate({
        _sum: { nominal: true },
        where: { tanggal: { gte: startCurrent, lte: endCurrent } },
      }),
      prisma.cost.aggregate({
        _sum: { nominal: true },
        where: { tanggal: { gte: startPrev, lte: endPrev } },
      }),
      // Today's payment total
      prisma.payment.aggregate({
        _sum: { nominal: true },
        where: { tanggal: { gte: startOfToday } },
      }),
      // Total customers
      prisma.customer.count({ where: { deletedAt: null } }),
      // New orders today
      prisma.order.count({ where: { createdAt: { gte: startOfToday }, deletedAt: null } }),
      // Active orders (not SELESAI or BATAL)
      prisma.order.count({
        where: { statusProduksi: { notIn: ["SELESAI", "BATAL"] }, deletedAt: null },
      }),
      // Piutang
      prisma.order.findMany({
        where: { statusPembayaran: { in: ["BELUM_BAYAR", "DP"] }, deletedAt: null },
        select: {
          grandTotal: true,
          payments: { select: { nominal: true } },
        },
      }),
      // Fetch all active materials with minStok to filter in JS
      prisma.bahanBaku.findMany({
        where: { isActive: true, minStok: { not: null } },
        select: { id: true, nama: true, stok: true, minStok: true, unit: { select: { nama: true } } },
      }),
      // Fetch all products with minStok to filter in JS
      prisma.product.findMany({
        where: { isService: false, minStok: { not: null }, deletedAt: null },
        select: { id: true, nama: true, stok: true, minStok: true, unit: { select: { nama: true } } },
      }),
      // Recent orders (last 5)
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
      // Chart payments
      prisma.payment.findMany({
        where: { tanggal: { gte: startCurrent, lte: endCurrent }, deletedAt: null },
        select: { nominal: true, tanggal: true },
      }),
      // Chart costs
      prisma.cost.findMany({
        where: { tanggal: { gte: startCurrent, lte: endCurrent }, deletedAt: null },
        select: { nominal: true, tanggal: true },
      }),
    ]);

    // Filter low stock in JS
    const lowStockBahanBaku = allBahanBaku
      .filter((b) => Number(b.stok) < Number(b.minStok))
      .sort((a, b) => Number(a.stok) - Number(b.stok))
      .slice(0, 10);

    const lowStockProducts = allProducts
      .filter((p) => Number(p.stok) < Number(p.minStok))
      .sort((a, b) => Number(a.stok) - Number(b.stok))
      .slice(0, 10);

    const totalPendapatan = Number(paymentCurrent._sum.nominal ?? 0);
    const totalPengeluaran = Number(costCurrent._sum.nominal ?? 0);
    const prevPendapatan = Number(paymentPrev._sum.nominal ?? 0);
    const prevPengeluaran = Number(costPrev._sum.nominal ?? 0);
    const todaySales = Number(todayPayment._sum.nominal ?? 0);

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

    for (const p of chartPayments) {
      const day = new Date(p.tanggal).getDate();
      const w = Math.min(Math.floor((day - 1) / 7), 4); // 0 to 4
      weeks[w].pendapatan += Number(p.nominal);
    }
    for (const c of chartCosts) {
      const day = new Date(c.tanggal).getDate();
      const w = Math.min(Math.floor((day - 1) / 7), 4);
      weeks[w].pengeluaran += Number(c.nominal);
    }

    // Chart data: grouped by month in the selected year
    const months: { label: string; pendapatan: number; pengeluaran: number }[] =
      Array.from({ length: 12 }, (_, i) => ({
        label: new Date(year, i, 1).toLocaleDateString("id-ID", {
          month: "short",
        }),
        pendapatan: 0,
        pengeluaran: 0,
      }));

    // Re-fetch journals for the whole year for chart data
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const [yearPayments, yearCosts] = await Promise.all([
      prisma.payment.findMany({
        where: { tanggal: { gte: startOfYear, lte: endOfYear }, deletedAt: null },
        select: { nominal: true, tanggal: true },
      }),
      prisma.cost.findMany({
        where: { tanggal: { gte: startOfYear, lte: endOfYear }, deletedAt: null },
        select: { nominal: true, tanggal: true },
      }),
    ]);

    for (const p of yearPayments) {
      const m = new Date(p.tanggal).getMonth();
      months[m].pendapatan += Number(p.nominal);
    }
    for (const c of yearCosts) {
      const m = new Date(c.tanggal).getMonth();
      months[m].pengeluaran += Number(c.nominal);
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
