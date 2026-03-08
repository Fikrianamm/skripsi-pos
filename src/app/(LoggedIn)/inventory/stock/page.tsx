"use client";
import React from "react";
import { TableCell, TableRow } from "@heroui/table";
import { Button } from "@heroui/button";
import { Chip, type Selection } from "@heroui/react";
import {
  AlertTriangle,
  Box,
  CircleDot,
  MoreVertical,
  PenLine,
  Trash2,
  X,
} from "lucide-react";
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
import { FilterDropdown, type FilterItem } from "@/components/filter-dropdown";
import { ContextMenu } from "@/components/data-table/context-menu";
import { BulkSelectionBar } from "@/components/data-table/bulk-selection-bar";
import { useSWRConfig } from "swr";
import { DataTable } from "@/components/data-table/data-table";
import { TablePagination } from "@/components/data-table/table-pagination";
import { columns } from "./components/columns";
import DrawerManageCategory from "../../master/customer/components/drawer-category";

const STATUS_FILTER_ITEMS: FilterItem[] = [
  { key: "all", label: "Semua" },
  { key: "true", label: "Aktif" },
  { key: "false", label: "Tidak Aktif" },
];

const STOK_FILTER_ITEMS: FilterItem[] = [
  { key: "all", label: "Semua Stok" },
  { key: "menipis", label: "⚠️ Menipis" },
  { key: "habis", label: "🔴 Habis" },
];

const ROWS_PER_PAGE = 10;

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
  const { mutate: mutateGlobal } = useSWRConfig();

  const [editItem, setEditItem] = React.useState<BahanBaku | null>(null);
  const [deleteItem, setDeleteItem] = React.useState<BahanBaku | null>(null);

  const { contextMenu, openMenu, openMenuFromButton, closeMenu } =
    useContextMenu<BahanBaku>();

  const statusKey = Array.from(selectedStatus)[0] as string;
  const stokKey = Array.from(selectedStokFilter)[0] as string;

  const { data, isLoading, mutate } = useSWR(
    `/api/admin/bahan-baku?page=${page}&isActive=${statusKey}&search=${debouncedSearch}&stokFilter=${stokKey}`,
    fetcher,
    { keepPreviousData: true },
  );

  const pages = React.useMemo(
    () => (data?.count ? Math.ceil(data.count / ROWS_PER_PAGE) : 0),
    [data?.count],
  );

  const selectedIds = React.useMemo(() => {
    if (selectedKeys === "all")
      return (data?.results ?? []).map((b: BahanBaku) => b.id as string);
    return Array.from(selectedKeys).filter((k) => k !== "") as string[];
  }, [selectedKeys, data?.results]);

  const statusLabel = React.useMemo(() => {
    if (statusKey === "all") return "Semua";
    return statusKey === "true" ? "Aktif" : "Tidak Aktif";
  }, [statusKey]);

  const stokLabel = React.useMemo(() => {
    return (
      STOK_FILTER_ITEMS.find((f) => f.key === stokKey)?.label ?? "Semua Stok"
    );
  }, [stokKey]);

  const hasActiveFilters =
    search !== "" || statusKey !== "all" || stokKey !== "all";

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4 mb-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader
          title="Inventory Bahan Baku"
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

      <div className="flex flex-col md:flex-row gap-3 justify-between items-center border-t border-default-200 pt-4">
        <SearchInput
          value={search}
          placeholder="Cari bahan baku"
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="w-full md:w-auto"
        />
        <div className="flex flex-col md:flex-row gap-2 justify-center md:justify-between w-full">
          <div className="flex gap-2">
            <FilterDropdown
              label="Status"
              icon={<CircleDot size={16} />}
              items={STATUS_FILTER_ITEMS}
              selectedKeys={selectedStatus}
              selectedLabel={statusLabel}
              onSelectionChange={(keys) => {
                if (keys === "all") return;
                const sel = Array.from(keys)[0] as string;
                setSelectedStatus(new Set([sel || "all"]));
              }}
              showReset={false}
              onReset={() => {
                setSelectedStatus(new Set(["all"]));
                setSearch("");
              }}
            />
            <FilterDropdown
              label="Stok"
              icon={<AlertTriangle size={16} />}
              items={STOK_FILTER_ITEMS}
              selectedKeys={selectedStokFilter}
              selectedLabel={stokLabel}
              onSelectionChange={(keys) => {
                if (keys === "all") return;
                const sel = Array.from(keys)[0] as string;
                setSelectedStokFilter(new Set([sel || "all"]));
              }}
              showReset={false}
              onReset={() => {
                setSelectedStatus(new Set(["all"]));
                setSelectedStokFilter(new Set(["all"]));
                setSearch("");
              }}
            />
            {hasActiveFilters && (
              <Button
                variant="flat"
                color="danger"
                startContent={<X size={16} />}
                onPress={() => {
                  setSearch("");
                  setSelectedStatus(new Set(["all"]));
                  setSelectedStokFilter(new Set(["all"]));
                }}
                className="hidden lg:flex"
              >
                Reset
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <AddBahanBakuModal onAdded={() => mutate()} />
          </div>
        </div>
      </div>

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

      <TablePagination page={page} total={pages} onChange={setPage} />
    </div>
  );
}
