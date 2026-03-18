"use client";
import React from "react";
import { TableCell, TableRow } from "@heroui/table";
import { Button } from "@heroui/button";
import { Chip, type Selection } from "@heroui/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, MoreVertical, PenLine, Trash2 } from "lucide-react";
import { fetcher, getInitialName } from "@/lib/func";
import useSWR from "swr";
import { Supplier as SupplierType } from "@/types/types";
import AddSupplierModal from "./components/add-supplier-modal";
import EditSupplierModal from "./components/edit-supplier-modal";
import DeleteSupplierModal from "./components/delete-supplier-modal";
import BulkDeleteSupplierModal from "./components/bulk-delete-supplier-modal";
import ViewSupplierModal from "./components/view-supplier-modal";
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

const ROWS_PER_PAGE = 10;

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

  const [editSupplier, setEditSupplier] = React.useState<SupplierType | null>(
    null,
  );
  const [deleteSupplier, setDeleteSupplier] =
    React.useState<SupplierType | null>(null);
  const [viewSupplier, setViewSupplier] = React.useState<SupplierType | null>(
    null,
  );
  const { contextMenu, openMenu, openMenuFromButton, closeMenu } =
    useContextMenu<SupplierType>();

  const statusKey = Array.from(selectedStatus)[0] as string;

  const { data, isLoading, mutate } = useSWR(
    `/api/admin/supplier?page=${page}&isActive=${statusKey}&search=${debouncedSearch}`,
    fetcher,
    { keepPreviousData: true },
  );

  const pages = React.useMemo(
    () => (data?.count ? Math.ceil(data.count / ROWS_PER_PAGE) : 0),
    [data?.count],
  );

  const selectedIds = React.useMemo(() => {
    if (selectedKeys === "all")
      return (data?.results ?? []).map((s: SupplierType) => s.id);
    return Array.from(selectedKeys).filter((k) => k !== "");
  }, [selectedKeys, data?.results]);

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4 mb-4">
      <PageHeader
        title="Manajemen Supplier"
        description="Kelola data mitra dan supplier bahan baku."
      />

      <div className="flex flex-col md:flex-row gap-2">
        <SearchInput
          value={search}
          placeholder="Cari supplier"
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
          <AddSupplierModal onSupplierAdded={() => mutate()} />
        </div>
      </div>

      <BulkSelectionBar count={selectedIds.length} label="supplier dipilih">
        <BulkDeleteSupplierModal
          supplierIds={selectedIds as string[]}
          onDeleted={() => {
            setSelectedKeys(new Set([""]));
            mutate();
          }}
        />
      </BulkSelectionBar>

      <DataTable<SupplierType>
        columns={columns}
        items={(data?.results ?? []) as SupplierType[]}
        isLoading={isLoading}
        selectionMode={selectionMode}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        renderRow={(supplier) => (
          <TableRow
            key={supplier.id}
            onContextMenu={(e) => openMenu(e, supplier)}
            className="cursor-context-menu"
          >
            <TableCell>
              <div className="flex items-center gap-2 font-medium">
                <Avatar>
                  <AvatarImage src={supplier.image || ""} alt={supplier.nama} />
                  <AvatarFallback>
                    {getInitialName(supplier.nama)}
                  </AvatarFallback>
                </Avatar>
                {supplier.nama}
              </div>
            </TableCell>
            <TableCell>{supplier.email || "-"}</TableCell>
            <TableCell>
              {supplier.nomorHp ? (
                <Chip variant="flat" color="default" size="md">
                  {supplier.nomorHp}
                </Chip>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>{supplier.alamat || "-"}</TableCell>
            <TableCell>{supplier.keterangan || "-"}</TableCell>
            <TableCell>
              <Chip
                color={supplier.isActive ? "success" : "danger"}
                variant="dot"
                className={
                  supplier.isActive
                    ? "text-success bg-success/10 border-success/20"
                    : "text-danger bg-danger/10 border-danger/20"
                }
              >
                {supplier.isActive ? "Aktif" : "Tidak Aktif"}
              </Chip>
            </TableCell>
            <TableCell className="md:hidden">
              <Button
                className="p-1.5 rounded-md hover:bg-accent"
                onClick={(e) => openMenuFromButton(e, supplier)}
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
                setViewSupplier(contextMenu.item);
                closeMenu();
              },
            },
            {
              label: "Edit",
              icon: <PenLine size={16} />,
              variant: "primary",
              onClick: () => {
                setEditSupplier(contextMenu.item);
                closeMenu();
              },
            },
            {
              label: "Hapus",
              icon: <Trash2 size={16} />,
              variant: "destructive",
              onClick: () => {
                setDeleteSupplier(contextMenu.item);
                closeMenu();
              },
            },
          ]}
        />
      )}

      {viewSupplier && (
        <ViewSupplierModal
          key={`view-${viewSupplier.id}`}
          supplier={viewSupplier}
          isOpen
          onOpenChange={(open) => {
            if (!open) setViewSupplier(null);
          }}
        />
      )}
      {editSupplier && (
        <EditSupplierModal
          key={`edit-${editSupplier.id}`}
          supplier={editSupplier}
          onSupplierEdited={() => {
            mutate();
            setEditSupplier(null);
          }}
          isOpen
          onOpenChange={(open) => {
            if (!open) setEditSupplier(null);
          }}
        />
      )}
      {deleteSupplier && (
        <DeleteSupplierModal
          key={`delete-${deleteSupplier.id}`}
          supplier={deleteSupplier}
          onSupplierDeleted={() => {
            mutate();
            setDeleteSupplier(null);
          }}
          isOpen
          onOpenChange={(open) => {
            if (!open) setDeleteSupplier(null);
          }}
        />
      )}

      <TablePagination page={page} total={pages} onChange={setPage} />
    </div>
  );
}
