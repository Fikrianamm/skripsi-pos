"use client";
import React from "react";
import { TableCell, TableRow } from "@heroui/table";
import { Button } from "@heroui/button";
import { Chip, type Selection } from "@heroui/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, MoreVertical, PenLine, Trash2 } from "lucide-react";
import { fetcher, getInitialName } from "@/lib/func";
import useSWR from "swr";
import { Customer as CustomerType } from "@/types/types";
import AddCustomerModal from "./components/add-customer-modal";
import BulkDeleteCustomerModal from "./components/bulk-delete-customer-modal";
import ViewCustomerModal from "./components/view-customer-modal";
import DeleteCustomerModal from "./components/delete-customer-modal";
import EditCustomerModal from "./components/edit-customer-modal";
import { useTableMultipleSelection } from "@/hooks/use-table-multiple-selection";
import { useDebounce } from "@/hooks/use-debounce";
import { useContextMenu } from "@/hooks/use-context-menu";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { ContextMenu } from "@/components/data-table/context-menu";
import { BulkSelectionBar } from "@/components/data-table/bulk-selection-bar";
import { DataTable } from "@/components/data-table/data-table";
import { TablePagination } from "@/components/data-table/table-pagination";
import { columns } from "./components/columns";

const ROWS_PER_PAGE = 10;

export default function Page() {
  const { selectionMode } = useTableMultipleSelection(true);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
    new Set([""]),
  );
  const [page, setPage] = React.useState(1);

  const [editCustomer, setEditCustomer] = React.useState<CustomerType | null>(
    null,
  );
  const [deleteCustomer, setDeleteCustomer] =
    React.useState<CustomerType | null>(null);
  const [viewCustomer, setViewCustomer] = React.useState<CustomerType | null>(
    null,
  );
  const { contextMenu, openMenu, openMenuFromButton, closeMenu } =
    useContextMenu<CustomerType>();

  const { data, isLoading, mutate } = useSWR(
    `/api/admin/customer?page=${page}&search=${debouncedSearch}`,
    fetcher,
    { keepPreviousData: true },
  );

  const pages = React.useMemo(
    () => (data?.count ? Math.ceil(data.count / ROWS_PER_PAGE) : 0),
    [data?.count],
  );

  const selectedIds = React.useMemo(() => {
    if (selectedKeys === "all")
      return (data?.results ?? []).map((c: CustomerType) => c.id);
    return Array.from(selectedKeys).filter((k) => k !== "");
  }, [selectedKeys, data?.results]);

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4 mb-4">
      <PageHeader
        title="Manajemen Customer"
        description="Kelola data pelanggan dan informasi kontak mereka."
      />

      <div className="flex flex-row gap-3 items-center justify-between">
        <SearchInput
          value={search}
          placeholder="Cari customer"
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="w-full max-w-sm"
        />
        <AddCustomerModal onCustomerAdded={() => mutate()} />
      </div>

      <BulkSelectionBar count={selectedIds.length} label="customer dipilih">
        <BulkDeleteCustomerModal
          selectedIds={selectedIds as string[]}
          onDeleted={() => {
            setSelectedKeys(new Set([""]));
            mutate();
          }}
        />
      </BulkSelectionBar>

      <DataTable<CustomerType>
        columns={columns}
        items={(data?.results ?? []) as CustomerType[]}
        isLoading={isLoading}
        selectionMode={selectionMode}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        renderRow={(customer) => (
          <TableRow
            key={customer.id}
            onContextMenu={(e) => openMenu(e, customer)}
            className="cursor-context-menu"
          >
            <TableCell>
              <div className="flex items-center gap-2 font-medium">
                <Avatar>
                  <AvatarImage src={customer.image || ""} alt={customer.nama} />
                  <AvatarFallback>
                    {getInitialName(customer.nama)}
                  </AvatarFallback>
                </Avatar>
                {customer.nama}
              </div>
            </TableCell>
            <TableCell>
              {customer.nomorHp ? (
                <Chip variant="flat" color="default" size="md">
                  {customer.nomorHp}
                </Chip>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>-</TableCell>
            <TableCell>-</TableCell>
            <TableCell>-</TableCell>
            <TableCell className="md:hidden">
              <Button
                className="p-1.5 rounded-md hover:bg-accent"
                onClick={(e) => openMenuFromButton(e, customer)}
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
                setViewCustomer(contextMenu.item);
                closeMenu();
              },
            },
            {
              label: "Edit",
              icon: <PenLine size={16} />,
              variant: "primary",
              onClick: () => {
                setEditCustomer(contextMenu.item);
                closeMenu();
              },
            },
            {
              label: "Hapus",
              icon: <Trash2 size={16} />,
              variant: "destructive",
              onClick: () => {
                setDeleteCustomer(contextMenu.item);
                closeMenu();
              },
            },
          ]}
        />
      )}

      {viewCustomer && (
        <ViewCustomerModal
          key={`view-${viewCustomer.id}`}
          customer={viewCustomer}
          isOpen
          onOpenChange={(open) => {
            if (!open) setViewCustomer(null);
          }}
        />
      )}
      {editCustomer && (
        <EditCustomerModal
          key={`edit-${editCustomer.id}`}
          customer={editCustomer}
          onCustomerEdited={() => {
            mutate();
            setEditCustomer(null);
          }}
          isOpen
          onOpenChange={(open) => {
            if (!open) setEditCustomer(null);
          }}
        />
      )}
      {deleteCustomer && (
        <DeleteCustomerModal
          key={`delete-${deleteCustomer.id}`}
          customer={deleteCustomer}
          onCustomerDeleted={() => {
            mutate();
            setDeleteCustomer(null);
          }}
          isOpen
          onOpenChange={(open) => {
            if (!open) setDeleteCustomer(null);
          }}
        />
      )}

      <TablePagination page={page} total={pages} onChange={setPage} />
    </div>
  );
}
