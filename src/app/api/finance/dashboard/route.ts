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
      lowStockBahanBaku,
      lowStockProducts,
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
      prisma.customer.count(),
      // New orders today
      prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      // Active orders (not SELESAI or BATAL)
      prisma.order.count({
        where: { statusProduksi: { notIn: ["SELESAI", "BATAL"] } },
      }),
      // Piutang
      prisma.order.findMany({
        where: { statusPembayaran: { in: ["BELUM_BAYAR", "DP"] } },
        select: {
          grandTotal: true,
          payments: { select: { nominal: true } },
        },
      }),
      // Low stock bahan baku (stok < minStok and minStok not null)
      prisma.$queryRaw<
        { id: string; nama: string; stok: number; minStok: number; unitNama: string }[]
      >`
        SELECT b.id, b.nama, CAST(b.stok AS DECIMAL(10,2)) as stok, 
               CAST(b.min_stok AS DECIMAL(10,2)) as minStok, u.nama as unitNama
        FROM bahan_baku b
        LEFT JOIN unit u ON u.id = b.unit_id
        WHERE b.is_active = 1 AND b.min_stok IS NOT NULL AND b.stok < b.min_stok
        ORDER BY b.stok ASC
        LIMIT 10
      `,
      // Low stock products (stok < minStok and isService=false)
      prisma.$queryRaw<
        { id: string; nama: string; stok: number; minStok: number; unitNama: string }[]
      >`
        SELECT p.id, p.nama, CAST(p.stok AS DECIMAL(10,2)) as stok,
               CAST(p.min_stok AS DECIMAL(10,2)) as minStok, u.nama as unitNama
        FROM product p
        LEFT JOIN unit u ON u.id = p.unit_id
        WHERE p.is_service = 0 AND p.min_stok IS NOT NULL AND p.stok < p.min_stok
        ORDER BY p.stok ASC
        LIMIT 10
      `,
      // Recent orders (last 5)
      prisma.order.findMany({
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
        where: { tanggal: { gte: startCurrent, lte: endCurrent } },
        select: { nominal: true, tanggal: true },
      }),
      // Chart costs
      prisma.cost.findMany({
        where: { tanggal: { gte: startCurrent, lte: endCurrent } },
        select: { nominal: true, tanggal: true },
      }),
    ]);

    const totalPendapatan = Number(paymentCurrent._sum.nominal ?? 0);
    const totalPengeluaran = Number(costCurrent._sum.nominal ?? 0);
    const prevPendapatan = Number(paymentPrev._sum.nominal ?? 0);
    const prevPengeluaran = Number(costPrev._sum.nominal ?? 0);
    const todaySales = Number(todayPayment._sum.nominal ?? 0);

    const totalPiutang = piutangOrders.reduce((sum, o) => {
      const dibayar = o.payments.reduce((s, p) => s + Number(p.nominal), 0);
      return sum + Math.max(0, Number(o.grandTotal) - dibayar);
    }, 0);

    // Chart data: grouped by week in current month
    const daysInMonth = endCurrent.getDate();
    const weeks: { label: string; pendapatan: number; pengeluaran: number }[] =
      [];
    let weekStart = 1;
    while (weekStart <= daysInMonth) {
      const weekEnd = Math.min(weekStart + 6, daysInMonth);
      weeks.push({
        label: `${weekStart}-${weekEnd}`,
        pendapatan: 0,
        pengeluaran: 0,
      });
      weekStart += 7;
    }

    for (const p of chartPayments) {
      const day = new Date(p.tanggal).getDate();
      const weekIndex = Math.min(Math.floor((day - 1) / 7), weeks.length - 1);
      weeks[weekIndex].pendapatan += Number(p.nominal);
    }
    for (const c of chartCosts) {
      const day = new Date(c.tanggal).getDate();
      const weekIndex = Math.min(Math.floor((day - 1) / 7), weeks.length - 1);
      weeks[weekIndex].pengeluaran += Number(c.nominal);
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
          unit: { nama: b.unitNama ?? "" },
        })),
        ...lowStockProducts.map((p) => ({
          id: p.id,
          nama: p.nama,
          type: "product" as const,
          stok: Number(p.stok),
          minStok: Number(p.minStok),
          unit: { nama: p.unitNama ?? "" },
        })),
      ],
      recentOrders,
      // Chart
      chartData: weeks,
    });
  } catch (err) {
    console.error("[FINANCE DASHBOARD ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
