"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, formatRupiah } from "@/lib/func";
import { PageHeader } from "@/components/page-header";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
} from "lucide-react";
import { Select, SelectItem } from "@heroui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const MONTHS = [
  { key: "1", label: "Januari" },
  { key: "2", label: "Februari" },
  { key: "3", label: "Maret" },
  { key: "4", label: "April" },
  { key: "5", label: "Mei" },
  { key: "6", label: "Juni" },
  { key: "7", label: "Juli" },
  { key: "8", label: "Agustus" },
  { key: "9", label: "September" },
  { key: "10", label: "Oktober" },
  { key: "11", label: "November" },
  { key: "12", label: "Desember" },
];

const YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return { key: String(y), label: String(y) };
});

type DashboardData = {
  totalPendapatan: number;
  totalPengeluaran: number;
  labaBersih: number;
  totalPiutang: number;
  persenPendapatan: number;
  persenPengeluaran: number;
  persenLabaBersih: number;
  chartData: { label: string; pendapatan: number; pengeluaran: number }[];
};

function TrendBadge({ persen }: { persen: number }) {
  if (persen > 0)
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-success">
        <TrendingUp size={13} /> +{persen}%
      </span>
    );
  if (persen < 0)
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-danger">
        <TrendingDown size={13} /> {persen}%
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-default-400">
      <Minus size={13} /> 0%
    </span>
  );
}

type SummaryCard = {
  title: string;
  value: number;
  persen?: number;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
};

function SummaryCard({ title, value, persen, icon, colorClass, bgClass }: SummaryCard) {
  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-5 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-default-500 font-medium">{title}</span>
        <div className={`p-2 rounded-lg ${bgClass}`}>
          <span className={colorClass}>{icon}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-bold tabular-nums">{formatRupiah(value)}</span>
        {persen !== undefined && (
          <div className="flex items-center gap-1">
            <TrendBadge persen={persen} />
            <span className="text-xs text-default-400">vs bulan lalu</span>
          </div>
        )}
      </div>
    </div>
  );
}

const formatTooltip = (value: unknown) => formatRupiah(Number(value ?? 0));

export default function DashboardKeuanganPage() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const { data, isLoading } = useSWR<DashboardData>(
    `/api/finance/dashboard?month=${month}&year=${year}`,
    fetcher
  );

  const cards = data
    ? [
        {
          title: "Total Pendapatan",
          value: data.totalPendapatan,
          persen: data.persenPendapatan,
          icon: <ArrowUpCircle size={20} />,
          colorClass: "text-success",
          bgClass: "bg-success-50",
        },
        {
          title: "Total Pengeluaran",
          value: data.totalPengeluaran,
          persen: data.persenPengeluaran,
          icon: <ArrowDownCircle size={20} />,
          colorClass: "text-danger",
          bgClass: "bg-danger-50",
        },
        {
          title: "Laba Bersih",
          value: data.labaBersih,
          persen: data.persenLabaBersih,
          icon: <DollarSign size={20} />,
          colorClass: data.labaBersih >= 0 ? "text-primary" : "text-danger",
          bgClass: data.labaBersih >= 0 ? "bg-primary-50" : "bg-danger-50",
        },
        {
          title: "Piutang Beredar",
          value: data.totalPiutang,
          icon: <AlertCircle size={20} />,
          colorClass: "text-warning",
          bgClass: "bg-warning-50",
        },
      ]
    : [];

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-6 mb-4">
      <PageHeader
        title="Dashboard Keuangan"
        description="Ringkasan kesehatan keuangan perusahaan"
      />

      {/* Period Selector */}
      <div className="flex gap-2 items-center">
        <Select
          label="Bulan"
          selectedKeys={[month]}
          onSelectionChange={(keys) => setMonth(String([...keys][0]))}
          size="sm"
          className="w-36"
          variant="bordered"
        >
          {MONTHS.map((m) => (
            <SelectItem key={m.key}>{m.label}</SelectItem>
          ))}
        </Select>
        <Select
          label="Tahun"
          selectedKeys={[year]}
          onSelectionChange={(keys) => setYear(String([...keys][0]))}
          size="sm"
          className="w-28"
          variant="bordered"
        >
          {YEARS.map((y) => (
            <SelectItem key={y.key}>{y.label}</SelectItem>
          ))}
        </Select>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-content1 border border-default-200 rounded-xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <SummaryCard key={card.title} {...card} />
          ))}
        </div>
      )}

      {/* Bar Chart */}
      <div className="bg-content1 border border-default-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-default-700 mb-4">
          Pendapatan vs Pengeluaran (Per Minggu)
        </h3>
        {isLoading ? (
          <div className="h-64 animate-pulse bg-default-100 rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data?.chartData ?? []}
              margin={{ top: 4, right: 16, left: 16, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--heroui-default-200))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `Minggu ${v.split("-")[0]}`}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(0)}jt`
                    : v >= 1_000
                    ? `${(v / 1_000).toFixed(0)}rb`
                    : String(v)
                }
                width={56}
              />
              <Tooltip formatter={formatTooltip} />
              <Legend />
              <Bar dataKey="pendapatan" name="Pendapatan" fill="#17c964" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#f31260" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
