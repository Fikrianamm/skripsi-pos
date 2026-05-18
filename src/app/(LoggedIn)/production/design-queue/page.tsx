"use client";

import React from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Button,
  Divider,
  Pagination,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  PackageSearch,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import {
  FilterLanjutan,
  FilterSection,
  FilterButtonGroup,
} from "@/components/filter-lanjutan";
import { authClient } from "@/lib/auth-client";
import { DesignOrder } from "./components/types";
import { DesignOrderCard, DesignCardSkeleton } from "./components/design-order-card";

// ── Filter Options ─────────────────────────────────────────────────────────────
const HAS_FILE_OPTIONS = [
  { key: "all", label: "Semua" },
  { key: "true", label: "Ada File" },
  { key: "false", label: "Belum Ada File" },
];

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Page() {
  const { data: sessionData } = authClient.useSession();
  const role = sessionData?.user?.role ?? "";
  const canEdit = role === "admin" || role === "designer";
  const currentUser = sessionData?.user ? { id: sessionData.user.id, role: role } : null;

  const [search, setSearch] = React.useState("");
  const [hasFileFilter, setHasFileFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [queueTab, setQueueTab] = React.useState("all"); // "all" | "mine"
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const limit = 12;

  const designerIdFilter = queueTab === "mine" && sessionData?.user?.id ? sessionData.user.id : "";
  const apiUrl = `/api/production/design-queue?page=${page}&limit=${limit}&search=${debouncedSearch}&hasFile=${hasFileFilter}&sortBy=${sortBy}&designerId=${designerIdFilter}`;

  const { data, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    keepPreviousData: true,
    refreshInterval: 30_000,
  });

  const orders: DesignOrder[] = data?.results ?? [];
  const totalPages: number = data?.count ? Math.ceil(data.count / limit) : 0;

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, hasFileFilter, sortBy, queueTab]);

  const activeFilters = hasFileFilter !== "all" || search !== "" || queueTab !== "all";

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-5 mb-6">
      <PageHeader
        title="Antrian Desain"
        description="Kelola file desain untuk pesanan yang sedang di tahap Desain."
      />

      {/* Tabs Filter for Designer & Admin */}
      {(role === "designer" || role === "admin") && (
        <Tabs
          selectedKey={queueTab}
          onSelectionChange={(key) => setQueueTab(key as string)}
          variant="solid"
          color="primary"
          size="sm"
          className="self-start shrink-0"
        >
          <Tab key="all" title="Semua Antrian" />
          <Tab key="mine" title="Antrian Saya" />
        </Tabs>
      )}

      {/* ── Filter Bar ── */}
      <div className="flex flex-col md:flex-row gap-2">
        <SearchInput
          value={search}
          placeholder="Cari nomor order atau customer..."
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="w-full"
        />
        <div className="flex flex-row gap-2 items-center justify-start">
          <FilterLanjutan
            activeCount={
              (hasFileFilter !== "all" ? 1 : 0) +
              (sortBy !== "createdAt" ? 1 : 0) +
              (queueTab !== "all" ? 1 : 0)
            }
            onReset={() => {
              setSearch("");
              setHasFileFilter("all");
              setSortBy("createdAt");
              setQueueTab("all");
            }}
          >
            <FilterSection label="Urutkan">
              <FilterButtonGroup
                options={[
                  { key: "createdAt", label: "Terbaru" },
                  { key: "deadline", label: "Deadline" },
                ]}
                value={sortBy}
                onChange={setSortBy}
              />
            </FilterSection>

            <FilterSection label="File Desain">
              <FilterButtonGroup
                options={HAS_FILE_OPTIONS}
                value={hasFileFilter}
                onChange={setHasFileFilter}
              />
            </FilterSection>
          </FilterLanjutan>
        </div>
      </div>
      {data?.count !== undefined && (
        <div className="flex gap-2 items-center">
          <span className="text-xs text-default-400 tabular-nums">
            {data.count} order ditemukan
          </span>
          <Divider className="flex-1" />
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 text-xs text-default-400 flex-wrap pb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-danger" />
          <span>Deadline terlewat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-warning" />
          <span>Deadline ≤ 2 hari</span>
        </div>
        {!canEdit && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="italic">Mode view-only</span>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <DesignCardSkeleton key={i} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-default-400">
          <PackageSearch size={56} strokeWidth={1.1} />
          <div className="text-center">
            <p className="text-base font-medium">
              Tidak ada order di antrian desain
            </p>
            <p className="text-sm mt-1">
              {activeFilters
                ? "Coba ubah atau reset filter di atas."
                : "Order akan muncul di sini ketika statusnya berubah ke Desain."}
            </p>
          </div>
          {activeFilters && (
            <Button
              size="sm"
              variant="flat"
              onPress={() => {
                setSearch("");
                setHasFileFilter("all");
                setQueueTab("all");
              }}
            >
              Reset Filter
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((order) => (
            <DesignOrderCard
              key={order.id}
              order={order}
              canEdit={canEdit}
              onMutate={mutate}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center pt-2">
          <Pagination
            total={totalPages}
            page={page}
            onChange={setPage}
            showControls
            size="sm"
            color="primary"
            variant="flat"
          />
        </div>
      )}
    </div>
  );
}
