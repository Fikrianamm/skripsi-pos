"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatRupiah } from "@/lib/func";
import { Skeleton } from "@heroui/react";
import { TrendingDown, CalendarDays } from "lucide-react";

interface AkunSummary {
  nama: string;
  total: number;
  persen: number;
}

interface CostPieChartProps {
  data: AkunSummary[];
  total: number;
  totalTransaksi: number;
  periodLabel: string;
  isLoading: boolean;
}

const COLORS = [
  "hsl(0, 72%, 58%)",
  "hsl(221, 83%, 63%)",
  "hsl(38, 95%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(280, 65%, 58%)",
  "hsl(195, 72%, 48%)",
  "hsl(330, 65%, 56%)",
  "hsl(60, 80%, 45%)",
];

// Custom tooltip — wrapperStyle handles z-index since it's a portal outside SVG
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: AkunSummary }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-background border border-default-200 rounded-xl shadow-xl px-4 py-3 text-sm min-w-[180px]">
      <p className="font-semibold text-foreground mb-1 truncate max-w-[200px]">{p.nama}</p>
      <p className="text-danger font-bold">{formatRupiah(p.total)}</p>
      <p className="text-foreground-400">{p.persen.toFixed(1)}% dari total</p>
    </div>
  );
}

// Custom legend list
function AkunLegend({ data }: { data: AkunSummary[] }) {
  return (
    <div className="flex flex-col gap-2.5 overflow-y-auto" style={{ maxHeight: 180 }}>
      {data.map((item, i) => (
        <div key={item.nama} className="flex items-center gap-2 text-xs min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: COLORS[i % COLORS.length] }}
          />
          <span className="truncate text-foreground-600 flex-1" title={item.nama}>
            {item.nama}
          </span>
          <span className="font-semibold text-foreground shrink-0">
            {item.persen.toFixed(0)}%
          </span>
          <span className="text-foreground-400 shrink-0 hidden sm:inline">
            {formatRupiah(item.total)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CostPieChart({
  data,
  total,
  totalTransaksi,
  periodLabel,
  isLoading,
}: CostPieChartProps) {
  if (isLoading) {
    return (
      <div className="col-span-full grid grid-cols-1 md:grid-cols-[auto_1fr] rounded-2xl border border-default-200 overflow-hidden">
        {/* Left: total skeleton */}
        <div className="flex flex-col gap-3 p-6 bg-danger-50 dark:bg-danger-950/30 min-w-[220px]">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
          <Skeleton className="h-9 w-44 rounded-lg mt-1" />
          <Skeleton className="h-3 w-28 rounded-md" />
          <Skeleton className="h-3 w-20 rounded-md mt-1" />
        </div>
        {/* Right: chart skeleton */}
        <div className="flex items-center gap-6 p-6 bg-default-50 dark:bg-default-100/5">
          <Skeleton className="h-40 w-40 rounded-full shrink-0" />
          <div className="flex flex-col gap-3 flex-1">
            {[140, 100, 120, 80, 110].map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
                <Skeleton className={`h-3 rounded-md`} style={{ width: w }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-full grid grid-cols-1 md:grid-cols-[auto_1fr] rounded-2xl border border-default-200 overflow-hidden">
      {/* ── Left: Total Pengeluaran ────────────────────────────────── */}
      <div className="flex flex-col gap-3 p-6 bg-danger-50 dark:bg-danger-950/30 text-danger-800 dark:text-danger-300 border-b md:border-b-0 md:border-r border-danger-200 dark:border-danger-800 min-w-[220px]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-danger-100 dark:bg-danger-900/50 shrink-0">
            <TrendingDown size={16} className="text-danger-600" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Total Pengeluaran
          </span>
        </div>

        <span className="text-2xl font-bold leading-tight">
          {formatRupiah(total)}
        </span>

        <div className="flex flex-col gap-1 mt-auto">
          <span className="text-xs opacity-60 flex items-center gap-1">
            <CalendarDays size={11} />
            {periodLabel}
          </span>
          <span className="text-xs opacity-50">
            {totalTransaksi} transaksi tercatat
          </span>
        </div>
      </div>

      {/* ── Right: Pie Chart ───────────────────────────────────────── */}
      <div className="flex flex-col gap-3 p-6 bg-default-50 dark:bg-default-100/5">
        <span className="text-xs font-semibold uppercase tracking-wide text-foreground-400">
          Distribusi per Akun Beban
        </span>

        {data.length === 0 ? (
          <div className="flex items-center justify-center min-h-[120px]">
            <span className="text-sm text-foreground-400">Belum ada data pengeluaran</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Donut */}
            <div className="relative shrink-0" style={{ width: 160, height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    dataKey="total"
                    nameKey="nama"
                    strokeWidth={0}
                  >
                    {data.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  {/* wrapperStyle sets z-index on the portal div recharts creates */}
                  <Tooltip
                    content={<CustomTooltip />}
                    wrapperStyle={{ zIndex: 9999 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label — rendered after SVG in DOM so it's naturally on top */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              >
                <span className="text-[10px] text-foreground-400 font-medium">Total</span>
                <span className="text-[11px] font-bold text-foreground leading-tight text-center px-2">
                  {formatRupiah(total)}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 w-full">
              <AkunLegend data={data} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
