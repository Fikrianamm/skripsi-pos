/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher, formatDate } from "@/lib/func";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import { ClipboardPen, Eye, Trash2 } from "lucide-react";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import { Pagination } from "@heroui/pagination";
import Link from "next/link";
import { DateRangePicker } from "@heroui/date-picker";
import {
  type RangeValue,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Divider,
  User,
  Chip,
  Spinner,
} from "@heroui/react";
import type { DateValue } from "@heroui/calendar";
import { today, getLocalTimeZone } from "@internationalized/date";
import { useContextMenu } from "@/hooks/use-context-menu";
import { ContextMenu } from "@/components/data-table/context-menu";
import { FilterLanjutan, FilterSection } from "@/components/filter-lanjutan";
import type { StokOpnameItem } from "@/types/types";
import { OpnameDetailModal } from "./components/detail-modal";

function toISO(d: any): string | undefined {
  if (!d) return undefined;
  try {
    return new Date(
      `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`,
    ).toISOString();
  } catch {
    return undefined;
  }
}

export default function OpnamePage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<RangeValue<DateValue> | null>(
    null,
  );
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StokOpnameItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { mutate } = useSWRConfig();

  const dateFrom = toISO(dateRange?.start);
  const dateTo = toISO(dateRange?.end);

  const params = new URLSearchParams({
    page: String(page),
    search: debouncedSearch,
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
  });

  const {
    data,
    isLoading,
    mutate: mutateList,
  } = useSWR(`/api/admin/inventory/opname?${params}`, fetcher);

  const { contextMenu, openMenu, closeMenu } = useContextMenu<StokOpnameItem>();

  const totalPages = data?.totalPages ?? 1;

  async function handleDelete(item: StokOpnameItem) {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/inventory/opname/${item.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Terjadi kesalahan.");
      addToast({
        title: "Berhasil dihapus",
        description: "Stok opname dihapus dan stok dikembalikan.",
        color: "success",
      });
      setDeleteTarget(null);
      mutateList();
      mutate("/api/admin/bahan-baku?all=true&isActive=true");
    } catch (err: any) {
      addToast({ title: "Gagal", description: err.message, color: "danger" });
    } finally {
      setIsDeleting(false);
    }
  }

  const activeFilterCount = dateRange ? 1 : 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4 mb-4">
      {/* Header */}
      <PageHeader
        title="Stok Opname"
        description="Koreksi stok bahan baku berdasarkan penghitungan fisik di lapangan"
      />

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-2">
        <SearchInput
          value={search}
          placeholder="Cari keterangan opname atau user..."
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="w-full"
        />
        <div className="flex flex-row gap-2 items-center justify-start">
          <FilterLanjutan
            activeCount={activeFilterCount}
            onReset={() => setDateRange(null)}
          >
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
          </FilterLanjutan>
          <Button
            as={Link}
            href="/inventory/opname/create"
            color="primary"
            startContent={<ClipboardPen size={18} />}
          >
            Opname Baru
          </Button>
        </div>
      </div>

      {/* Count */}
      {data?.count !== undefined && (
        <div className="flex gap-2 items-center">
          <span className="text-xs text-default-400 tabular-nums">
            Menampilkan {data?.results.length} dari {data.count} opname
          </span>
          <Divider className="flex-1" />
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-divider overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-default-50 border-b border-divider">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-default-500 uppercase tracking-wide">
                Tanggal
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-default-500 uppercase tracking-wide">
                Dicatat Oleh
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-default-500 uppercase tracking-wide hidden md:table-cell">
                Item Dikoreksi
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-default-500 uppercase tracking-wide hidden lg:table-cell">
                Keterangan
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-default-400">
                  <div className="flex flex-col items-center gap-2">
                    <Spinner />
                    <p>Memuat data...</p>
                  </div>
                </td>
              </tr>
            ) : data?.results.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-default-400">
                  Belum ada data stok opname
                </td>
              </tr>
            ) : (
              data?.results.map((item: StokOpnameItem) => {
                // Only count items that actually have a difference
                const correctedCount = item.items.filter(
                  (i) => Number(i.selisih) !== 0,
                ).length;

                return (
                  <tr
                    key={item.id}
                    onContextMenu={(e) => openMenu(e, item)}
                    onClick={() => setDetailId(item.id)}
                    className="border-b border-divider hover:bg-default-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium">
                      {formatDate(item.tanggal)}
                    </td>
                    <td className="px-4 py-3">
                      {item.addedBy ? (
                        <User
                          name={item.addedBy.name}
                          description={item.addedBy.role}
                          classNames={{ description: "capitalize text-xs" }}
                          avatarProps={{
                            src: item.addedBy.image ?? undefined,
                            size: "sm",
                          }}
                        />
                      ) : (
                        <span className="text-default-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {correctedCount > 0 ? (
                        <Chip size="sm" variant="flat" color="warning">
                          {correctedCount} dikoreksi
                        </Chip>
                      ) : (
                        <Chip size="sm" variant="flat" color="success">
                          Sesuai
                        </Chip>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-default-500 max-w-[200px]">
                      <p className="truncate">{item.keterangan || "—"}</p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={totalPages}
            page={page}
            onChange={setPage}
            showControls
          />
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={[
            {
              label: "Lihat Detail",
              icon: <Eye size={16} />,
              variant: "primary",
              onClick: () => {
                setDetailId(contextMenu.item.id);
                closeMenu();
              },
            },
            {
              label: "Hapus",
              icon: <Trash2 size={16} />,
              variant: "destructive",
              onClick: () => {
                setDeleteTarget(contextMenu.item);
                closeMenu();
              },
            },
          ]}
        />
      )}

      {/* Detail Modal */}
      <OpnameDetailModal
        id={detailId}
        isOpen={!!detailId}
        onClose={() => setDetailId(null)}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          size="sm"
        >
          <ModalContent>
            <ModalHeader>Hapus Stok Opname?</ModalHeader>
            <ModalBody>
              <p className="text-sm text-default-600">
                Stok opname tanggal{" "}
                <span className="font-semibold">
                  {formatDate(deleteTarget.tanggal)}
                </span>{" "}
                akan dihapus dan stok setiap bahan baku akan{" "}
                <span className="font-semibold text-warning">
                  dikembalikan ke kondisi sebelum opname
                </span>
                .
              </p>
              <p className="text-xs text-default-400 mt-1">
                {
                  deleteTarget.items.filter((i) => Number(i.selisih) !== 0)
                    .length
                }{" "}
                bahan baku akan direset.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="flat"
                onPress={() => setDeleteTarget(null)}
                isDisabled={isDeleting}
              >
                Batal
              </Button>
              <Button
                color="danger"
                isLoading={isDeleting}
                onPress={() => handleDelete(deleteTarget)}
              >
                Hapus & Rollback
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
