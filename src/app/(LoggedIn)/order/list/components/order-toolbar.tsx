"use client";

import { Button, Tooltip } from "@heroui/react";
import { RefreshCw, ShoppingBag } from "lucide-react";
import { useState } from "react";
import {
  STATUS_PRODUKSI_OPTIONS,
  STATUS_BAYAR_OPTIONS,
} from "../../components/types";
import { SearchInput } from "@/components/search-input";
import {
  FilterLanjutan,
  FilterSection,
  FilterButtonGroup,
} from "@/components/filter-lanjutan";

export const SORT_OPTIONS = [
  { key: "createdAt", label: "Terbaru" },
  { key: "deadline", label: "Deadline Terdekat" },
];

interface OrderToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  filterStatusProduksi: string;
  onFilterStatusProduksiChange: (v: string) => void;
  filterStatusBayar: string;
  onFilterStatusBayarChange: (v: string) => void;
  sortBy: string;
  onSortByChange: (v: string) => void;
  onRefresh: () => void;
  onCreateOrder: () => void;
}

export function OrderToolbar({
  search,
  onSearchChange,
  filterStatusProduksi,
  onFilterStatusProduksiChange,
  filterStatusBayar,
  onFilterStatusBayarChange,
  sortBy,
  onSortByChange,
  onRefresh,
  onCreateOrder,
}: OrderToolbarProps) {
  const activeCount =
    (filterStatusProduksi ? 1 : 0) +
    (filterStatusBayar ? 1 : 0) +
    (sortBy !== "createdAt" ? 1 : 0);

  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefresh = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    onRefresh();
    setTimeout(() => setIsSpinning(false), 500); // Putar selama 500ms
  };

  return (
    <div className="flex flex-col md:flex-row gap-2">
      <SearchInput
        value={search}
        placeholder="Cari nomor order / nama customer..."
        onChange={onSearchChange}
        onClear={() => onSearchChange("")}
        className="w-full"
      />

      <div className="flex items-center gap-2 ml-auto">
        <FilterLanjutan
          activeCount={activeCount}
          onReset={() => {
            onFilterStatusProduksiChange("");
            onFilterStatusBayarChange("");
            onSortByChange("createdAt");
            onSearchChange("");
          }}
        >
          <FilterSection label="Status Produksi">
            <FilterButtonGroup
              options={[
                { key: "", label: "Semua" },
                ...STATUS_PRODUKSI_OPTIONS.filter((o) => o.key !== ""),
              ]}
              value={filterStatusProduksi}
              onChange={onFilterStatusProduksiChange}
            />
          </FilterSection>
          <FilterSection label="Status Bayar">
            <FilterButtonGroup
              options={[
                { key: "", label: "Semua" },
                ...STATUS_BAYAR_OPTIONS.filter((o) => o.key !== ""),
              ]}
              value={filterStatusBayar}
              onChange={onFilterStatusBayarChange}
            />
          </FilterSection>
          <FilterSection label="Urutan">
            <FilterButtonGroup
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={onSortByChange}
            />
          </FilterSection>
        </FilterLanjutan>
        <Tooltip content="Refresh">
          <Button
            isIconOnly
            variant="bordered"
            size="sm"
            onPress={handleRefresh}
          >
            <RefreshCw size={15} className={isSpinning ? "animate-spin" : ""} />
          </Button>
        </Tooltip>
        <Button
          color="primary"
          size="sm"
          startContent={<ShoppingBag size={15} />}
          onPress={onCreateOrder}
        >
          Buat Pesanan
        </Button>
      </div>
    </div>
  );
}
