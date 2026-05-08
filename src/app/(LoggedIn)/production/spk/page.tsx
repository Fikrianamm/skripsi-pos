"use client";

import React from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Button,
  Divider,
  Pagination,
} from "@heroui/react";
import {
  ClipboardList,
  PackageSearch,
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
import {
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { SpkQueueCard, SpkCardSkeleton, SpkItem } from "./components/spk-queue-card";

// ── Types ──────────────────────────────────────────────────────────────────────
interface KaryawanOption {
  id: string;
  nama: string;
  posisi: string | null;
}

// ── Main page ──────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { key: "all", label: "Semua Status" },
  { key: "AKTIF", label: "Aktif" },
  { key: "SELESAI", label: "Selesai" },
  { key: "BATAL", label: "Batal" },
];

const ACC_OPTIONS = [
  { key: "all", label: "Semua" },
  { key: "true", label: "Sudah ACC" },
  { key: "false", label: "Belum ACC" },
];

export default function Page() {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("AKTIF");
  const [accFilter, setAccFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [isTogglingId, setIsTogglingId] = React.useState<string | null>(null);

  const [advancingSpk, setAdvancingSpk] = React.useState<SpkItem | null>(null);
  const [isAdvancing, setIsAdvancing] = React.useState(false);
  const advanceDisclosure = useDisclosure();

  const debouncedSearch = useDebounce(search, 300);

  const limit = 12; // 3 kolom × 6 baris

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

  // Advance SPK to SELESAI
  async function handleAdvance() {
    if (!advancingSpk) return;
    setIsAdvancing(true);
    try {
      const res = await fetch(`/api/order/${advancingSpk.orderId}/spk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusSPK: "SELESAI" }),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast({ title: "Gagal", description: json.error, color: "danger" });
        return;
      }
      addToast({
        title: "Produksi selesai, dilanjut ke tahap Packing! 📦",
        color: "success",
      });
      mutate();
      advanceDisclosure.onClose();
      setAdvancingSpk(null);
    } finally {
      setIsAdvancing(false);
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
        <div className="flex gap-2 items-center">
          <span className="text-xs text-default-400 tabular-nums">
            {data.count} SPK ditemukan
          </span>
          <Divider className="flex-1" />
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
              onAdvance={(s) => {
                setAdvancingSpk(s);
                advanceDisclosure.onOpen();
              }}
              isTogglingId={isTogglingId}
            />
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

      {/* ── Modals ── */}
      <Modal
        isOpen={advanceDisclosure.isOpen}
        onClose={advanceDisclosure.onClose}
        size="sm"
      >
        <ModalContent>
          <ModalHeader className="text-sm">Selesaikan Produksi</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">
              Tandai SPK untuk pesanan{" "}
              <strong>{advancingSpk?.order.nomorOrder}</strong> telah selesai?
              Status pesanan akan berlanjut ke tahap <strong>Packing</strong>.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              size="sm"
              variant="flat"
              onPress={advanceDisclosure.onClose}
              isDisabled={isAdvancing}
            >
              Batal
            </Button>
            <Button
              size="sm"
              color="primary"
              onPress={handleAdvance}
              isLoading={isAdvancing}
            >
              Selesai Produksi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
