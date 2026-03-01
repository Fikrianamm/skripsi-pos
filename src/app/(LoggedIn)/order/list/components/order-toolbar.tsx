"use client";

import { Button, Input, Select, SelectItem, Tooltip } from "@heroui/react";
import { Plus, Search, RefreshCw } from "lucide-react";
import {
  STATUS_PRODUKSI_OPTIONS,
  STATUS_BAYAR_OPTIONS,
} from "../../components/types";

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
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Cari nomor order / nama customer..."
        startContent={<Search size={15} className="text-default-400" />}
        value={search}
        onValueChange={onSearchChange}
        isClearable
        onClear={() => onSearchChange("")}
        className="max-w-xs"
        variant="bordered"
        size="sm"
        classNames={{ inputWrapper: "border-1" }}
      />

      <Select
        size="sm"
        className="max-w-[200px]"
        selectedKeys={filterStatusProduksi ? [filterStatusProduksi] : [""]}
        onSelectionChange={(keys) =>
          onFilterStatusProduksiChange((Array.from(keys)[0] as string) ?? "")
        }
        aria-label="Filter status produksi"
      >
        {STATUS_PRODUKSI_OPTIONS.map((o) => (
          <SelectItem key={o.key}>{o.label}</SelectItem>
        ))}
      </Select>

      <Select
        size="sm"
        className="max-w-[180px]"
        selectedKeys={filterStatusBayar ? [filterStatusBayar] : [""]}
        onSelectionChange={(keys) =>
          onFilterStatusBayarChange((Array.from(keys)[0] as string) ?? "")
        }
        aria-label="Filter status bayar"
      >
        {STATUS_BAYAR_OPTIONS.map((o) => (
          <SelectItem key={o.key}>{o.label}</SelectItem>
        ))}
      </Select>

      <Select
        size="sm"
        className="max-w-[180px]"
        selectedKeys={[sortBy]}
        onSelectionChange={(keys) =>
          onSortByChange((Array.from(keys)[0] as string) ?? "createdAt")
        }
        aria-label="Urutan"
      >
        {SORT_OPTIONS.map((o) => (
          <SelectItem key={o.key}>{o.label}</SelectItem>
        ))}
      </Select>

      <div className="flex items-center gap-2 ml-auto">
        <Tooltip content="Refresh">
          <Button isIconOnly variant="flat" size="sm" onPress={onRefresh}>
            <RefreshCw size={15} />
          </Button>
        </Tooltip>
        <Button
          color="primary"
          size="sm"
          startContent={<Plus size={15} />}
          onPress={onCreateOrder}
        >
          Buat Pesanan
        </Button>
      </div>
    </div>
  );
}
