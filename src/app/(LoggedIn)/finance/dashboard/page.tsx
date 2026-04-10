"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, formatRupiah } from "@/lib/func";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@heroui/react";
import { FilterLanjutan, FilterSection, FilterSelect } from "@/components/filter-lanjutan";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
  Activity,
  ShoppingCart,
  Megaphone,
  Users,
  FileText,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ─── Constants ──────────────────────────────────────────────────────────────
const TARGET_MARGIN = 15;

const MONTHS = [
  { key: "1",  label: "Januari"   }, { key: "2",  label: "Februari"  },
  { key: "3",  label: "Maret"     }, { key: "4",  label: "April"     },
  { key: "5",  label: "Mei"       }, { key: "6",  label: "Juni"      },
  { key: "7",  label: "Juli"      }, { key: "8",  label: "Agustus"   },
  { key: "9",  label: "September" }, { key: "10", label: "Oktober"   },
  { key: "11", label: "November"  }, { key: "12", label: "Desember"  },
];
const YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return { key: String(y), label: String(y) };
});

const BIAYA_COLORS = ["#6366f1", "#f59e0b", "#22c55e", "#3b82f6"];

// ─── Types ───────────────────────────────────────────────────────────────────
type DashboardData = {
  totalPendapatan:  number;
  totalPengeluaran: number;
  labaBersih:       number;
  totalPiutang:     number;
  persenPendapatan:  number;
  persenPengeluaran: number;
  persenLabaBersih:  number;
  chartData: { label: string; pendapatan: number; pengeluaran: number }[];
};

type AkunRow = { kode: string; nama: string; total: number };
type LabaRugiData = {
  pendapatan:  AkunRow[];
  marketing:   AkunRow[];
  totalPendapatan:       number;
  totalHPP:             number;
  totalMarketing:       number;
  totalGaji:            number;
  totalAdm:             number;
  totalBebanOperasional: number;
  labaBersih:           number;
  margin:               number;
};

// ─── Small Components ────────────────────────────────────────────────────────
function TrendBadge({ persen }: { persen: number }) {
  if (persen > 0)
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-success-600">
        <TrendingUp size={12} /> +{persen}%
      </span>
    );
  if (persen < 0)
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-danger-600">
        <TrendingDown size={12} /> {persen}%
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-default-400">
      <Minus size={12} /> 0%
    </span>
  );
}

