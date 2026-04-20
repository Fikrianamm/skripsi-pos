"use client";
import React from "react";
import { TableCell, TableRow } from "@heroui/table";
import { Button } from "@heroui/button";
import { Chip, Divider, type Selection } from "@heroui/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, History, MoreVertical, PenLine, Trash2 } from "lucide-react";
import { fetcher, formatRupiah, getInitialName } from "@/lib/func";
import useSWR from "swr";
import { Customer as CustomerType } from "@/types/types";
import AddCustomerModal from "./components/add-customer-modal";
import BulkDeleteCustomerModal from "./components/bulk-delete-customer-modal";
import ViewCustomerModal from "./components/view-customer-modal";
import DeleteCustomerModal from "./components/delete-customer-modal";
import EditCustomerModal from "./components/edit-customer-modal";
import CustomerHistoryModal from "./components/customer-history-modal";
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

// Extended type including aggregated fields from API
interface CustomerWithStats extends CustomerType {
  firstOrder?: { id: string; nomorOrder: string; createdAt: string } | null;
  totalOrder?: number;
  totalSpend?: number;
}

export default function Page() {
  const { selectionMode } = useTableMultipleSelection(true);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
    new Set([""]),
  );
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);

  const [editCustomer, setEditCustomer] =
    React.useState<CustomerWithStats | null>(null);
  const [deleteCustomer, setDeleteCustomer] =
    React.useState<CustomerWithStats | null>(null);
  const [viewCustomer, setViewCustomer] =
    React.useState<CustomerWithStats | null>(null);
  const [historyCustomer, setHistoryCustomer] =
    React.useState<CustomerWithStats | null>(null);

  const { contextMenu, openMenu, openMenuFromButton, closeMenu } =
    useContextMenu<CustomerWithStats>();

  const { data, isLoading, mutate } = useSWR(
    `/api/admin/customer?page=${page}&limit=${limit}&search=${debouncedSearch}`,
    fetcher,
    { keepPreviousData: true },
  );

  const pages = React.useMemo(
    () => (data?.count ? Math.ceil(data.count / limit) : 0),
    [data?.count, limit],
  );

  const selectedIds = React.useMemo(() => {
    if (selectedKeys === "all")
      return (data?.results ?? []).map((c: CustomerWithStats) => c.id);
    return Array.from(selectedKeys).filter((k) => k !== "");
  }, [selectedKeys, data?.results]);

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4 mb-4">
      <PageHeader
        title="Manajemen Pelanggan"
        description="Kelola data pelanggan dan informasi kontak mereka."
      />

      <div className="flex flex-row gap-2 items-center">
        <SearchInput
          value={search}
          placeholder="Cari customer"
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="flex-1"
        />
        <AddCustomerModal onCustomerAdded={() => mutate()} />
      </div>

      {/* Count */}
      {data?.count !== undefined && (
        <div className="flex gap-2 items-center">
          <span className="text-xs text-default-400 tabular-nums">
            Menampilkan {data?.results.length} dari {data.count} pelanggan
          </span>
          <Divider className="flex-1" />
        </div>
      )}

      <BulkSelectionBar count={selectedIds.length} label="customer dipilih">
        <BulkDeleteCustomerModal
          selectedIds={selectedIds as string[]}
          onDeleted={() => {
            setSelectedKeys(new Set([""]));
            mutate();
          }}
        />
      </BulkSelectionBar>

      <DataTable<CustomerWithStats>
        columns={columns}
        items={(data?.results ?? []) as CustomerWithStats[]}
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
            {/* Pesanan Pertama */}
            <TableCell>
              {customer.firstOrder ? (
                <button
                  className="text-primary text-sm hover:underline font-medium text-left"
                  onClick={() => setHistoryCustomer(customer)}
                >
                  {new Date(customer.firstOrder.createdAt).toLocaleDateString(
                    "id-ID",
                    { day: "numeric", month: "short", year: "numeric" },
                  )}
                </button>
              ) : (
                <span className="text-default-400 text-sm">-</span>
              )}
            </TableCell>
            {/* Total Pesanan */}
            <TableCell>
              {customer.totalOrder !== undefined && customer.totalOrder > 0 ? (
                <Chip size="sm" variant="flat" color="primary">
                  {customer.totalOrder} pesanan
                </Chip>
              ) : (
                <span className="text-default-400 text-sm">0</span>
              )}
            </TableCell>
            {/* Total Belanja */}
            <TableCell>
              {customer.totalSpend !== undefined && customer.totalSpend > 0 ? (
                <span className="font-semibold text-sm">
                  {formatRupiah(customer.totalSpend)}
                </span>
              ) : (
                <span className="text-default-400 text-sm">-</span>
              )}
            </TableCell>
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
              label: "Riwayat Pesanan",
              icon: <History size={16} />,
              variant: "default",
              onClick: () => {
                setHistoryCustomer(contextMenu.item);
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
      {historyCustomer && (
        <CustomerHistoryModal
          key={`history-${historyCustomer.id}`}
          customer={historyCustomer}
          isOpen
          onOpenChange={(open) => {
            if (!open) setHistoryCustomer(null);
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

      <TablePagination
        page={page}
        total={pages}
        onChange={setPage}
        limit={limit}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        totalItems={data?.count}
      />
    </div>
  );
}
