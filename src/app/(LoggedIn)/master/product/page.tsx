"use client";
import React from "react";
import { TableCell, TableRow } from "@heroui/table";
import { Button } from "@heroui/button";
import { Chip, Image, type Selection } from "@heroui/react";
import { MoreVertical, PenLine, Trash2, Eye } from "lucide-react";
import { fetcher, getStockStatus } from "@/lib/func";
import useSWR, { useSWRConfig } from "swr";
import { Product as ProductType, Category } from "@/types/types";
import { useTableMultipleSelection } from "@/hooks/use-table-multiple-selection";
import { useDebounce } from "@/hooks/use-debounce";
import { useContextMenu } from "@/hooks/use-context-menu";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import {
  FilterLanjutan,
  FilterSection,
  FilterSelect,
  FilterButtonGroup,
} from "@/components/filter-lanjutan";
import { ContextMenu } from "@/components/data-table/context-menu";
import { BulkSelectionBar } from "@/components/data-table/bulk-selection-bar";
import { DataTable } from "@/components/data-table/data-table";
import { TablePagination } from "@/components/data-table/table-pagination";
import { columns } from "./components/columns";
import AddProductModal from "./components/add-product-modal";
import EditProductModal from "./components/edit-product-modal";
import DeleteProductModal from "./components/delete-product-modal";
import BulkDeleteProductModal from "./components/bulk-delete-modal";
import ViewProductModal from "./components/view-product-modal";
import DrawerManageCategory from "../customer/components/drawer-category";

const ROWS_PER_PAGE = 10;

