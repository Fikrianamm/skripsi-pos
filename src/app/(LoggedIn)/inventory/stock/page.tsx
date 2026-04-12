"use client";
import React from "react";
import { TableCell, TableRow } from "@heroui/table";
import { Button } from "@heroui/button";
import { Chip, Divider, type Selection } from "@heroui/react";
import { Box, MoreVertical, PenLine, Trash2 } from "lucide-react";
import { fetcher } from "@/lib/func";
import useSWR from "swr";
import { BahanBaku } from "@/types/types";
import AddBahanBakuModal from "./components/add-bahan-baku-modal";
import EditBahanBakuModal from "./components/edit-bahan-baku-modal";
import DeleteBahanBakuModal from "./components/delete-bahan-baku-modal";
import BulkDeleteBahanBakuModal from "./components/bulk-delete-bahan-baku-modal";
import { useTableMultipleSelection } from "@/hooks/use-table-multiple-selection";
import { useDebounce } from "@/hooks/use-debounce";
import { useContextMenu } from "@/hooks/use-context-menu";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import {
  FilterLanjutan,
  FilterSection,
  FilterButtonGroup,
} from "@/components/filter-lanjutan";
import { ContextMenu } from "@/components/data-table/context-menu";
import { BulkSelectionBar } from "@/components/data-table/bulk-selection-bar";
import { useSWRConfig } from "swr";
import { DataTable } from "@/components/data-table/data-table";
import { TablePagination } from "@/components/data-table/table-pagination";
import { columns } from "./components/columns";
import DrawerManageCategory from "../../master/customer/components/drawer-category";

const STATUS_OPTIONS = [
  { key: "all", label: "Semua" },
  { key: "true", label: "Aktif" },
  { key: "false", label: "Tidak Aktif" },
];

const STOK_OPTIONS = [
  { key: "all", label: "Semua" },
  { key: "menipis", label: "⚠️ Menipis" },
  { key: "habis", label: "🔴 Habis" },
];


function getStokStatus(bb: BahanBaku): "normal" | "menipis" | "habis" {
  const stok = Number(bb.stok);
  const min =
    bb.minStok !== null && bb.minStok !== undefined ? Number(bb.minStok) : null;
  if (stok <= 0) return "habis";
  if (min !== null && stok <= min) return "menipis";
  return "normal";
}

