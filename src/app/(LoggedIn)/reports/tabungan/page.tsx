"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, formatRupiah } from "@/lib/func";
import { PageHeader } from "@/components/page-header";
import { PeriodPicker } from "@/components/finance/period-picker";
import { Skeleton } from "@heroui/react";
import { PiggyBank, CalendarDays, TrendingUp } from "lucide-react";

const BULAN_SHORT = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

type TabunganRow = {
  nama: string;
  byBulan: Record<number, number>;
  total: number;
};
type TabunganData = {
  tahun: number;
  rows: TabunganRow[];
  grandTotal: number;
};

export default function LaporanTabunganPage() {
  const [tahun, setTahun] = useState(new Date().getFullYear());

  const { data, isLoading } = useSWR<TabunganData>(
    `/api/reports/finance/tabungan?tahun=${tahun}`,
    fetcher,
  );

  const bulanList = Array.from({ length: 12 }, (_, i) => i + 1);

  // Find best bulan
  const bestBulan =
    data?.rows && data.rows.length > 0
      ? bulanList.reduce((best, b) => {
          const total = data.rows.reduce(
            (s, r) => s + (r.byBulan[b] ?? 0),
            0,
          );
          const bestTotal = data.rows.reduce(
            (s, r) => s + (r.byBulan[best] ?? 0),
            0,
          );
          return total > bestTotal ? b : best;
        }, 1)
      : null;

  const activeBulanCount = bulanList.filter((b) =>
    (data?.rows ?? []).some((r) => (r.byBulan[b] ?? 0) > 0),
  ).length;

  return (
    <div className="flex flex-col gap-6 mb-6">
      <PageHeader
        title="Laporan Tabungan"
        description="Rekap alokasi tabungan perusahaan per kategori dan per bulan."
      />

      {/* Period controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-default-50 dark:bg-default-100/5 p-4 rounded-2xl border border-default-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-success/10">
            <PiggyBank size={18} className="text-success" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-default-800">
              Tahun {tahun}
            </h2>
            {data && !isLoading && (
              <p className="text-xs text-default-500 mt-0.5">
                Total Alokasi:{" "}
                <span className="font-bold text-success-700">
                  {formatRupiah(data.grandTotal)}
                </span>
              </p>
            )}
          </div>
        </div>
        <PeriodPicker
          bulan={1}
          tahun={tahun}
          onBulanChange={() => {}}
          onTahunChange={setTahun}
          hideBulan
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Grand Total */}
        <div className="rounded-2xl p-5 flex flex-col gap-3 border bg-success-50 dark:bg-success-950/30 text-success-800 dark:text-success-200 border-success-200 dark:border-success-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-white/20 dark:bg-black/20">
              <PiggyBank size={16} className="text-success-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
              Total Tabungan {tahun}
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-36 rounded-lg" />
          ) : (
            <span className="text-2xl font-bold tabular-nums">
              {formatRupiah(data?.grandTotal ?? 0)}
            </span>
          )}
        </div>

        {/* Active months */}
        <div className="rounded-2xl p-5 flex flex-col gap-3 border bg-primary-50 dark:bg-primary-950/30 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-white/20 dark:bg-black/20">
              <CalendarDays size={16} className="text-primary-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
              Bulan Aktif
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-20 rounded-lg" />
          ) : (
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold tabular-nums">
                {activeBulanCount}
              </span>
              <span className="text-sm opacity-60 mb-0.5">/ 12 bulan</span>
            </div>
          )}
        </div>

        {/* Best month */}
        <div className="rounded-2xl p-5 flex flex-col gap-3 border bg-warning-50 dark:bg-warning-950/30 text-warning-800 dark:text-warning-200 border-warning-200 dark:border-warning-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-white/20 dark:bg-black/20">
              <TrendingUp size={16} className="text-warning-500" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
              Bulan Terbanyak
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-24 rounded-lg" />
          ) : bestBulan ? (
            <div>
              <span className="text-2xl font-bold">{BULAN_SHORT[bestBulan]}</span>
              <p className="text-xs opacity-70 mt-0.5">
                {formatRupiah(
                  (data?.rows ?? []).reduce(
                    (s, r) => s + (r.byBulan[bestBulan] ?? 0),
                    0,
                  ),
                )}
              </p>
            </div>
          ) : (
            <span className="text-2xl font-bold">—</span>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="h-48 bg-default-100 rounded-2xl animate-pulse" />
      ) : !data || data.rows.length === 0 ? (
        <div className="p-10 text-center bg-content1 border border-default-200 rounded-2xl">
          <PiggyBank
            size={40}
            className="text-default-300 mx-auto mb-3"
          />
          <p className="text-sm text-default-500 font-medium">
            Belum ada data alokasi tabungan
          </p>
          <p className="text-xs text-default-400 mt-1">untuk tahun {tahun}</p>
        </div>
      ) : (
        <div className="bg-content1 border border-default-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-default-100 dark:bg-default-200/10 border-b border-default-200">
                  <th className="py-3 pl-5 pr-4 text-left text-xs font-semibold text-default-600 uppercase tracking-wide whitespace-nowrap min-w-[160px]">
                    Kategori Tabungan
                  </th>
                  {bulanList.map((b) => (
                    <th
                      key={b}
                      className="py-3 px-3 text-center text-xs font-semibold text-default-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {BULAN_SHORT[b]}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right text-xs font-semibold text-default-700 uppercase tracking-wide whitespace-nowrap">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr
                    key={row.nama}
                    className={`border-b border-default-100 hover:bg-default-50/60 transition-colors ${
                      i % 2 === 1 ? "bg-default-50/30 dark:bg-default-100/3" : ""
                    }`}
                  >
                    <td className="py-3 pl-5 pr-4 font-semibold text-default-700 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success-400 shrink-0" />
                        {row.nama}
                      </div>
                    </td>
                    {bulanList.map((b) => (
                      <td
                        key={b}
                        className={`py-3 px-3 text-center tabular-nums ${
                          row.byBulan[b]
                            ? "text-default-700 font-medium"
                            : "text-default-300"
                        }`}
                      >
                        {row.byBulan[b]
                          ? new Intl.NumberFormat("id-ID").format(row.byBulan[b])
                          : "—"}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-success-700 dark:text-success-400 whitespace-nowrap">
                      {formatRupiah(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-default-100 dark:bg-default-200/10 border-t-2 border-default-300">
                  <td className="py-3 pl-5 pr-4 font-bold text-default-800 text-sm">
                    Grand Total
                  </td>
                  {bulanList.map((b) => {
                    const colTotal = data.rows.reduce(
                      (s, r) => s + (r.byBulan[b] ?? 0),
                      0,
                    );
                    return (
                      <td
                        key={b}
                        className={`py-3 px-3 text-center tabular-nums font-semibold ${
                          colTotal > 0
                            ? "text-success-700 dark:text-success-400"
                            : "text-default-300"
                        }`}
                      >
                        {colTotal > 0
                          ? new Intl.NumberFormat("id-ID").format(colTotal)
                          : "—"}
                      </td>
                    );
                  })}
                  <td className="py-3 px-4 text-right tabular-nums font-bold text-success-800 dark:text-success-300 whitespace-nowrap">
                    {formatRupiah(data.grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
