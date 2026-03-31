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

    const startCurrent = new Date(year, month - 1, 1);
    const endCurrent = new Date(year, month, 0, 23, 59, 59, 999);
    const startPrev = new Date(year, month - 2, 1);
    const endPrev = new Date(year, month - 1, 0, 23, 59, 59, 999);

    // Aggregate payments this month and last month
    const [paymentCurrent, paymentPrev] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { nominal: true },
        where: { tanggal: { gte: startCurrent, lte: endCurrent } },
      }),
      prisma.payment.aggregate({
        _sum: { nominal: true },
        where: { tanggal: { gte: startPrev, lte: endPrev } },
      }),
    ]);

    // Aggregate costs this month and last month
    const [costCurrent, costPrev] = await Promise.all([
      prisma.cost.aggregate({
        _sum: { nominal: true },
        where: { tanggal: { gte: startCurrent, lte: endCurrent } },
      }),
      prisma.cost.aggregate({
        _sum: { nominal: true },
        where: { tanggal: { gte: startPrev, lte: endPrev } },
      }),
    ]);

    const totalPendapatan = Number(paymentCurrent._sum.nominal ?? 0);
    const totalPengeluaran = Number(costCurrent._sum.nominal ?? 0);
    const prevPendapatan = Number(paymentPrev._sum.nominal ?? 0);
    const prevPengeluaran = Number(costPrev._sum.nominal ?? 0);

    // Piutang: orders with BELUM_BAYAR or DP
    const piutangOrders = await prisma.order.findMany({
      where: { statusPembayaran: { in: ["BELUM_BAYAR", "DP"] } },
      select: {
        grandTotal: true,
        payments: { select: { nominal: true } },
      },
    });

    const totalPiutang = piutangOrders.reduce((sum, o) => {
      const dibayar = o.payments.reduce((s, p) => s + Number(p.nominal), 0);
      return sum + Math.max(0, Number(o.grandTotal) - dibayar);
    }, 0);

    // Chart data: payments and costs grouped by week in current month
    const daysInMonth = endCurrent.getDate();
    const weeks: { label: string; pendapatan: number; pengeluaran: number }[] = [];
    let weekStart = 1;
    while (weekStart <= daysInMonth) {
      const weekEnd = Math.min(weekStart + 6, daysInMonth);
      weeks.push({ label: `${weekStart}-${weekEnd}`, pendapatan: 0, pengeluaran: 0 });
      weekStart += 7;
    }

    const [chartPayments, chartCosts] = await Promise.all([
      prisma.payment.findMany({
        where: { tanggal: { gte: startCurrent, lte: endCurrent } },
        select: { nominal: true, tanggal: true },
      }),
      prisma.cost.findMany({
        where: { tanggal: { gte: startCurrent, lte: endCurrent } },
        select: { nominal: true, tanggal: true },
      }),
    ]);

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
      totalPendapatan,
      totalPengeluaran,
      labaBersih: totalPendapatan - totalPengeluaran,
      totalPiutang,
      persenPendapatan: pctChange(totalPendapatan, prevPendapatan),
      persenPengeluaran: pctChange(totalPengeluaran, prevPengeluaran),
      persenLabaBersih: pctChange(
        totalPendapatan - totalPengeluaran,
        prevPendapatan - prevPengeluaran
      ),
      chartData: weeks,
    });
  } catch (err) {
    console.error("[FINANCE DASHBOARD ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
