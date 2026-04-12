"use client";
import React from "react";
import { TableCell, TableRow } from "@heroui/table";
import { Button } from "@heroui/button";
import { Chip, Divider, type Selection } from "@heroui/react";
import { Eye, MoreVertical, PenLine, Trash2 } from "lucide-react";
import { fetcher } from "@/lib/func";
import useSWR from "swr";
import { Karyawan } from "@/types/types";
import AddKaryawanModal from "./components/add-karyawan-modal";
import EditKaryawanModal from "./components/edit-karyawan-modal";
import DeleteKaryawanModal from "./components/delete-karyawan-modal";
import BulkDeleteKaryawanModal from "./components/bulk-delete-karyawan-modal";
import ViewKaryawanModal from "./components/view-karyawan-modal";
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
import { DataTable } from "@/components/data-table/data-table";
import { TablePagination } from "@/components/data-table/table-pagination";
import { columns } from "./components/columns";

const STATUS_OPTIONS = [
  { key: "all", label: "Semua" },
  { key: "true", label: "Aktif" },
  { key: "false", label: "Tidak Aktif" },
];


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
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);

  const [editKaryawan, setEditKaryawan] = React.useState<Karyawan | null>(null);
  const [deleteKaryawan, setDeleteKaryawan] = React.useState<Karyawan | null>(
    null,
  );
  const [viewKaryawan, setViewKaryawan] = React.useState<Karyawan | null>(null);
  const { contextMenu, openMenu, openMenuFromButton, closeMenu } =
    useContextMenu<Karyawan>();

  const statusKey = Array.from(selectedStatus)[0] as string;

  const { data, isLoading, mutate } = useSWR(
    `/api/admin/karyawan?page=${page}&limit=${limit}&isActive=${statusKey}&search=${debouncedSearch}`,
    fetcher,
    { keepPreviousData: true },
  );

  const pages = React.useMemo(
    () => (data?.count ? Math.ceil(data.count / limit) : 0),
    [data?.count, limit],
  );

  const selectedIds = React.useMemo(() => {
    if (selectedKeys === "all")
      return (data?.results ?? []).map((k: Karyawan) => k.id);
    return Array.from(selectedKeys).filter((k) => k !== "");
  }, [selectedKeys, data?.results]);

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4 mb-4">
      <PageHeader
        title="Manajemen Karyawan"
        description="Kelola data karyawan dan tenaga produksi."
      />

      <div className="flex flex-col md:flex-row gap-2">
        <SearchInput
          value={search}
          placeholder="Cari karyawan"
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="w-full"
        />
        <div className="flex flex-row gap-2 items-center justify-start">
          <FilterLanjutan
            activeCount={statusKey !== "all" ? 1 : 0}
            onReset={() => {
              setSelectedStatus(new Set(["all"]));
              setSearch("");
            }}
          >
            <FilterSection label="Status">
              <FilterButtonGroup
                options={STATUS_OPTIONS}
                value={statusKey}
                onChange={(v) => setSelectedStatus(new Set([v]))}
              />
            </FilterSection>
          </FilterLanjutan>
          <AddKaryawanModal onKaryawanAdded={() => mutate()} />
        </div>
      </div>

      {/* Count */}
      {data?.count !== undefined && (
        <div className="flex gap-2 items-center">
          <span className="text-xs text-default-400 tabular-nums">
            Menampilkan {data?.results.length} dari {data.count} karyawan
          </span>
          <Divider className="flex-1" />
        </div>
      )}

      <BulkSelectionBar count={selectedIds.length} label="karyawan dipilih">
        <BulkDeleteKaryawanModal
          karyawanIds={selectedIds as string[]}
          onDeleted={() => {
            setSelectedKeys(new Set([""]));
            mutate();
          }}
        />
      </BulkSelectionBar>

      <DataTable<Karyawan>
        columns={columns}
        items={(data?.results ?? []) as Karyawan[]}
        isLoading={isLoading}
        selectionMode={selectionMode}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        renderRow={(karyawan) => (
          <TableRow
            key={karyawan.id}
            onContextMenu={(e) => openMenu(e, karyawan)}
            className="cursor-context-menu"
          >
            <TableCell>
              <span className="font-medium">{karyawan.nama}</span>
            </TableCell>
            <TableCell>{karyawan.posisi || "-"}</TableCell>
            <TableCell>
              {karyawan.nomorHp ? (
                <Chip variant="flat" color="default" size="md">
                  {karyawan.nomorHp}
                </Chip>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>
              <Chip
                color={karyawan.isActive ? "success" : "danger"}
                variant="dot"
                className={
                  karyawan.isActive
                    ? "text-success bg-success/10 border-success/20"
                    : "text-danger bg-danger/10 border-danger/20"
                }
              >
                {karyawan.isActive ? "Aktif" : "Tidak Aktif"}
              </Chip>
            </TableCell>
            <TableCell className="md:hidden">
              <Button
                className="p-1.5 rounded-md hover:bg-accent"
                onClick={(e) => openMenuFromButton(e, karyawan)}
                isIconOnly
                variant="light"
              >
                <MoreVertical size={16} />
              </Button>
            </TableCell>
          </TableRow>
        )}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={[
            {
              label: "Lihat",
              icon: <Eye size={16} />,
              variant: "default",
              onClick: () => {
                setViewKaryawan(contextMenu.item);
                closeMenu();
              },
            },
            {
              label: "Edit",
              icon: <PenLine size={16} />,
              variant: "primary",
              onClick: () => {
                setEditKaryawan(contextMenu.item);
                closeMenu();
              },
            },
            {
              label: "Hapus",
              icon: <Trash2 size={16} />,
              variant: "destructive",
              onClick: () => {
                setDeleteKaryawan(contextMenu.item);
                closeMenu();
              },
            },
          ]}
        />
      )}

      {viewKaryawan && (
        <ViewKaryawanModal
          key={`view-${viewKaryawan.id}`}
          karyawan={viewKaryawan}
          isOpen
          onOpenChange={(open) => {
            if (!open) setViewKaryawan(null);
          }}
        />
      )}
      {editKaryawan && (
        <EditKaryawanModal
          key={`edit-${editKaryawan.id}`}
          karyawan={editKaryawan}
          onKaryawanEdited={() => {
            mutate();
            setEditKaryawan(null);
          }}
          isOpen
          onOpenChange={(open) => {
            if (!open) setEditKaryawan(null);
          }}
        />
      )}
      {deleteKaryawan && (
        <DeleteKaryawanModal
          key={`delete-${deleteKaryawan.id}`}
          karyawan={deleteKaryawan}
          onKaryawanDeleted={() => {
            mutate();
            setDeleteKaryawan(null);
          }}
          isOpen
          onOpenChange={(open) => {
            if (!open) setDeleteKaryawan(null);
          }}
        />
      )}

      <TablePagination page={page} total={pages} onChange={setPage} limit={limit} onLimitChange={(l) => { setLimit(l); setPage(1); }} totalItems={data?.count} />
    </div>
  );
}