interface KpiCardProps {
  title: string;
  value:number;
  persen?: number;
  icon: React.ReactNode;
  accentColor: string;  // Tailwind bg- class for left border
  iconBg: string;
  iconColor: string;
  isLoading?: boolean;
}
function KpiCard({ title, value, persen, icon, accentColor, iconBg, iconColor, isLoading }: KpiCardProps) {
  return (
    <div className="relative flex flex-col gap-3 p-5 rounded-xl border border-default-200 bg-content1 overflow-hidden shadow-sm">
      <div className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${accentColor}`} />
      <div className="flex items-center justify-between">
        <span className="text-xs text-default-500 font-semibold uppercase tracking-wide">{title}</span>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-36 rounded-lg" />
      ) : (
        <span className="text-2xl font-bold tabular-nums tracking-tight text-default-900">
          {formatRupiah(value)}
        </span>
      )}
      {persen !== undefined && !isLoading && (
        <div className="flex items-center gap-1.5">
          <TrendBadge persen={persen} />
          <span className="text-[11px] text-default-400">vs bulan lalu</span>
        </div>
      )}
    </div>
  );
}

function MarginCard({ margin, isLoading }: { margin: number; isLoading?: boolean }) {
  const isMet = margin >= TARGET_MARGIN;
  return (
    <div
      className={`relative flex flex-col gap-3 p-5 rounded-xl border overflow-hidden shadow-sm ${
        isMet ? "bg-success-50 border-success-200" : "bg-warning-50 border-warning-200"
      }`}
    >
      <div className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${isMet ? "bg-success-500" : "bg-warning-500"}`} />
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wide ${isMet ? "text-success-700" : "text-warning-700"}`}>
          Profit Margin
        </span>
        <div className={`p-2 rounded-lg ${isMet ? "bg-success-100" : "bg-warning-100"}`}>
          <Activity size={16} className={isMet ? "text-success-700" : "text-warning-700"} />
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-10 w-24 rounded-lg" />
      ) : (
        <span className={`text-3xl font-bold tabular-nums ${isMet ? "text-success-800" : "text-warning-800"}`}>
          {margin.toFixed(1)}%
        </span>
      )}
      {!isLoading && (
        <span className={`text-[11px] font-semibold ${isMet ? "text-success-600" : "text-warning-600"}`}>
          {isMet ? `✓ Target ${TARGET_MARGIN}% tercapai` : `✗ Di bawah target ${TARGET_MARGIN}%`}
        </span>
      )}
    </div>
  );
}

// ─── Tooltip formatter ───────────────────────────────────────────────────────
const fmtTooltip = (v: unknown) => [formatRupiah(Number(v ?? 0)), ""];
const fmtAxis = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt`
  : v >= 1_000   ? `${(v / 1_000).toFixed(0)}rb`
  : String(v);

// ─── Page ────────────────────────────────────────────────────────────────────
export default function DashboardKeuanganPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(String(now.getMonth() + 1));
  const [tahun, setTahun] = useState(String(now.getFullYear()));

  const { data: dash, isLoading: loadingDash } = useSWR<DashboardData>(
    `/api/finance/dashboard?month=${bulan}&year=${tahun}`,
    fetcher,
  );
  const { data: pl, isLoading: loadingPL } = useSWR<LabaRugiData>(
    `/api/reports/finance/laba-rugi?bulan=${bulan}&tahun=${tahun}`,
    fetcher,
  );

  const isLoading = loadingDash || loadingPL;

  // Operational cost chart data
  const biayaData = [
    { name: "HPP",             value: pl?.totalHPP       ?? 0, icon: <ShoppingCart size={13} /> },
    { name: "Marketing",       value: pl?.totalMarketing ?? 0, icon: <Megaphone    size={13} /> },
    { name: "Gaji Karyawan",   value: pl?.totalGaji      ?? 0, icon: <Users        size={13} /> },
    { name: "Adm & Umum",      value: pl?.totalAdm       ?? 0, icon: <FileText     size={13} /> },
  ];

  const totalPendapatanPL = pl?.totalPendapatan ?? 0;

  return (
    <div className="flex flex-col gap-6 mb-6">
      <PageHeader
        title="Dashboard Keuangan"
        description="Ringkasan kesehatan keuangan perusahaan berdasarkan data akuntansi"
      />

      {/* ── Period Selector ── */}
      <div className="flex gap-2 items-center">
        <FilterLanjutan
          activeCount={
            bulan !== String(now.getMonth() + 1) || tahun !== String(now.getFullYear()) ? 1 : 0
          }
          onReset={() => {
            setBulan(String(now.getMonth() + 1));
            setTahun(String(now.getFullYear()));
          }}
        >
          <FilterSection label="Bulan">
            <FilterSelect options={MONTHS} value={bulan} onChange={setBulan} />
          </FilterSection>
          <FilterSection label="Tahun">
            <FilterSelect options={YEARS} value={tahun} onChange={setTahun} />
          </FilterSection>
        </FilterLanjutan>
      </div>

      {/* ── Section 1: KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Pendapatan"
          value={dash?.totalPendapatan ?? 0}
          persen={dash?.persenPendapatan}
          icon={<ArrowUpCircle size={16} />}
          accentColor="bg-success-500"
          iconBg="bg-success-100"
          iconColor="text-success-700"
          isLoading={isLoading}
        />
        <KpiCard
          title="Total Pengeluaran"
          value={pl?.totalBebanOperasional ?? 0}
          persen={dash?.persenPengeluaran}
          icon={<ArrowDownCircle size={16} />}
          accentColor="bg-danger-500"
          iconBg="bg-danger-100"
          iconColor="text-danger-700"
          isLoading={isLoading}
        />
        <KpiCard
          title="Laba Bersih"
          value={pl?.labaBersih ?? 0}
          persen={dash?.persenLabaBersih}
          icon={<DollarSign size={16} />}
          accentColor={(pl?.labaBersih ?? 0) >= 0 ? "bg-primary-500" : "bg-danger-500"}
          iconBg={(pl?.labaBersih ?? 0) >= 0 ? "bg-primary-100" : "bg-danger-100"}
          iconColor={(pl?.labaBersih ?? 0) >= 0 ? "text-primary-700" : "text-danger-700"}
          isLoading={isLoading}
        />
        <MarginCard margin={pl?.margin ?? 0} isLoading={isLoading} />
        <KpiCard
          title="Piutang Beredar"
          value={dash?.totalPiutang ?? 0}
          icon={<AlertCircle size={16} />}
          accentColor="bg-warning-500"
          iconBg="bg-warning-100"
          iconColor="text-warning-700"
          isLoading={isLoading}
        />
      </div>

      {/* ── Section 2: Line Chart Tren ── */}
      <div className="bg-content1 border border-default-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-default-700 mb-4">
          Tren Pendapatan &amp; Pengeluaran
          <span className="ml-2 text-xs font-normal text-default-400">(per minggu)</span>
        </h3>
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={dash?.chartData ?? []}
              margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--heroui-default-200))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: string) => `Minggu ${v.split("-")[0]}`}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={fmtAxis}
                width={56}
              />
              <Tooltip formatter={fmtTooltip} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="pendapatan"
                name="Pendapatan"
                stroke="#17c964"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="pengeluaran"
                name="Pengeluaran"
                stroke="#f31260"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Section 3: 2-col — Biaya Operasional + Rincian Pendapatan ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Biaya Operasional — horizontal bar chart */}
        <div className="bg-content1 border border-default-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-default-700 mb-1">Biaya Operasional</h3>
          <p className="text-xs text-default-400 mb-4">
            Total:{" "}
            <span className="font-semibold text-default-700">
              {formatRupiah(pl?.totalBebanOperasional ?? 0)}
            </span>
          </p>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                layout="vertical"
                data={biayaData}
                margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--heroui-default-200))" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={fmtAxis} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                <Tooltip formatter={fmtTooltip} />
                <Bar dataKey="value" name="Nominal" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {biayaData.map((_, i) => (
                    <Cell key={i} fill={BIAYA_COLORS[i % BIAYA_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Rincian Pendapatan — progress bar list */}
        <div className="bg-content1 border border-default-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-default-700 mb-1">Rincian Pendapatan</h3>
          <p className="text-xs text-default-400 mb-4">
            Total:{" "}
            <span className="font-semibold text-default-700">
              {formatRupiah(totalPendapatanPL)}
            </span>
          </p>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : (pl?.pendapatan ?? []).length === 0 ? (
            <p className="text-xs text-default-400 text-center py-8">Belum ada data pendapatan</p>
          ) : (
            <div className="flex flex-col gap-4">
              {(pl?.pendapatan ?? [])
                .sort((a, b) => b.total - a.total)
                .map((row) => {
                  const pct = totalPendapatanPL > 0
                    ? (row.total / totalPendapatanPL) * 100
                    : 0;
                  return (
                    <div key={row.kode} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-default-700 font-medium truncate max-w-[60%]" title={row.nama}>
                          {row.nama}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-default-400">{pct.toFixed(1)}%</span>
                          <span className="font-semibold text-default-800 tabular-nums">
                            {formatRupiah(row.total)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-default-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-success-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 4: Rincian Biaya Marketing ── */}
      <div className="bg-content1 border border-default-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-default-700 mb-1">Rincian Biaya Marketing</h3>
        <p className="text-xs text-default-400 mb-4">
          Total:{" "}
          <span className="font-semibold text-default-700">
            {formatRupiah(pl?.totalMarketing ?? 0)}
          </span>
        </p>
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (pl?.marketing ?? []).length === 0 ? (
          <p className="text-xs text-default-400 text-center py-6">
            Belum ada biaya marketing pada periode ini
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-default-200">
                <th className="py-2 text-left text-xs font-semibold text-default-500 uppercase">
                  Akun
                </th>
                <th className="py-2 text-left text-xs font-semibold text-default-500 uppercase">
                  Kode
                </th>
                <th className="py-2 text-right text-xs font-semibold text-default-500 uppercase">
                  Nominal
                </th>
                <th className="py-2 text-right text-xs font-semibold text-default-500 uppercase">
                  % dari Total
                </th>
              </tr>
            </thead>
            <tbody>
              {(pl?.marketing ?? [])
                .sort((a, b) => b.total - a.total)
                .map((row) => {
                  const pct =
                    (pl?.totalMarketing ?? 0) > 0
                      ? (row.total / (pl?.totalMarketing ?? 1)) * 100
                      : 0;
                  return (
                    <tr key={row.kode} className="border-b border-default-100 hover:bg-default-50 transition-colors">
                      <td className="py-2.5 text-default-700">{row.nama}</td>
                      <td className="py-2.5 font-mono text-xs text-default-400">{row.kode}</td>
                      <td className="py-2.5 text-right font-semibold tabular-nums text-default-900">
                        {formatRupiah(row.total)}
                      </td>
                      <td className="py-2.5 text-right text-default-500 tabular-nums">
                        {pct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-default-200 bg-default-50">
                <td colSpan={2} className="py-2.5 font-bold text-default-700 text-sm">
                  Total Marketing
                </td>
                <td className="py-2.5 text-right font-bold tabular-nums text-default-900">
                  {formatRupiah(pl?.totalMarketing ?? 0)}
                </td>
                <td className="py-2.5 text-right font-bold text-default-500">100%</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
