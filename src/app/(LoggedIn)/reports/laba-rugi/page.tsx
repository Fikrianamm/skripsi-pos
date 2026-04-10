"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, formatRupiah } from "@/lib/func";
import { PageHeader } from "@/components/page-header";
import { PeriodPicker, BULAN_LABELS } from "@/components/finance/period-picker";
import { Chip, Skeleton } from "@heroui/react";
import {
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  ShoppingCart,
  Receipt,
  BadgeDollarSign,
} from "lucide-react";

type PLRow = { kode: string; nama: string; total: number };
type PLData = {
  bulan: number;
  tahun: number;
  pendapatan: PLRow[];
  hpp: PLRow[];
  marketing: PLRow[];
  gaji: PLRow[];
  administrasi: PLRow[];
  totalPendapatan: number;
  totalHPP: number;
  labaKotor: number;
  totalMarketing: number;
  totalGaji: number;
  totalAdm: number;
  totalBebanOperasional: number;
  labaBersih: number;
  margin: number;
};

function KpiCard({
  label,
  sublabel,
  value,
  icon,
  colorClass,
  isLoading,
}: {
  label: string;
  sublabel?: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  isLoading: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-3 border ${colorClass}`}>
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-white/20 dark:bg-black/20">{icon}</div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide opacity-80 block">
            {label}
          </span>
          {sublabel && (
            <span className="text-xs opacity-50">{sublabel}</span>
          )}
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-36 rounded-lg" />
      ) : (
        <span className="text-2xl font-bold tabular-nums">
          {formatRupiah(value)}
        </span>
      )}
    </div>
  );
}

function SectionHeader({
  label,
  colorClass,
}: {
  label: string;
  colorClass: string;
}) {
  return (
    <tr>
      <td
        colSpan={2}
        className={`py-2.5 px-4 text-xs font-bold uppercase tracking-widest ${colorClass}`}
      >
        {label}
      </td>
    </tr>
  );
}

function SubgroupHeader({ label }: { label: string }) {
  return (
    <tr className="bg-default-50/80 dark:bg-default-100/5">
      <td
        colSpan={2}
        className="py-1.5 px-6 text-xs font-semibold text-default-500 uppercase tracking-wide"
      >
        {label}
      </td>
    </tr>
  );
}

function DataRow({
  label,
  amount,
  indent = false,
  bold = false,
  small = false,
  colorClass,
}: {
  label: string;
  amount: number;
  indent?: boolean;
  bold?: boolean;
  small?: boolean;
  colorClass?: string;
}) {
  return (
    <tr
      className={`border-b border-default-100 ${
        bold ? "bg-default-50/80 dark:bg-default-100/5" : "hover:bg-default-50/40 transition-colors"
      }`}
    >
      <td
        className={`py-2 pr-4 ${indent ? "pl-10" : "pl-4"} ${
          small ? "text-xs" : "text-sm"
        } ${bold ? "font-bold" : ""} ${colorClass ?? "text-default-700"}`}
      >
        {label}
      </td>
      <td
        className={`py-2 px-4 text-right tabular-nums ${
          small ? "text-xs" : "text-sm"
        } ${bold ? "font-bold" : ""} ${colorClass ?? ""}`}
      >
        {formatRupiah(amount)}
      </td>
    </tr>
  );
}

function EmptyRow() {
  return (
    <tr className="border-b border-default-50">
      <td colSpan={2} className="py-1.5 pl-10 text-xs text-default-400 italic">
        — belum ada transaksi —
      </td>
    </tr>
  );
}

export default function LabaRugiPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  const { data, isLoading } = useSWR<PLData>(
    `/api/reports/finance/laba-rugi?bulan=${bulan}&tahun=${tahun}`,
    fetcher,
  );

  const isMeetingTarget = (data?.margin ?? 0) >= 15;

  return (
    <div className="flex flex-col gap-6 mb-6">
      <PageHeader
        title="Laporan Laba Rugi"
        description="Ringkasan pendapatan, beban pokok, dan laba bersih per periode."
      />

      {/* Period controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-default-50 dark:bg-default-100/5 p-4 rounded-2xl border border-default-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-success/10">
            <BadgeDollarSign size={18} className="text-success" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-default-800">
              Periode: {BULAN_LABELS[bulan]} {tahun}
            </h2>
            {data && !isLoading && (
              <Chip
                size="sm"
                variant="flat"
                color={isMeetingTarget ? "success" : "warning"}
                className="mt-1"
                startContent={
                  isMeetingTarget ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )
                }
              >
                Margin: {data.margin}%{" "}
                {isMeetingTarget ? "(✓ ≥ 15%)" : "(✗ < 15%)"}
              </Chip>
            )}
          </div>
        </div>
        <PeriodPicker
          bulan={bulan}
          tahun={tahun}
          onBulanChange={setBulan}
          onTahunChange={setTahun}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Pendapatan"
          sublabel="Total Omzet"
          value={data?.totalPendapatan ?? 0}
          icon={<CircleDollarSign size={16} className="text-primary-400" />}
          colorClass="bg-primary-50 dark:bg-primary-950/30 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800"
          isLoading={isLoading}
        />
        <KpiCard
          label="HPP"
          sublabel="Harga Pokok Produksi"
          value={data?.totalHPP ?? 0}
          icon={<ShoppingCart size={16} className="text-danger-400" />}
          colorClass="bg-danger-50 dark:bg-danger-950/30 text-danger-800 dark:text-danger-200 border-danger-200 dark:border-danger-800"
          isLoading={isLoading}
        />
        <KpiCard
          label="Beban Operasional"
          sublabel="Marketing + Gaji + Adm"
          value={data?.totalBebanOperasional ?? 0}
          icon={<Receipt size={16} className="text-warning-500" />}
          colorClass="bg-warning-50 dark:bg-warning-950/30 text-warning-800 dark:text-warning-200 border-warning-200 dark:border-warning-800"
          isLoading={isLoading}
        />
        <KpiCard
          label="Laba Bersih"
          sublabel={data ? `Margin ${data.margin}%` : ""}
          value={data?.labaBersih ?? 0}
          icon={
            (data?.labaBersih ?? 0) >= 0 ? (
              <TrendingUp size={16} className="text-success-400" />
            ) : (
              <TrendingDown size={16} className="text-danger-400" />
            )
          }
          colorClass={
            (data?.labaBersih ?? 0) >= 0
              ? "bg-success-50 dark:bg-success-950/30 text-success-800 dark:text-success-200 border-success-200 dark:border-success-800"
              : "bg-danger-50 dark:bg-danger-950/30 text-danger-800 dark:text-danger-200 border-danger-200 dark:border-danger-800"
          }
          isLoading={isLoading}
        />
      </div>

      {/* Detail Table */}
      <div className="bg-content1 border border-default-200 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        ) : !data ? (
          <div className="p-10 text-center text-sm text-default-400">
            Gagal memuat data laporan.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-default-100 dark:bg-default-200/10 border-b border-default-200">
                <th className="py-3 pl-4 text-left text-xs font-semibold text-default-600 uppercase tracking-wide">
                  Keterangan
                </th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-default-600 uppercase tracking-wide">
                  Jumlah (Rp)
                </th>
              </tr>
            </thead>
            <tbody>
              {/* PENDAPATAN */}
              <SectionHeader
                label="I. Pendapatan"
                colorClass="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
              />
              {data.pendapatan.length === 0 ? (
                <EmptyRow />
              ) : (
                data.pendapatan.map((r) => (
                  <DataRow
                    key={r.kode}
                    label={`${r.kode} — ${r.nama}`}
                    amount={r.total}
                    indent
                    small
                  />
                ))
              )}
              <DataRow
                label="Total Pendapatan"
                amount={data.totalPendapatan}
                bold
                colorClass="text-primary-700"
              />

              {/* HPP */}
              <SectionHeader
                label="II. Harga Pokok Produksi (HPP)"
                colorClass="bg-danger-50/60 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300"
              />
              {data.hpp.length === 0 ? (
                <EmptyRow />
              ) : (
                data.hpp.map((r) => (
                  <DataRow
                    key={r.kode}
                    label={`${r.kode} — ${r.nama}`}
                    amount={r.total}
                    indent
                    small
                  />
                ))
              )}
              <DataRow
                label="Total HPP"
                amount={data.totalHPP}
                bold
                colorClass="text-danger-700"
              />

              {/* LABA KOTOR */}
              <DataRow
                label={`Laba Kotor  (Pendapatan − HPP)`}
                amount={data.labaKotor}
                bold
                colorClass={
                  data.labaKotor >= 0 ? "text-success-700" : "text-danger-700"
                }
              />

              {/* BEBAN OPERASIONAL */}
              <SectionHeader
                label="III. Beban Operasional"
                colorClass="bg-warning-50/80 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300"
              />

              <SubgroupHeader label="Marketing" />
              {data.marketing.length === 0 ? (
                <EmptyRow />
              ) : (
                data.marketing.map((r) => (
                  <DataRow
                    key={r.kode}
                    label={`${r.kode} — ${r.nama}`}
                    amount={r.total}
                    indent
                    small
                  />
                ))
              )}
              <DataRow
                label="Subtotal Marketing"
                amount={data.totalMarketing}
              />

              <SubgroupHeader label="Gaji & SDM" />
              {data.gaji.length === 0 ? (
                <EmptyRow />
              ) : (
                data.gaji.map((r) => (
                  <DataRow
                    key={r.kode}
                    label={`${r.kode} — ${r.nama}`}
                    amount={r.total}
                    indent
                    small
                  />
                ))
              )}
              <DataRow label="Subtotal Gaji" amount={data.totalGaji} />

              <SubgroupHeader label="Administrasi & Umum" />
              {data.administrasi.length === 0 ? (
                <EmptyRow />
              ) : (
                data.administrasi.map((r) => (
                  <DataRow
                    key={r.kode}
                    label={`${r.kode} — ${r.nama}`}
                    amount={r.total}
                    indent
                    small
                  />
                ))
              )}
              <DataRow
                label="Subtotal Administrasi"
                amount={data.totalAdm}
              />

              <DataRow
                label="Total Beban Operasional"
                amount={data.totalBebanOperasional}
                bold
                colorClass="text-warning-700"
              />

              {/* LABA BERSIH */}
              <tr
                className={`border-t-2 ${
                  data.labaBersih >= 0
                    ? "border-success-300 bg-success-50 dark:bg-success-950/30"
                    : "border-danger-300 bg-danger-50 dark:bg-danger-950/30"
                }`}
              >
                <td
                  className={`py-4 pl-4 text-base font-bold ${
                    data.labaBersih >= 0
                      ? "text-success-800 dark:text-success-300"
                      : "text-danger-800 dark:text-danger-300"
                  }`}
                >
                  {data.labaBersih >= 0 ? "✓ " : "✗ "}LABA BERSIH
                </td>
                <td
                  className={`py-4 px-4 text-right text-base font-bold tabular-nums ${
                    data.labaBersih >= 0
                      ? "text-success-800 dark:text-success-300"
                      : "text-danger-800 dark:text-danger-300"
                  }`}
                >
                  {formatRupiah(data.labaBersih)}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
