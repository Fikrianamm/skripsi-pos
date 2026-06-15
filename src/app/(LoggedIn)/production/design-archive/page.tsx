"use client";

import React from "react";
import useSWR from "swr";
import { fetcher, toISO } from "@/lib/func";
import { useDebounce } from "@/hooks/use-debounce";
import { Button, Divider, Pagination, type RangeValue } from "@heroui/react";
import { Images } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import {
  FilterButtonGroup,
  FilterLanjutan,
  FilterSection,
} from "@/components/filter-lanjutan";
import {
  FileCard,
  FileCardSkeleton,
  DesignFileItem,
} from "./components/file-card";
import { DateRangePicker } from "@heroui/date-picker";
import type { DateValue } from "@internationalized/date";

// ── Filter options ─────────────────────────────────────────────────────────────
const TAHAP_OPTIONS = [
  { key: "PENDING", label: "Pending" },
  { key: "DESAIN", label: "Desain" },
  { key: "PRODUKSI", label: "Produksi" },
  { key: "PACKING", label: "Packing" },
  { key: "SELESAI", label: "Selesai" },
  { key: "BATAL", label: "Batal" },
];

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Page() {
  const [search, setSearch] = React.useState("");
  const [tahapFilter, setTahapFilter] = React.useState("all");
  const [dateRange, setDateRange] =
    React.useState<RangeValue<DateValue> | null>(null);
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const limit = 24; // 4 kolom × 6 baris

  const dateFrom = toISO(dateRange?.start);
  const dateTo = toISO(dateRange?.end);
  const apiUrl = `/api/production/design-archive?page=${page}&limit=${limit}&search=${debouncedSearch}&tahap=${tahapFilter}${dateFrom ? `&dateFrom=${dateFrom}` : ""}${dateTo ? `&dateTo=${dateTo}` : ""}`;

  const { data, isLoading } = useSWR(apiUrl, fetcher, {
    keepPreviousData: true,
  });

  const files: DesignFileItem[] = data?.results ?? [];
  const totalPages = data?.count ? Math.ceil(data.count / limit) : 0;

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, tahapFilter, dateRange]);

  const activeFilters =
    tahapFilter !== "all" || search !== "" || dateRange !== null;
  const filterCount =
    (tahapFilter !== "all" ? 1 : 0) + (dateRange !== null ? 1 : 0);

  function resetFilters() {
    setSearch("");
    setTahapFilter("all");
    setDateRange(null);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-5 mb-6">
      <PageHeader
        title="Bank Desain"
        description="Semua file desain dari seluruh order — cari dan akses dengan mudah."
      />

      {/* ── Filter Bar ── */}
      <div className="flex flex-col md:flex-row gap-2">
        <SearchInput
          value={search}
          placeholder="Cari nama file, nomor order, atau customer..."
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="w-full"
        />
        <div className="flex flex-row gap-2 items-center justify-start">
          <FilterLanjutan activeCount={filterCount} onReset={resetFilters}>
            <FilterSection label="Tahap Produksi">
              <FilterButtonGroup
                options={TAHAP_OPTIONS}
                value={tahapFilter}
                onChange={setTahapFilter}
              />
            </FilterSection>
            <FilterSection label="Tanggal Upload">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                granularity="day"
                size="sm"
                className="w-full"
                label="Pilih rentang tanggal"
              />
            </FilterSection>
          </FilterLanjutan>
        </div>
      </div>
      {data?.count !== undefined && (
        <div className="flex gap-2 items-center">
          <span className="text-xs text-default-400 tabular-nums">
            {data.count} file ditemukan
          </span>
          <Divider className="flex-1" />
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <FileCardSkeleton key={i} />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-default-400">
          <Images size={56} strokeWidth={1.1} />
          <div className="text-center">
            <p className="text-base font-medium">
              Tidak ada file desain ditemukan
            </p>
            <p className="text-sm mt-1">
              {activeFilters
                ? "Coba ubah atau reset filter di atas."
                : "File desain akan muncul di sini setelah diupload dari halaman Antrean Desain."}
            </p>
          </div>
          {activeFilters && (
            <Button size="sm" variant="flat" onPress={resetFilters}>
              Reset Filter
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {files.map((file) => (
            <FileCard key={file.id} file={file} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center pt-2">
          <Pagination
            total={totalPages}
            page={page}
            onChange={setPage}
            showControls
            size="sm"
            color="primary"
            variant="flat"
          />
        </div>
      )}
    </div>
  );
}
