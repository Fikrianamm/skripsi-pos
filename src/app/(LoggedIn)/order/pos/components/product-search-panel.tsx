"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, formatRupiah } from "@/lib/func";
import { Product } from "@/types/types";
import { Input, ScrollShadow, Spinner } from "@heroui/react";
import { Search, Package, ChevronRight } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface ProductSearchPanelProps {
  onAdd: (product: Product) => void;
}

export function ProductSearchPanel({ onAdd }: ProductSearchPanelProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useSWR(
    `/api/admin/product?search=${debouncedSearch}&limit=150`,
    fetcher,
    { keepPreviousData: true },
  );

  const products: Product[] = data?.results ?? [];

  return (
    <div className="flex flex-col gap-3 h-full">
      <Input
        placeholder="Cari produk berdasarkan nama / SKU..."
        startContent={<Search size={15} className="text-default-400" />}
        value={search}
        onValueChange={setSearch}
        isClearable
        onClear={() => setSearch("")}
        variant="bordered"
        classNames={{ inputWrapper: "border-1" }}
        autoComplete="off"
      />

      <ScrollShadow className="flex-1 overflow-y-auto" hideScrollBar>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-default-400 gap-2">
            <Package size={32} />
            <p className="text-sm">
              {search
                ? "Produk tidak ditemukan"
                : "Ketik nama produk untuk mencari"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onAdd(p)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-default-100 active:bg-default-200 transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-md bg-default-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt={p.nama}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={16} className="text-default-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-default-800 truncate">
                    {p.nama}
                  </p>
                  <p className="text-xs text-default-400">
                    {p.sku} · {p.category?.nama}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-default-700">
                    {formatRupiah(p.hargaJual)}
                  </p>
                  {!p.isService && (
                    <p className="text-xs text-default-400">
                      Stok: {p.stok ?? "∞"}
                    </p>
                  )}
                </div>
                <ChevronRight
                  size={14}
                  className="text-default-300 group-hover:text-primary transition-colors"
                />
              </button>
            ))}
          </div>
        )}
      </ScrollShadow>
    </div>
  );
}
