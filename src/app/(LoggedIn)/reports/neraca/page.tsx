"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, formatRupiah } from "@/lib/func";
import { PageHeader } from "@/components/page-header";
import { PeriodPicker, BULAN_LABELS } from "@/components/finance/period-picker";
import { Chip, Skeleton } from "@heroui/react";
import {
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Wallet,
  PiggyBank,
  Scale,
} from "lucide-react";

type AccRow = {
  id: string;
  kodeAkun: string;
  namaAkun: string;
  kelompok: string;
  saldo: number;
};
type NeracaData = {
  bulan: number;
  tahun: number;
  isBalanced: boolean;
  aktiva: {
    lancar: AccRow[];
    tetap: AccRow[];
    totalLancar: number;
    totalTetap: number;
    total: number;
  };
  pasiva: {
    kewajiban: AccRow[];
    modal: AccRow[];
    labaBerjalan: number;
    totalKewajiban: number;
    totalModal: number;
    total: number;
  };
};

function AccGroup({
  title,
  rows,
  total,
  accent,
}: {
  title: string;
  rows: AccRow[];
  total: number;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-0">
      {/* Group header */}
      <div className={`px-4 py-2 rounded-lg mb-1 ${accent}`}>
        <span className="text-xs font-bold uppercase tracking-widest">
          {title}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-2 text-xs text-default-400 italic">
          — belum ada saldo —
        </p>
      ) : (
        <div className="divide-y divide-default-100">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex justify-between px-4 py-2 hover:bg-default-50/60 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-mono text-default-400 shrink-0">
                  {r.kodeAkun}
                </span>
                <span className="text-sm text-default-700 truncate">
                  {r.namaAkun}
                </span>
              </div>
              <span className="text-sm tabular-nums font-medium text-right ml-4 shrink-0">
                {formatRupiah(r.saldo)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Group subtotal */}
      <div className="flex justify-between px-4 py-2 border-t border-default-200 mt-1 bg-default-50/80 rounded-b-lg">
        <span className="text-xs font-semibold text-default-500 uppercase tracking-wide">
          Subtotal {title}
        </span>
        <span className="text-sm tabular-nums font-bold">
          {formatRupiah(total)}
        </span>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  colorClass,
  isLoading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  isLoading: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-3 border ${colorClass}`}>
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-white/20 dark:bg-black/20">
          {icon}
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
          {label}
        </span>
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

export default function NeracaPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  const { data, isLoading } = useSWR<NeracaData>(
    `/api/reports/finance/neraca?bulan=${bulan}&tahun=${tahun}`,
    fetcher,
  );

  return (
    <div className="flex flex-col gap-6 mb-6">
      <PageHeader
        title="Laporan Neraca"
        description="Posisi keuangan perusahaan — Aktiva harus selalu sama dengan Kewajiban + Modal."
      />

      {/* Period controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-default-50 dark:bg-default-100/5 p-4 rounded-2xl border border-default-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Scale size={18} className="text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-default-800">
              Per Akhir {BULAN_LABELS[bulan]} {tahun}
            </h2>
            {data && !isLoading && (
              <Chip
                size="sm"
                variant="flat"
                color={data.isBalanced ? "success" : "danger"}
                className="mt-1"
                startContent={
                  data.isBalanced ? (
                    <CheckCircle size={12} />
                  ) : (
                    <AlertTriangle size={12} />
                  )
                }
              >
                {data.isBalanced
                  ? "Neraca Seimbang ✓"
                  : "⚠ Neraca Tidak Seimbang!"}
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

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Total Aktiva"
          value={data?.aktiva.total ?? 0}
          icon={<TrendingUp size={16} className="text-primary-400" />}
          colorClass="bg-primary-50 dark:bg-primary-950/30 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800"
          isLoading={isLoading}
        />
        <KpiCard
          label="Total Kewajiban"
          value={data?.pasiva.totalKewajiban ?? 0}
          icon={<Wallet size={16} className="text-danger-400" />}
          colorClass="bg-danger-50 dark:bg-danger-950/30 text-danger-800 dark:text-danger-200 border-danger-200 dark:border-danger-800"
          isLoading={isLoading}
        />
        <KpiCard
          label="Total Modal + Laba"
          value={
            (data?.pasiva.totalModal ?? 0) + (data?.pasiva.labaBerjalan ?? 0)
          }
          icon={<PiggyBank size={16} className="text-success-400" />}
          colorClass="bg-success-50 dark:bg-success-950/30 text-success-800 dark:text-success-200 border-success-200 dark:border-success-800"
          isLoading={isLoading}
        />
      </div>

      {/* Main content */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-72 bg-default-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : !data ? (
        <div className="p-10 text-center text-sm text-default-400 bg-content1 border border-default-200 rounded-2xl">
          Gagal memuat data neraca.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AKTIVA */}
          <div className="bg-content1 border border-default-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 bg-gradient-to-r from-primary-600 to-primary-500 flex items-center gap-2">
              <TrendingUp size={16} className="text-white/80" />
              <h3 className="text-white font-bold text-sm uppercase tracking-widest">
                Aktiva / Harta
              </h3>
            </div>

            <div className="p-4 flex flex-col gap-4">
              <AccGroup
                title="Aktiva Lancar"
                rows={data.aktiva.lancar}
                total={data.aktiva.totalLancar}
                accent="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
              />
              <AccGroup
                title="Aktiva Tetap"
                rows={data.aktiva.tetap}
                total={data.aktiva.totalTetap}
                accent="bg-primary-100/60 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400"
              />
            </div>

            <div className="px-5 py-3 bg-primary-700 dark:bg-primary-800 flex justify-between items-center">
              <span className="text-white font-bold text-sm uppercase tracking-wide">
                Total Aktiva
              </span>
              <span className="text-white font-bold text-base tabular-nums">
                {formatRupiah(data.aktiva.total)}
              </span>
            </div>
          </div>

          {/* PASIVA */}
          <div className="bg-content1 border border-default-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 bg-gradient-to-r from-danger-600 to-danger-500 flex items-center gap-2">
              <Wallet size={16} className="text-white/80" />
              <h3 className="text-white font-bold text-sm uppercase tracking-widest">
                Pasiva / Kewajiban + Modal
              </h3>
            </div>

            <div className="p-4 flex flex-col gap-4">
              <AccGroup
                title="Kewajiban"
                rows={data.pasiva.kewajiban}
                total={data.pasiva.totalKewajiban}
                accent="bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300"
              />
              <AccGroup
                title="Modal"
                rows={data.pasiva.modal}
                total={data.pasiva.totalModal}
                accent="bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300"
              />

              {/* Laba Berjalan */}
              <div>
                <div className="px-4 py-2 rounded-lg mb-1 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300">
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Laba / Rugi Berjalan
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2 hover:bg-default-50/60 transition-colors">
                  <span className="text-sm text-default-600">
                    Akumulasi Laba Berjalan
                  </span>
                  <span
                    className={`text-sm tabular-nums font-semibold ${
                      data.pasiva.labaBerjalan >= 0
                        ? "text-success-700"
                        : "text-danger-700"
                    }`}
                  >
                    {formatRupiah(data.pasiva.labaBerjalan)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-danger-700 dark:bg-danger-800 flex justify-between items-center">
              <span className="text-white font-bold text-sm uppercase tracking-wide">
                Total Pasiva
              </span>
              <span className="text-white font-bold text-base tabular-nums">
                {formatRupiah(data.pasiva.total)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
