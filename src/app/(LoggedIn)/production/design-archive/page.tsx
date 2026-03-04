"use client";

import React from "react";
import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/func";
import { useDebounce } from "@/hooks/use-debounce";
import { Button, Chip, Select, SelectItem, Skeleton } from "@heroui/react";
import { Eye, Images, Search } from "lucide-react";
import { Input } from "@heroui/input";
import { PageHeader } from "@/components/page-header";

// ── Types ──────────────────────────────────────────────────────────────────────
interface DesignFileItem {
  id: string;
  nama: string;
  filePath: string;
  createdAt: string;
  uploadedBy: { id: string; name: string } | null;
  order: {
    id: string;
    nomorOrder: string;
    statusProduksi: string;
    deadline: string | null;
    customer: { id: string; nama: string; nomorHp: string };
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getFileIcon(filePath: string) {
  const ext = filePath.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "📄";
  if (ext === "psd" || ext === "ai" || ext === "eps") return "🎨";
  if (ext === "zip") return "📦";
  return "🖼️";
}

function statusColor(
  s: string,
): "success" | "warning" | "danger" | "default" | "primary" | "secondary" {
  const map: Record<
    string,
    "success" | "warning" | "danger" | "default" | "primary" | "secondary"
  > = {
    DESAIN: "default",
    POTONG: "secondary",
    SABLON: "warning",
    JAHIT: "primary",
    PACKING: "secondary",
    SELESAI: "success",
    BATAL: "danger",
    PENDING: "default",
  };
  return map[s] ?? "default";
}

// ── File Card ──────────────────────────────────────────────────────────────────
function FileCard({ file }: { file: DesignFileItem }) {
  // Preview: tampilkan langsung jika format gambar
  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(file.filePath);
  const previewSrc = isImage ? file.filePath : null;

  return (
    <div className="rounded-xl border bg-content1 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
      {/* Preview area */}
      <div className="relative bg-default-100 h-36 flex items-center justify-center overflow-hidden">
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewSrc}
            alt={file.nama}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-5xl select-none">
            {getFileIcon(file.filePath)}
          </span>
        )}
        {/* Overlay tombol lihat */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Button
            as="a"
            href={file.filePath}
            target="_blank"
            size="sm"
            color="primary"
            variant="solid"
            startContent={<Eye size={13} />}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Lihat
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5">
        {/* Nama file */}
        <p className="text-sm font-medium truncate" title={file.nama}>
          {file.nama}
        </p>

        {/* Order */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link
            href={`/order/${file.order.id}`}
            className="text-xs font-mono text-primary hover:underline"
          >
            {file.order.nomorOrder}
          </Link>
          <Chip
            size="sm"
            color={statusColor(file.order.statusProduksi)}
            variant="flat"
            className="h-4 text-[10px]"
          >
            {file.order.statusProduksi}
          </Chip>
        </div>

        {/* Customer */}
        <p className="text-xs text-default-500 truncate">
          {file.order.customer.nama}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span className="text-[10px] text-default-400">
            {file.uploadedBy?.name ?? "—"} · {formatDate(file.createdAt)}
          </span>
          <Button
            as="a"
            href={file.filePath}
            target="_blank"
            size="sm"
            variant="flat"
            isIconOnly
            className="h-6 w-6 min-w-6 shrink-0"
          >
            <Eye size={12} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function FileCardSkeleton() {
  return (
    <div className="rounded-xl border bg-content1 shadow-sm overflow-hidden">
      <Skeleton className="h-36 w-full" />
      <div className="p-3 flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4 rounded-lg" />
        <Skeleton className="h-3 w-24 rounded-lg" />
        <Skeleton className="h-3 w-32 rounded-lg" />
        <Skeleton className="h-3 w-20 rounded-lg" />
      </div>
    </div>
  );
}

// ── Filter options ─────────────────────────────────────────────────────────────
const TAHAP_OPTIONS = [
  { key: "all", label: "Semua Tahap" },
  { key: "DESAIN", label: "Desain" },
  { key: "POTONG", label: "Potong" },
  { key: "SABLON", label: "Sablon" },
  { key: "JAHIT", label: "Jahit" },
  { key: "PACKING", label: "Packing" },
  { key: "SELESAI", label: "Selesai" },
  { key: "BATAL", label: "Batal" },
];

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Page() {
  const [search, setSearch] = React.useState("");
  const [tahapFilter, setTahapFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const limit = 24; // 4 kolom × 6 baris

  const apiUrl = `/api/production/design-archive?page=${page}&limit=${limit}&search=${debouncedSearch}&tahap=${tahapFilter}`;

  const { data, isLoading } = useSWR(apiUrl, fetcher, {
    keepPreviousData: true,
  });

  const files: DesignFileItem[] = data?.results ?? [];
  const totalPages = data?.count ? Math.ceil(data.count / limit) : 0;

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, tahapFilter]);

  const activeFilters = tahapFilter !== "all" || search !== "";

  function resetFilters() {
    setSearch("");
    setTahapFilter("all");
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-5 mb-6">
      <PageHeader
        title="Bank Desain"
        description="Semua file desain dari seluruh order — cari dan akses dengan mudah."
      />

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Input
            placeholder="Cari nama file, nomor order, atau customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startContent={<Search size={15} className="text-default-400" />}
            isClearable
            onClear={() => setSearch("")}
            size="sm"
          />
        </div>

        <Select
          size="sm"
          className="w-40"
          aria-label="Filter tahap produksi"
          selectedKeys={new Set([tahapFilter])}
          onSelectionChange={(keys) =>
            setTahapFilter((Array.from(keys)[0] as string) ?? "all")
          }
        >
          {TAHAP_OPTIONS.map((o) => (
            <SelectItem key={o.key}>{o.label}</SelectItem>
          ))}
        </Select>

        {activeFilters && (
          <Button
            size="sm"
            variant="flat"
            color="danger"
            onPress={resetFilters}
          >
            Reset Filter
          </Button>
        )}

        <div className="ml-auto text-xs text-default-400 tabular-nums">
          {data?.count !== undefined && <>{data.count} file ditemukan</>}
        </div>
      </div>

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
                : "File desain akan muncul di sini setelah diupload dari halaman Antrian Desain."}
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
    </div>
  );
}
