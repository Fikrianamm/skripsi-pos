"use client";

import React from "react";
import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/func";
import { useDebounce } from "@/hooks/use-debounce";
import { Button, Chip, Divider, Skeleton, Switch } from "@heroui/react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  PackageSearch,
  User,
} from "lucide-react";
import { addToast } from "@heroui/toast";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import {
  FilterLanjutan,
  FilterSection,
  FilterButtonGroup,
  FilterSelect,
} from "@/components/filter-lanjutan";

// ── Types ──────────────────────────────────────────────────────────────────────
interface SpkItem {
  id: string;
  orderId: string;
  tahapProduksi: string;
  model: string | null;
  ukuran: string | null;
  tali: string | null;
  jumlah: number;
  catatan: string | null;
  tanggalSetor: string | null;
  accCetak: boolean;
  accCetakAt: string | null;
  accCetakOleh: string | null;
  statusSPK: string;
  createdAt: string;
  karyawan: { id: string; nama: string; posisi: string | null };
  order: {
    id: string;
    nomorOrder: string;
    deadline: string | null;
    statusProduksi: string;
    customer: { id: string; nama: string; nomorHp: string };
    items: { nama: string; qty: number }[];
  };
}

interface KaryawanOption {
  id: string;
  nama: string;
  posisi: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function statusSPKBadge(s: string) {
  const map: Record<
    string,
    {
      color: "success" | "warning" | "danger" | "default" | "primary";
      label: string;
    }
  > = {
    AKTIF: { color: "success", label: "Aktif" },
    SELESAI: { color: "primary", label: "Selesai" },
    REVISI: { color: "warning", label: "Revisi" },
    DRAFT: { color: "default", label: "Draft" },
    BATAL: { color: "danger", label: "Batal" },
  };
  return map[s] ?? { color: "default" as const, label: s };
}

function isOverdue(tanggalSetor: string | null) {
  if (!tanggalSetor) return false;
  return new Date(tanggalSetor) < new Date();
}

function formatDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(d: string | null): number | null {
  if (!d) return null;
  const diff = new Date(d).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── SPK Card ───────────────────────────────────────────────────────────────────
function SpkQueueCard({
  spk,
  onToggleAcc,
  isTogglingId,
}: {
  spk: SpkItem;
  onToggleAcc: (spk: SpkItem, val: boolean) => void;
  isTogglingId: string | null;
}) {
  const badge = statusSPKBadge(spk.statusSPK);
  const overdue = isOverdue(spk.tanggalSetor);
  const days = daysUntil(spk.tanggalSetor);
  const isSelesai = spk.statusSPK === "SELESAI";

  return (
    <div
      className={`rounded-xl border bg-content1 shadow-sm overflow-hidden transition-opacity ${
        isSelesai ? "opacity-60" : ""
      }`}
    >
      {/* ── Top bar: deadline warning ── */}
      {overdue && !isSelesai && (
        <div className="bg-danger-50 border-b border-danger-200 px-4 py-1.5 flex items-center gap-1.5 text-danger text-xs font-medium">
          <AlertCircle size={13} />
          Deadline terlewat · {formatDate(spk.tanggalSetor)}
        </div>
      )}
      {!overdue && days !== null && days <= 2 && !isSelesai && (
        <div className="bg-warning-50 border-b border-warning-200 px-4 py-1.5 flex items-center gap-1.5 text-warning-700 text-xs font-medium">
          <AlertCircle size={13} />
          Deadline {days === 0 ? "hari ini" : `${days} hari lagi`} ·{" "}
          {formatDate(spk.tanggalSetor)}
        </div>
      )}

      <div className="p-4 flex flex-col gap-3">
        {/* ── Header row ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/order/${spk.orderId}`}
              className="font-mono font-semibold text-sm text-primary hover:underline flex items-center gap-1"
            >
              {spk.order.nomorOrder}
              <ExternalLink size={11} />
            </Link>
            <span className="text-xs text-default-500">
              {spk.order.customer.nama}
              {spk.order.customer.nomorHp && (
                <> · {spk.order.customer.nomorHp}</>
              )}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Chip size="sm" color={badge.color} variant="flat">
              {badge.label}
            </Chip>
          </div>
        </div>

        <Divider className="my-0" />

        {/* ── Detail grid ── */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {/* Karyawan */}
          <div className="flex items-center gap-2 col-span-2">
            <User size={14} className="text-default-400 shrink-0" />
            <div>
              <p className="font-medium text-sm">{spk.karyawan.nama}</p>
              {spk.karyawan.posisi && (
                <p className="text-xs text-default-400">
                  {spk.karyawan.posisi}
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-default-400">Model</p>
            <p className="font-medium">{spk.model || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-default-400">Ukuran</p>
            <p className="font-medium">{spk.ukuran || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-default-400">Tali</p>
            <p>{spk.tali || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-default-400">Jumlah</p>
            <p className="font-semibold text-base">{Number(spk.jumlah)} pcs</p>
          </div>
        </div>

        {/* Items pesanan */}
        {spk.order.items.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {spk.order.items.map((item, i) => (
              <Chip key={i} size="sm" variant="flat" color="default">
                {item.nama} ×{item.qty}
              </Chip>
            ))}
          </div>
        )}

        {/* Catatan */}
        {spk.catatan && (
          <p className="text-xs text-default-500 italic bg-default-50 rounded-lg px-3 py-2">
            {spk.catatan}
          </p>
        )}

        <Divider className="my-0" />

        {/* ── Footer: Deadline + ACC Cetak ── */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar
              size={13}
              className={
                overdue && !isSelesai
                  ? "text-danger"
                  : days !== null && days <= 2 && !isSelesai
                    ? "text-warning-600"
                    : "text-default-400"
              }
            />
            <span
              className={
                overdue && !isSelesai
                  ? "text-danger font-medium"
                  : days !== null && days <= 2 && !isSelesai
                    ? "text-warning-600 font-medium"
                    : "text-default-500"
              }
            >
              {spk.tanggalSetor
                ? formatDate(spk.tanggalSetor)
                : "Tanpa deadline"}
            </span>
          </div>

          {/* ACC Cetak */}
          <div className="flex items-center gap-1.5">
            <CheckCircle2
              size={14}
              className={spk.accCetak ? "text-success" : "text-default-300"}
            />
            <span className="text-xs text-default-500">ACC Cetak</span>
            <Switch
              size="sm"
              color="success"
              isSelected={spk.accCetak}
              onValueChange={(val) => onToggleAcc(spk, val)}
              isDisabled={isTogglingId === spk.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Loading skeleton ────────────────────────────────────────────────────────────
function SpkCardSkeleton() {
  return (
    <div className="rounded-xl border bg-content1 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-36 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-lg" />
      </div>
      <Skeleton className="h-3 w-48 rounded-lg" />
      <Divider />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-24 rounded-lg" />
        <Skeleton className="h-5 w-20 rounded-lg" />
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { key: "all", label: "Semua Status" },
  { key: "AKTIF", label: "Aktif" },
  { key: "SELESAI", label: "Selesai" },
  { key: "REVISI", label: "Revisi" },
  { key: "DRAFT", label: "Draft" },
  { key: "BATAL", label: "Batal" },
];

const ACC_OPTIONS = [
  { key: "all", label: "Semua" },
  { key: "true", label: "Sudah ACC" },
  { key: "false", label: "Belum ACC" },
];

export default function Page() {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [accFilter, setAccFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [isTogglingId, setIsTogglingId] = React.useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const limit = 18; // 3 kolom × 6 baris

  // Load karyawan untuk filter
  const { data: karyawanData } = useSWR(
    "/api/admin/karyawan?isActive=true&limit=100",
    fetcher,
  );
  const karyawanList: KaryawanOption[] = karyawanData?.results ?? [];
  const [karyawanFilter, setKaryawanFilter] = React.useState("all");

  const apiUrl = `/api/production/spk?page=${page}&limit=${limit}&search=${debouncedSearch}&statusSPK=${statusFilter}&accCetak=${accFilter}&karyawanId=${karyawanFilter === "all" ? "" : karyawanFilter}`;

  const { data, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    keepPreviousData: true,
    refreshInterval: 30_000, // auto-refresh tiap 30 detik
  });

  const spkList: SpkItem[] = data?.results ?? [];
  const totalPages = data?.count ? Math.ceil(data.count / limit) : 0;

  // Toggle ACC cetak
  async function handleToggleAcc(spk: SpkItem, val: boolean) {
    setIsTogglingId(spk.id);
    try {
      const res = await fetch(`/api/order/${spk.orderId}/spk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accCetak: val }),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast({ title: "Gagal", description: json.error, color: "danger" });
        return;
      }
      addToast({
        title: val ? "ACC Cetak diaktifkan" : "ACC Cetak dinonaktifkan",
        color: "success",
      });
      mutate();
    } finally {
      setIsTogglingId(null);
    }
  }

  // Reset page saat filter berubah
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, accFilter, karyawanFilter]);

  const activeFilters =
    statusFilter !== "all" ||
    accFilter !== "all" ||
    karyawanFilter !== "all" ||
    search !== "";

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-5 mb-6">
      <PageHeader
        title="Antrian Produksi (SPK)"
        description="Pantau dan kelola Surat Perintah Kerja."
      />

      {/* ── Filters ── */}
      <div className="flex flex-col md:flex-row gap-2">
        <SearchInput
          value={search}
          placeholder="Cari nomor order, customer, karyawan..."
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="w-full"
        />
        <div className="flex flex-row gap-2 items-center justify-start">
          <FilterLanjutan
            activeCount={
              (statusFilter !== "all" ? 1 : 0) +
              (accFilter !== "all" ? 1 : 0) +
              (karyawanFilter !== "all" ? 1 : 0)
            }
            onReset={() => {
              setSearch("");
              setStatusFilter("all");
              setAccFilter("all");
              setKaryawanFilter("all");
            }}
          >
            <FilterSection label="Status SPK">
              <FilterButtonGroup
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </FilterSection>
            <FilterSection label="Karyawan">
              <FilterSelect
                value={karyawanFilter}
                onChange={setKaryawanFilter}
                options={[
                  { key: "all", label: "Semua Karyawan" },
                  ...karyawanList.map((k) => ({ key: k.id, label: k.nama })),
                ]}
              />
            </FilterSection>
            <FilterSection label="ACC Cetak">
              <FilterButtonGroup
                options={ACC_OPTIONS}
                value={accFilter}
                onChange={setAccFilter}
              />
            </FilterSection>
          </FilterLanjutan>
        </div>
      </div>
      {data?.count !== undefined && (
        <p className="text-xs text-default-400 tabular-nums">
          {data.count} SPK ditemukan
        </p>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SpkCardSkeleton key={i} />
          ))}
        </div>
      ) : spkList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-default-400">
          <PackageSearch size={56} strokeWidth={1.1} />
          <div className="text-center">
            <p className="text-base font-medium">Tidak ada SPK ditemukan</p>
            <p className="text-sm mt-1">
              {activeFilters
                ? "Coba ubah atau reset filter di atas."
                : "SPK akan muncul di sini ketika pesanan masuk tahap Jahit."}
            </p>
          </div>
          {activeFilters && (
            <Button
              size="sm"
              variant="flat"
              onPress={() => {
                setSearch("");
                setStatusFilter("all");
                setAccFilter("all");
                setKaryawanFilter("all");
              }}
            >
              Reset Filter
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {spkList.map((spk) => (
            <SpkQueueCard
              key={spk.id}
              spk={spk}
              onToggleAcc={handleToggleAcc}
              isTogglingId={isTogglingId}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="flat"
            isDisabled={page <= 1}
            onPress={() => setPage((p) => p - 1)}
          >
            ← Sebelumnya
          </Button>
          <span className="text-sm text-default-500">
            Halaman {page} dari {totalPages}
          </span>
          <Button
            size="sm"
            variant="flat"
            isDisabled={page >= totalPages}
            onPress={() => setPage((p) => p + 1)}
          >
            Berikutnya →
          </Button>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-default-400 flex-wrap pb-2">
        <div className="flex items-center gap-1.5">
          <ClipboardList size={12} />
          <span>Auto-refresh setiap 30 detik</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-danger" />
          <span>Deadline terlewat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-warning" />
          <span>Deadline ≤ 2 hari</span>
        </div>
      </div>
    </div>
  );
}
