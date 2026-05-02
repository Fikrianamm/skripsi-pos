"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CostTable, CostData } from "./components/cost-table";
import { CostPieChart } from "./components/cost-pie-chart";
import { AddCostModal } from "./components/add-cost-modal";
import { SearchInput } from "@/components/search-input";
import {
  FilterLanjutan,
  FilterSection,
  FilterSelect,
} from "@/components/filter-lanjutan";
import { useDebounce } from "@/hooks/use-debounce";

const BULAN_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const bulanOptions = [
  { key: "", label: "Semua Bulan" },
  ...BULAN_NAMES.map((b, i) => ({ key: String(i + 1), label: b })),
];

function buildTahunOptions() {
  const now = new Date().getFullYear();
  const years = [];
  for (let y = now; y >= now - 4; y--) {
    years.push({ key: String(y), label: String(y) });
  }
  return [{ key: "", label: "Semua Tahun" }, ...years];
}
const tahunOptions = buildTahunOptions();

export default function CostPage() {
  const now = new Date();
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [akunId, setAkunId] = useState("");
  const [bulan, setBulan] = useState(String(now.getMonth() + 1));
  const [tahun, setTahun] = useState(String(now.getFullYear()));

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Kirim semua filter bersamaan — search + bulan/tahun bisa aktif sekaligus
  const params = new URLSearchParams({
    search: debouncedSearch,
    akunId,
    bulan,
    tahun,
    limit: "50",
  });

  const { data, isLoading, mutate } = useSWR(
    `/api/finance/cost?${params.toString()}`,
    fetcher,
  );

  const { data: akunData } = useSWR(`/api/finance/akun?isActive=true`, fetcher);

  const akunOptions = [
    { key: "", label: "Semua Akun" },
    ...(akunData?.akuns ?? []).map((a: { id: string; namaAkun: string }) => ({
      key: a.id,
      label: a.namaAkun,
    })),
  ];

  const costs: CostData[] = data?.results ?? [];

  // Compute summary stats
  const totalPengeluaran = costs.reduce(
    (acc: number, cost) => acc + Number(cost.nominal),
    0,
  );

  // Group by akun for pie chart
  const akunMap: Record<string, { nama: string; total: number }> = {};
  costs.forEach((c) => {
    if (!akunMap[c.akun.namaAkun]) {
      akunMap[c.akun.namaAkun] = { nama: c.akun.namaAkun, total: 0 };
    }
    akunMap[c.akun.namaAkun].total += Number(c.nominal);
  });
  const akunChartData = Object.values(akunMap)
    .sort((a, b) => b.total - a.total)
    .map((item) => ({
      ...item,
      persen: totalPengeluaran > 0 ? (item.total / totalPengeluaran) * 100 : 0,
    }));

  // Period label
  const bulanLabel = bulan ? BULAN_NAMES[parseInt(bulan) - 1] : "Semua Bulan";
  const periodLabel =
    bulan && tahun
      ? `${bulanLabel} ${tahun}`
      : tahun
        ? `Tahun ${tahun}`
        : "Semua Periode";

  // Month nav
  function prevMonth() {
    const b = parseInt(bulan || "1");
    const y = parseInt(tahun || String(now.getFullYear()));
    if (b === 1) {
      setBulan("12");
      setTahun(String(y - 1));
    } else {
      setBulan(String(b - 1));
    }
  }
  function nextMonth() {
    const b = parseInt(bulan || "12");
    const y = parseInt(tahun || String(now.getFullYear()));
    if (b === 12) {
      setBulan("1");
      setTahun(String(y + 1));
    } else {
      setBulan(String(b + 1));
    }
  }

  const activeFilterCount =
    (akunId ? 1 : 0) +
    (bulan !== String(now.getMonth() + 1) ? 1 : 0) +
    (tahun !== String(now.getFullYear()) ? 1 : 0);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Laporan Pengeluaran"
        description="Kelola dan catat semua biaya operasional, gaji bulanan, tagihan, hingga pembelian yang memotong Kas/Bank Anda."
      />

      {/* Period Navigator */}
      <div className="flex items-center gap-3">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg border border-default-200 hover:bg-default-100 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-foreground min-w-[140px] text-center">
          {periodLabel}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg border border-default-200 hover:bg-default-100 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Summary: Total + Pie Chart dalam satu card */}
      <CostPieChart
        data={akunChartData}
        total={totalPengeluaran}
        totalTransaksi={costs.length}
        periodLabel={periodLabel}
        isLoading={isLoading}
      />

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-2">
        <SearchInput
          value={search}
          placeholder="Cari nama atau keterangan pengeluaran..."
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="w-full"
        />
        <div className="flex flex-row gap-2 items-center justify-start">
          <FilterLanjutan
            activeCount={activeFilterCount}
            onReset={() => {
              setAkunId("");
              setBulan(String(now.getMonth() + 1));
              setTahun(String(now.getFullYear()));
              setSearch("");
            }}
          >
            <FilterSection label="Bulan">
              <FilterSelect
                options={bulanOptions}
                value={bulan}
                onChange={setBulan}
              />
            </FilterSection>
            <FilterSection label="Tahun">
              <FilterSelect
                options={tahunOptions}
                value={tahun}
                onChange={setTahun}
              />
            </FilterSection>
            <FilterSection label="Akun Beban">
              <FilterSelect
                options={akunOptions}
                value={akunId}
                onChange={setAkunId}
              />
            </FilterSection>
          </FilterLanjutan>
          <AddCostModal
            isOpen={isAddModalOpen}
            onOpenChange={setIsAddModalOpen}
            onSuccess={() => mutate()}
          />
        </div>
      </div>

      {/* Table */}
      <CostTable costs={costs} isLoading={isLoading} onSuccess={() => mutate()} />
    </div>
  );
}
