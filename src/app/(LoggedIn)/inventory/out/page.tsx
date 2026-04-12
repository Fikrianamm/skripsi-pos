/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher, formatDate } from "@/lib/func";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import { PackageMinus, Eye, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import Link from "next/link";
import { DateRangePicker } from "@heroui/date-picker";
import {
  type RangeValue,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  User,
  Divider,
} from "@heroui/react";
import {
  type DateValue,
  today,
  getLocalTimeZone,
} from "@internationalized/date";
import { TableRow, TableCell } from "@heroui/table";
import {
  FilterLanjutan,
  FilterSection,
  FilterSelect,
} from "@/components/filter-lanjutan";
import { PengeluaranDetailModal } from "./components/detail-modal";
import { ContextMenu } from "@/components/data-table/context-menu";
import type { PengeluaranItem } from "@/types/types";
import { toISO } from "@/lib/func";
import { TablePagination } from "@/components/data-table/table-pagination";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./components/columns";
import { useContextMenu } from "@/hooks/use-context-menu";

export default function BarangKeluarPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<RangeValue<DateValue> | null>(
    null,
  );
  const [bahanBakuId, setBahanBakuId] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { contextMenu, openMenu, openMenuFromButton, closeMenu } =
    useContextMenu<PengeluaranItem>();

  const debouncedSearch = useDebounce(search, 300);
  const [limit, setLimit] = useState(10);
  const { mutate } = useSWRConfig();

  const dateFrom = toISO(dateRange?.start);
  const dateTo = toISO(dateRange?.end);

  const { data: bahanBakuData } = useSWR(
    "/api/admin/bahan-baku?all=true",
    fetcher,
  );

  const bahanBakuOptions = [
    { key: "", label: "Semua Bahan Baku" },
    ...(bahanBakuData?.results ?? []).map(
      (b: { id: string; nama: string }) => ({ key: b.id, label: b.nama }),
    ),
  ];

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search: debouncedSearch,
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(bahanBakuId && { bahanBakuId }),
  });
  const { data, isLoading } = useSWR(
    `/api/admin/inventory/out?${params}`,
    fetcher,
  );

  const pages = useMemo(
    () => (data?.pagination?.total ? Math.ceil(data.pagination.total / limit) : 0),
    [data?.pagination?.total, limit],
  );
  const activeCount = (dateRange ? 1 : 0) + (bahanBakuId ? 1 : 0);
  const resetFilters = () => {
    setSearch("");
    setDateRange(null);
    setBahanBakuId("");
  };
  const openDetail = (id: string) => {
    setSelectedId(id);
    setIsDetailOpen(true);
  };

  async function handleDelete() {
    if (!deleteItemId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/inventory/out/${deleteItemId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Terjadi kesalahan.");
      addToast({
        title: "Dihapus",
        description: "Pengeluaran dihapus dan stok telah di-rollback.",
        color: "success",
      });
      setDeleteItemId(null);
      mutate(`/api/admin/inventory/out?${params}`);
    } catch (err: any) {
      addToast({
        title: "Gagal menghapus",
        description: err.message,
        color: "danger",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4 mb-4">
      <PageHeader
        title="Barang Keluar Produksi"
        description="Riwayat pengeluaran bahan baku untuk proses produksi SPK"
      />

      <div className="flex flex-col md:flex-row gap-2">
        <SearchInput
          value={search}
          placeholder="Cari nomor order/customer/keterangan..."
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="w-full"
        />
        <div className="flex flex-row gap-2 items-center justify-start">
          <FilterLanjutan activeCount={activeCount} onReset={resetFilters}>
            <FilterSection label="Tanggal">
              <DateRangePicker
                showMonthAndYearPickers
                variant="bordered"
                value={dateRange}
                onChange={setDateRange}
                maxValue={today(getLocalTimeZone())}
                size="sm"
                className="w-full"
              />
            </FilterSection>
            <FilterSection label="Bahan Baku">
              <FilterSelect
                value={bahanBakuId}
                onChange={setBahanBakuId}
                options={bahanBakuOptions}
              />
            </FilterSection>
          </FilterLanjutan>
          <Button
            as={Link}
            href="/inventory/out/create"
            color="primary"
            startContent={<PackageMinus size={18} />}
          >
            Catat Pengeluaran
          </Button>
        </div>
      </div>

      {data?.pagination?.total !== undefined && (
        <div className="flex gap-2 items-center">
          <span className="text-xs text-default-400 tabular-nums">
            Menampilkan {data.results.length} dari {data.pagination.total}{" "}
            pengeluaran
          </span>
          <Divider className="flex-1" />
        </div>
      )}

      <DataTable<PengeluaranItem>
        columns={columns}
        items={data?.results ?? []}
        isLoading={isLoading}
        selectionMode="none"
        emptyContent="Belum ada riwayat pengeluaran barang."
        renderRow={(item) => {
          return (
            <TableRow
              key={item.id}
              onContextMenu={(e) => openMenu(e, item)}
              onClick={() => openDetail(item.id)}
            >
              <TableCell>
                <div className="text-sm">{formatDate(item.tanggal)}</div>
              </TableCell>
              <TableCell>
                {item.spk ? (
                  <div>
                    <Chip size="sm" variant="flat" color="primary">
                      {item.spk.order.nomorOrder}
                    </Chip>
                    <p className="text-xs text-default-400 mt-0.5">
                      {item.spk.order.customer.nama}
                    </p>
                  </div>
                ) : (
                  <span className="text-sm text-default-400">—</span>
                )}
              </TableCell>
              <TableCell>
                {item.addedBy ? (
                  <User
                    name={item.addedBy.name}
                    description="Admin"
                    classNames={{ description: "capitalize" }}
                    avatarProps={{
                      src: item.addedBy.image ?? undefined,
                      size: "sm",
                    }}
                  />
                ) : (
                  <span className="text-sm text-default-500">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 max-w-xs">
                  {item.items.slice(0, 3).map((it) => (
                    <Chip
                      key={it.id}
                      size="sm"
                      variant="flat"
                      className="text-xs"
                    >
                      {it.bahanBaku.nama}
                    </Chip>
                  ))}
                  {item.items.length > 3 && (
                    <Chip
                      size="sm"
                      variant="flat"
                      className="text-xs text-default-400"
                    >
                      +{item.items.length - 3} lainnya
                    </Chip>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-default-500">
                  {item.keterangan || "—"}
                </span>
              </TableCell>
              {/* Actions (mobile) */}
              <TableCell className="md:hidden">
                <Button
                  className="p-1.5 rounded-md hover:bg-accent"
                  onClick={(e) => openMenuFromButton(e, item)}
                  isIconOnly
                  variant="light"
                >
                  <MoreVertical size={16} />
                </Button>
              </TableCell>
            </TableRow>
          );
        }}
      />

      <PengeluaranDetailModal
        id={selectedId}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={[
            {
              label: "Lihat",
              icon: <Eye size={15} />,
              onClick: () => {
                closeMenu();
                openDetail(contextMenu?.item.id);
              },
            },
            {
              label: "Hapus",
              icon: <Trash2 size={15} />,
              variant: "destructive",
              onClick: () => {
                closeMenu();
                setDeleteItemId(contextMenu?.item.id);
              },
            },
          ]}
        />
      )}

      <TablePagination page={page} total={pages} onChange={setPage} limit={limit} onLimitChange={(l) => { setLimit(l); setPage(1); }} totalItems={data?.pagination?.total} />

      <Modal
        isOpen={!!deleteItemId}
        onClose={() => setDeleteItemId(null)}
        size="sm"
      >
        <ModalContent>
          <ModalHeader>Konfirmasi Hapus</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">
              Menghapus pengeluaran ini akan{" "}
              <span className="font-semibold text-success">
                mengembalikan stok
              </span>{" "}
              seluruh bahan baku yang tercatat. Tindakan ini tidak dapat
              dibatalkan.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setDeleteItemId(null)}>
              Batal
            </Button>
            <Button
              color="danger"
              onPress={handleDelete}
              isLoading={isDeleting}
              startContent={!isDeleting && <Trash2 size={14} />}
            >
              Ya, Hapus
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