export default function Page() {
  const { selectionMode } = useTableMultipleSelection(true);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
    new Set([""]),
  );
  const [selectedCategory, setSelectedCategory] = React.useState<Selection>(
    new Set(["all"]),
  );
  const [selectedType, setSelectedType] = React.useState<
    "all" | "true" | "false"
  >("all");
  const [page, setPage] = React.useState(1);
  const { mutate: mutateGlobal } = useSWRConfig();

  const [editProduct, setEditProduct] = React.useState<ProductType | null>(
    null,
  );
  const [deleteProduct, setDeleteProduct] = React.useState<ProductType | null>(
    null,
  );
  const [viewProduct, setViewProduct] = React.useState<ProductType | null>(
    null,
  );
  const { contextMenu, openMenu, openMenuFromButton, closeMenu } =
    useContextMenu<ProductType>();

  const categoryKey = Array.from(selectedCategory)[0] as string;

  const { data, isLoading, mutate } = useSWR(
    `/api/admin/product?page=${page}&search=${debouncedSearch}${categoryKey !== "all" ? `&categoryId=${categoryKey}` : ""}${selectedType !== "all" ? `&isService=${selectedType}` : ""}`,
    fetcher,
    { keepPreviousData: true },
  );

  const { data: categoryData } = useSWR(`/api/category?limit=100`, fetcher);

  const pages = React.useMemo(
    () => (data?.count ? Math.ceil(data.count / ROWS_PER_PAGE) : 0),
    [data?.count],
  );

  const selectedIds = React.useMemo(() => {
    if (selectedKeys === "all")
      return (data?.results ?? []).map((u: ProductType) => u.id);
    return Array.from(selectedKeys).filter((k) => k !== "");
  }, [selectedKeys, data?.results]);

  const categoryOptions: { key: string; label: string }[] = [
    { key: "all", label: "Semua" },
    ...(categoryData?.results ?? []).map((c: Category) => ({
      key: c.id,
      label: c.nama,
    })),
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-5 mb-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader
          title="Manajemen Produk"
          description="Kelola produk, kategori, dan harga produk."
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
          placeholder="Cari produk"
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="w-full"
        />
        <div className="flex flex-row gap-2 items-center justify-start">
          <FilterLanjutan
            activeCount={
              (categoryKey !== "all" ? 1 : 0) + (selectedType !== "all" ? 1 : 0)
            }
            onReset={() => {
              setSelectedCategory(new Set(["all"]));
              setSelectedType("all");
              setSearch("");
            }}
          >
            <FilterSection label="Kategori">
              <FilterSelect
                value={categoryKey}
                onChange={(v) => setSelectedCategory(new Set([v]))}
                options={categoryOptions}
              />
            </FilterSection>
            <FilterSection label="Tipe">
              <FilterButtonGroup
                options={[
                  { key: "all", label: "Semua" },
                  { key: "false", label: "Produk" },
                  { key: "true", label: "Jasa" },
                ]}
                value={selectedType}
                onChange={(v) => setSelectedType(v as "all" | "true" | "false")}
              />
            </FilterSection>
          </FilterLanjutan>
          <AddProductModal onProductCreated={() => mutate()} />
        </div>
      </div>

      <BulkSelectionBar count={selectedIds.length} label="produk dipilih">
        <BulkDeleteProductModal
          productIds={selectedIds as string[]}
          onDeleted={() => {
            mutate();
            setSelectedKeys(new Set([""]));
          }}
        />
      </BulkSelectionBar>

      <DataTable<ProductType>
        columns={columns}
        items={(data?.results ?? []) as ProductType[]}
        isLoading={isLoading}
        selectionMode={selectionMode}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        renderRow={(product) => {
          const status = getStockStatus(product);
          return (
            <TableRow
              key={product.id}
              onContextMenu={(e) => openMenu(e, product)}
              className="cursor-context-menu"
            >
              <TableCell>
                <div className="flex items-center gap-2 font-medium">
                  <Image
                    alt={product.nama}
                    src={product.image}
                    fallbackSrc="https://placehold.co/50x50?text=.png"
                    width={50}
                    height={50}
                    className="object-contain"
                  />
                  {product.nama}
                </div>
              </TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell>{product.category?.nama ?? "-"}</TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  variant="flat"
                  color={product.isService ? "secondary" : "default"}
                >
                  {product.isService ? "Jasa" : "Produk"}
                </Chip>
              </TableCell>
              <TableCell>{`Rp.${String(product.hpp)}`}</TableCell>
              <TableCell>{`Rp.${String(product.hargaJual)}`}</TableCell>
              <TableCell>-</TableCell>
              <TableCell>
                <Chip color={status.color} size="sm" variant="flat">
                  {status.label}
                </Chip>
              </TableCell>
              <TableCell className="md:hidden">
                <Button
                  className="p-1.5 rounded-md hover:bg-accent"
                  onClick={(e) => openMenuFromButton(e, product)}
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

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={[
            {
              label: "Lihat Detail",
              icon: <Eye size={16} />,
              variant: "default",
              onClick: () => {
                setViewProduct(contextMenu.item);
                closeMenu();
              },
            },
            {
              label: "Edit",
              icon: <PenLine size={16} />,
              variant: "primary",
              onClick: () => {
                setEditProduct(contextMenu.item);
                closeMenu();
              },
            },
            {
              label: "Hapus",
              icon: <Trash2 size={16} />,
              variant: "destructive",
              onClick: () => {
                setDeleteProduct(contextMenu.item);
                closeMenu();
              },
            },
          ]}
        />
      )}

      {editProduct && (
        <EditProductModal
          key={`edit-${editProduct.id}`}
          product={editProduct}
          onProductUpdated={() => {
            mutate();
            setEditProduct(null);
          }}
          isOpen
          onOpenChange={(open) => {
            if (!open) setEditProduct(null);
          }}
        />
      )}
      {deleteProduct && (
        <DeleteProductModal
          key={`delete-${deleteProduct.id}`}
          product={deleteProduct}
          onProductDeleted={() => {
            mutate();
            setDeleteProduct(null);
          }}
          isOpen
          onOpenChange={(open) => {
            if (!open) setDeleteProduct(null);
          }}
        />
      )}

      {viewProduct && (
        <ViewProductModal
          key={`view-${viewProduct.id}`}
          product={viewProduct}
          isOpen
          onOpenChange={(open) => {
            if (!open) setViewProduct(null);
          }}
        />
      )}

      <TablePagination page={page} total={pages} onChange={setPage} />
    </div>
  );
}
