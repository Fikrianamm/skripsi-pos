"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/func";
import { PageHeader } from "@/components/page-header";
import { Spinner, Divider, Chip } from "@heroui/react";
import { ShoppingBag, AlertCircle } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { OrderRow } from "../components/types";
import { OrderToolbar } from "./components/order-toolbar";
import { OrderCard } from "./components/order-card";
import { TablePagination } from "@/components/data-table/table-pagination";
import { authClient } from "@/lib/auth-client";

export default function Page() {
  const router = useRouter();
  const { data: sessionData } = authClient.useSession();
  const userRole = sessionData?.user?.role ?? "";

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

  // Fetch orders waiting for price approval (MENUNGGU_NEGOSIASI) — separate, no pagination
  const canSeeApproval = userRole === "kasir" || userRole === "admin" || userRole === "administrator";
  const { data: pendingPriceData, mutate: mutatePending } = useSWR(
    canSeeApproval ? `/api/order?statusHarga=MENUNGGU_NEGOSIASI&limit=50&page=1` : null,
    fetcher,
    { keepPreviousData: true },
  );

  const orders: OrderRow[] = data?.results ?? [];
  const totalPages: number = data?.totalPages ?? 1;
  const totalCount: number = data?.count ?? 0;
  const pendingPriceOrders: OrderRow[] = pendingPriceData?.results ?? [];

  const hasFilters = !!(search || filterStatusProduksi || filterStatusBayar);

  function resetPage() {
    setPage(1);
  }

  function handleMutateAll() {
    mutate();
    mutatePending();
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
        onRefresh={() => handleMutateAll()}
        onCreateOrder={() => router.push("/order/pos")}
        showCreateOrder={userRole === "kasir" || userRole === "admin" || userRole === "administrator"}
      />

      {/* ── Section: Menunggu Persetujuan Harga ── */}
      {canSeeApproval && pendingPriceOrders.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-warning-700 bg-warning-50 border border-warning-200 rounded-lg px-3 py-1.5">
              <AlertCircle size={15} className="shrink-0" />
              <span className="text-xs font-semibold">Menunggu Persetujuan Harga</span>
              <Chip size="sm" color="warning" variant="flat" className="h-4 text-[10px] px-1">
                {pendingPriceOrders.length}
              </Chip>
            </div>
            <Divider className="flex-1" />
          </div>
          <p className="text-xs text-default-500 -mt-1">
            Pesanan custom berikut memiliki item yang bahan bakunya sudah ditentukan desainer dan menunggu kesepakatan harga dengan customer.
          </p>
          <div className="flex flex-col gap-3">
            {pendingPriceOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onNavigate={() => router.push(`/order/${order.id}`)}
                onStatusUpdated={() => handleMutateAll()}
                userRole={userRole}
              />
            ))}
          </div>
          <Divider />
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2 justify-center items-center py-24">
          <Spinner size="lg" />
          <p className="text-base font-medium text-default-500">Memuat Data</p>
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
                onStatusUpdated={() => handleMutateAll()}
                userRole={userRole}
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
