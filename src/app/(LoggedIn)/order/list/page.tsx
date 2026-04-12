"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/func";
import { PageHeader } from "@/components/page-header";
import { Spinner, Divider } from "@heroui/react";
import { ShoppingBag } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { OrderRow } from "../components/types";
import { OrderToolbar } from "./components/order-toolbar";
import { OrderCard } from "./components/order-card";
import { TablePagination } from "@/components/data-table/table-pagination";


export default function Page() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filterStatusProduksi, setFilterStatusProduksi] = useState("");
  const [filterStatusBayar, setFilterStatusBayar] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const debouncedSearch = useDebounce(search, 300);

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(filterStatusProduksi && { statusProduksi: filterStatusProduksi }),
    ...(filterStatusBayar && { statusPembayaran: filterStatusBayar }),
  });

  const { data, isLoading, mutate } = useSWR(
    `/api/order?${params.toString()}`,
    fetcher,
    { keepPreviousData: true },
  );

  const orders: OrderRow[] = data?.results ?? [];
  const totalPages: number = data?.totalPages ?? 1;
  const totalCount: number = data?.count ?? 0;

  const hasFilters = !!(search || filterStatusProduksi || filterStatusBayar);

  function resetPage() {
    setPage(1);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-5 mb-4">
      <PageHeader
        title="Daftar Pesanan"
        description="Pantau status produksi, pembayaran, dan detail setiap pesanan."
      />

      <OrderToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          resetPage();
        }}
        filterStatusProduksi={filterStatusProduksi}
        onFilterStatusProduksiChange={(v) => {
          setFilterStatusProduksi(v);
          resetPage();
        }}
        filterStatusBayar={filterStatusBayar}
        onFilterStatusBayarChange={(v) => {
          setFilterStatusBayar(v);
          resetPage();
        }}
        sortBy={sortBy}
        onSortByChange={(v) => {
          setSortBy(v);
          resetPage();
        }}
        onRefresh={() => mutate()}
        onCreateOrder={() => router.push("/order/pos")}
      />

      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Spinner size="lg" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-default-400 gap-3">
          <ShoppingBag size={48} strokeWidth={1.2} />
          <p className="text-base font-medium">
            {hasFilters ? "Tidak ada pesanan yang cocok" : "Belum ada pesanan"}
          </p>
          {!hasFilters && (
            <p className="text-sm">
              Klik <strong>Buat Pesanan</strong> untuk membuat pesanan baru
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-default-400 tabular-nums">Menampilkan {orders.length} dari {totalCount} pesanan</span>
            <Divider className="flex-1"/>
          </div>

          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onNavigate={() => router.push(`/order/${order.id}`)}
                onStatusUpdated={() => mutate()}
              />
            ))}
          </div>

          <TablePagination
            page={page}
            total={totalPages}
            onChange={setPage}
            limit={limit}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
            totalItems={totalCount}
          />
        </>
      )}
    </div>
  );
}