export default function Page() {
  const { selectionMode } = useTableMultipleSelection(true);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
    new Set([""]),
  );
  const [selectedStatus, setSelectedStatus] = React.useState<Selection>(
    new Set(["all"]),
  );
  const [selectedStokFilter, setSelectedStokFilter] = React.useState<Selection>(
    new Set(["all"]),
  );
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const { mutate: mutateGlobal } = useSWRConfig();

  const [editItem, setEditItem] = React.useState<BahanBaku | null>(null);
  const [deleteItem, setDeleteItem] = React.useState<BahanBaku | null>(null);

  const { contextMenu, openMenu, openMenuFromButton, closeMenu } =
    useContextMenu<BahanBaku>();

  const statusKey = Array.from(selectedStatus)[0] as string;
  const stokKey = Array.from(selectedStokFilter)[0] as string;

  const { data, isLoading, mutate } = useSWR(
    `/api/admin/bahan-baku?page=${page}&limit=${limit}&isActive=${statusKey}&search=${debouncedSearch}&stokFilter=${stokKey}`,
    fetcher,
    { keepPreviousData: true },
  );

  const pages = React.useMemo(
    () => (data?.count ? Math.ceil(data.count / limit) : 0),
    [data?.count, limit],
  );

  const selectedIds = React.useMemo(() => {
    if (selectedKeys === "all")
      return (data?.results ?? []).map((b: BahanBaku) => b.id as string);
    return Array.from(selectedKeys).filter((k) => k !== "") as string[];
  }, [selectedKeys, data?.results]);

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4 mb-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader
          title="Stok Bahan Baku"
          description="Kelola stok bahan baku produksi dan catat setiap pembelian."
        />
        <DrawerManageCategory
          onMutate={() => {
            mutate();
            mutateGlobal("/api/unit?limit=100");
            mutateGlobal("/api/category?limit=100");
          }}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <SearchInput
          value={search}
          placeholder="Cari bahan baku"
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="w-full"
        />
        <div className="flex flex-row gap-2 items-center justify-start">
          <FilterLanjutan
            activeCount={
              (statusKey !== "all" ? 1 : 0) + (stokKey !== "all" ? 1 : 0)
            }
            onReset={() => {
              setSearch("");
              setSelectedStatus(new Set(["all"]));
              setSelectedStokFilter(new Set(["all"]));
            }}
          >
            <FilterSection label="Status">
              <FilterButtonGroup
                options={STATUS_OPTIONS}
                value={statusKey}
                onChange={(v) => {
                  setSelectedStatus(new Set([v]));
                  setPage(1);
                }}
              />
            </FilterSection>
            <FilterSection label="Status Stok">
              <FilterButtonGroup
                options={STOK_OPTIONS}
                value={stokKey}
                onChange={(v) => {
                  setSelectedStokFilter(new Set([v]));
                  setPage(1);
                }}
              />
            </FilterSection>
          </FilterLanjutan>
          <AddBahanBakuModal onAdded={() => mutate()} />
        </div>
      </div>
      {data?.count !== undefined && (
        <div className="flex gap-2 items-center">
          <span className="text-xs text-default-400 tabular-nums">
            Menampilkan {data.results.length} dari {data.count} bahan baku
          </span>
          <Divider className="flex-1" />
        </div>
      )}

      <BulkSelectionBar count={selectedIds.length} label="bahan baku dipilih">
        <BulkDeleteBahanBakuModal
          ids={selectedIds}
          onDeleted={() => {
            setSelectedKeys(new Set([""]));
            mutate();
          }}
        />
      </BulkSelectionBar>

      <DataTable<BahanBaku>
        columns={columns}
        items={(data?.results ?? []) as BahanBaku[]}
        isLoading={isLoading}
        selectionMode={selectionMode}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        emptyContent="Belum ada data"
        renderRow={(bb) => {
          const stokStatus = getStokStatus(bb);
          return (
            <TableRow
              key={bb.id}
              onContextMenu={(e) => openMenu(e, bb)}
              className="cursor-context-menu"
            >
              {/* Nama */}
              <TableCell>
                <div className="flex items-center gap-2 font-medium">
                  <div className="size-8 rounded-lg bg-default-100 flex items-center justify-center shrink-0">
                    <Box size={15} className="text-foreground-400" />
                  </div>
                  {bb.nama}
                </div>
              </TableCell>

              {/* Satuan */}
              <TableCell>
                <Chip variant="flat" color="default" size="sm">
                  {bb.unit?.nama}
                </Chip>
              </TableCell>

              {/* Stok */}
              <TableCell>
                <div className="flex items-center gap-2">
                  {stokStatus === "habis" && (
                    <Chip
                      color="danger"
                      variant="dot"
                      className="text-danger bg-danger/10 border-danger/20"
                    >
                      {Number(bb.stok)} {bb.unit?.nama} — Habis
                    </Chip>
                  )}
                  {stokStatus === "menipis" && (
                    <Chip
                      color="warning"
                      variant="dot"
                      className="text-warning bg-warning/10 border-warning/20"
                    >
                      {Number(bb.stok)} {bb.unit?.nama} — Menipis
                    </Chip>
                  )}
                  {stokStatus === "normal" && (
                    <Chip
                      color="success"
                      variant="dot"
                      className="text-success bg-success/10 border-success/20"
                    >
                      {Number(bb.stok)} {bb.unit?.nama}
                    </Chip>
                  )}
                </div>
              </TableCell>

              {/* Min Stok */}
              <TableCell>
                {bb.minStok !== null && bb.minStok !== undefined ? (
                  <span className="text-sm text-foreground-500">
                    {Number(bb.minStok)} {bb.unit?.nama}
                  </span>
                ) : (
                  <span className="text-foreground-300 text-sm">—</span>
                )}
              </TableCell>

              {/* Keterangan */}
              <TableCell>
                <span className="text-sm text-foreground-500 line-clamp-1">
                  {bb.keterangan || "—"}
                </span>
              </TableCell>

              {/* Status */}
              <TableCell>
                <Chip
                  color={bb.isActive ? "success" : "danger"}
                  variant="dot"
                  className={
                    bb.isActive
                      ? "text-success bg-success/10 border-success/20"
                      : "text-danger bg-danger/10 border-danger/20"
                  }
                >
                  {bb.isActive ? "Aktif" : "Tidak Aktif"}
                </Chip>
              </TableCell>

              {/* Actions (mobile) */}
              <TableCell className="md:hidden">
                <Button
                  className="p-1.5 rounded-md hover:bg-accent"
                  onClick={(e) => openMenuFromButton(e, bb)}
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

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={[
            {
              label: "Edit",
              icon: <PenLine size={16} />,
              variant: "primary",
              onClick: () => {
                setEditItem(contextMenu.item);
                closeMenu();
              },
            },
            {
              label: "Hapus",
              icon: <Trash2 size={16} />,
              variant: "destructive",
              onClick: () => {
                setDeleteItem(contextMenu.item);
                closeMenu();
              },
            },
          ]}
        />
      )}

      {/* Edit Modal */}
      {editItem && (
        <EditBahanBakuModal
          key={`edit-${editItem.id}`}
          bahanBaku={editItem}
          isOpen
          onOpenChange={(open) => {
            if (!open) setEditItem(null);
          }}
          onEdited={() => {
            mutate();
            setEditItem(null);
          }}
        />
      )}

      {/* Delete Modal */}
      {deleteItem && (
        <DeleteBahanBakuModal
          key={`delete-${deleteItem.id}`}
          bahanBaku={deleteItem}
          isOpen
          onOpenChange={(open) => {
            if (!open) setDeleteItem(null);
          }}
          onDeleted={() => {
            mutate();
            setDeleteItem(null);
          }}
        />
      )}

      <TablePagination page={page} total={pages} onChange={setPage} limit={limit} onLimitChange={(l) => { setLimit(l); setPage(1); }} totalItems={data?.count} />
    </div>
  );
}
