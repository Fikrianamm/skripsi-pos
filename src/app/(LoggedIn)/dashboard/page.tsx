"use client";
import React, { useState } from "react";
import useSWR from "swr";
import { fetcher, formatRupiah } from "@/lib/func";
import { Skeleton } from "@heroui/skeleton";
import { Chip } from "@heroui/chip";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Users,
  ShoppingCart,
  AlertTriangle,
  Clock,
  PackageX,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// ── Types ────────────────────────────────────────────────────────────────────

interface LowStockItem {
  id: string;
  nama: string;
  stok: number;
  minStok: number;
  type: "bahan_baku" | "product";
  unit: { nama: string };
}

interface RecentOrder {
  id: string;
  nomorOrder: string;
  grandTotal: string | number;
  statusPembayaran: string;
  statusProduksi: string;
  createdAt: string;
  customer: { nama: string };
}

interface DashboardData {
  todaySales: number;
  totalPendapatan: number;
  totalPengeluaran: number;
  labaBersih: number;
  totalPiutang: number;
  totalCustomer: number;
  newOrdersToday: number;
  activeOrders: number;
  persenPendapatan: number;
  persenPengeluaran: number;
  persenLabaBersih: number;
  lowStockAlerts: LowStockItem[];
  recentOrders: RecentOrder[];
  chartData: { label: string; pendapatan: number; pengeluaran: number }[];
  chartDataWeekly: { label: string; pendapatan: number; pengeluaran: number }[];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TrendBadge({ pct }: { pct: number }) {
  if (pct > 0)
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
        <TrendingUp size={12} /> +{pct}%
      </span>
    );
  if (pct < 0)
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-red-500">
        <TrendingDown size={12} /> {pct}%
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-xs font-medium text-default-400">
      <Minus size={12} /> 0%
    </span>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  iconColor,
  trend,
  loading,
}: {
  title: string;
  value: string;
  sub?: React.ReactNode;
  icon: React.ElementType;
  iconColor: string;
  trend?: number;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-default-100 bg-white p-5 flex flex-col gap-3 shadow-sm">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-8 w-36 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-default-100 bg-white p-5 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm text-default-500 font-medium">{title}</span>
        <div className={`p-2 rounded-xl ${iconColor}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <div className="flex items-center gap-2">
        {trend !== undefined && <TrendBadge pct={trend} />}
        {sub && <span className="text-xs text-default-400">{sub}</span>}
      </div>
    </div>
  );
}

function paymentChipColor(
  s: string,
): "default" | "warning" | "success" | "danger" {
  if (s === "LUNAS") return "success";
  if (s === "DP") return "warning";
  return "default";
}

const paymentLabel: Record<string, string> = {
  BELUM_BAYAR: "Belum Bayar",
  DP: "DP",
  LUNAS: "Lunas",
};

// ── Main Page ────────────────────────────────────────────────────────────────

export default function Page() {
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  const { data, isLoading } = useSWR<DashboardData>(
    `/api/finance/dashboard?month=${month}&year=${year}`,
    fetcher,
    { refreshInterval: 60_000 },
  );

  // Format month name
  const monthName = new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-default-400 text-sm mt-0.5">
          Ringkasan bisnis bulan {monthName}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Penjualan Hari Ini"
          value={formatRupiah(data?.todaySales ?? 0)}
          icon={DollarSign}
          iconColor="bg-emerald-500"
          sub="hari ini"
          loading={isLoading}
        />
        <StatCard
          title="Pendapatan Bulan Ini"
          value={formatRupiah(data?.totalPendapatan ?? 0)}
          icon={TrendingUp}
          iconColor="bg-blue-500"
          trend={data?.persenPendapatan}
          sub="vs bulan lalu"
          loading={isLoading}
        />
        <StatCard
          title="Total Customer"
          value={String(data?.totalCustomer ?? 0)}
          icon={Users}
          iconColor="bg-violet-500"
          sub={`${data?.newOrdersToday ?? 0} order baru hari ini`}
          loading={isLoading}
        />
        <StatCard
          title="Order Aktif"
          value={String(data?.activeOrders ?? 0)}
          icon={ShoppingCart}
          iconColor="bg-amber-500"
          sub="sedang berjalan"
          loading={isLoading}
        />
        <StatCard
          title="Pengeluaran Bulan Ini"
          value={formatRupiah(data?.totalPengeluaran ?? 0)}
          icon={ArrowUpRight}
          iconColor="bg-red-500"
          trend={data?.persenPengeluaran}
          sub="vs bulan lalu"
          loading={isLoading}
        />
        <StatCard
          title="Laba Bersih"
          value={formatRupiah(data?.labaBersih ?? 0)}
          icon={TrendingUp}
          iconColor="bg-teal-500"
          trend={data?.persenLabaBersih}
          sub="vs bulan lalu"
          loading={isLoading}
        />
        <StatCard
          title="Total Piutang"
          value={formatRupiah(data?.totalPiutang ?? 0)}
          icon={Clock}
          iconColor="bg-orange-500"
          sub="belum terbayar"
          loading={isLoading}
        />
        <StatCard
          title="Stok Menipis"
          value={String(data?.lowStockAlerts?.length ?? 0)}
          icon={AlertTriangle}
          iconColor="bg-rose-500"
          sub={
            data
              ? `${data.lowStockAlerts.filter((i) => i.type === "bahan_baku").length} bahan baku · ${data.lowStockAlerts.filter((i) => i.type === "product").length} produk`
              : "item perlu restock"
          }
          loading={isLoading}
        />
      </div>

      {/* Chart + Low Stock side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-default-100 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-base mb-1">
            Grafik Pendapatan vs Pengeluaran
          </h2>
          <p className="text-xs text-default-400 mb-4">
            Mingguan — {monthName}
          </p>
          {isLoading ? (
            <Skeleton className="h-60 w-full rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart
                data={data?.chartDataWeekly ?? []}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="colorPendapatan"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient
                    id="colorPengeluaran"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}jt`
                      : `${(v / 1000).toFixed(0)}rb`
                  }
                />
                <Tooltip
                  formatter={
                    ((v: number) => formatRupiah(v)) as (
                      value: unknown,
                    ) => string
                  }
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) =>
                    value === "pendapatan" ? "Pendapatan" : "Pengeluaran"
                  }
                />
                <Area
                  type="monotone"
                  dataKey="pendapatan"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorPendapatan)"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="pengeluaran"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fill="url(#colorPengeluaran)"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-2xl border border-default-100 bg-white p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-50">
              <PackageX size={15} className="text-rose-500" />
            </div>
            <h2 className="font-semibold text-base">Stok Menipis</h2>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-11 rounded-lg" />
              ))}
            </div>
          ) : (data?.lowStockAlerts ?? []).length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-default-400 py-8 gap-2">
              <PackageX size={28} />
              <p className="text-sm">Semua stok aman</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[260px]">
              {(data?.lowStockAlerts ?? []).map((item) => {
                const pct =
                  item.minStok > 0
                    ? Math.round((item.stok / item.minStok) * 100)
                    : 0;
                return (
                  <Link
                    href={
                      item.type === "bahan_baku"
                        ? "/master/bahan-baku"
                        : "/master/product"
                    }
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium truncate">
                        {item.nama}
                      </span>
                      <span className="text-xs text-default-500 flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          item.type === "bahan_baku"
                            ? "bg-violet-100 text-violet-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {item.type === "bahan_baku" ? "Bahan Baku" : "Produk"}
                        </span>
                        Min {item.minStok} {item.unit.nama}
                      </span>
                    </div>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={pct <= 50 ? "danger" : "warning"}
                      className="shrink-0"
                    >
                      {item.stok} {item.unit.nama}
                    </Chip>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border border-default-100 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-base mb-3">Order Terbaru</h2>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-default-100">
            {(data?.recentOrders ?? []).length === 0 ? (
              <p className="text-sm text-default-400 py-6 text-center">
                Belum ada order
              </p>
            ) : (
              (data?.recentOrders ?? []).map((order) => (
                <Link
                  href={`/order/${order.id}`}
                  key={order.id}
                  className="flex items-center justify-between py-3 gap-3 hover:bg-default-50 px-2 -mx-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-medium text-sm">
                      {order.nomorOrder}
                    </span>
                    <span className="text-xs text-default-400 truncate">
                      {order.customer.nama} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Chip
                      size="sm"
                      variant="flat"
                      color={paymentChipColor(order.statusPembayaran)}
                    >
                      {paymentLabel[order.statusPembayaran] ??
                        order.statusPembayaran}
                    </Chip>
                    <span className="font-semibold text-sm">
                      {formatRupiah(Number(order.grandTotal))}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
