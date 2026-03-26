/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { type UseFormRegister, type FieldErrors } from "react-hook-form";
import { Input } from "@heroui/input";
import { ClipboardCheck } from "lucide-react";
import type { OpnameFormData } from "../schema";
import { SearchInput } from "@/components/search-input";
import { useState } from "react";

interface BahanBakuRow {
  id: string;
  nama: string;
  stok: number;
  unit?: { nama: string };
}

interface Props {
  fields: { id: string }[];
  register: UseFormRegister<OpnameFormData>;
  errors: FieldErrors<OpnameFormData>;
  bahanBakuRows: BahanBakuRow[];
  watchItems: OpnameFormData["items"];
}

export function BahanBakuOpnameList({
  fields,
  register,
  errors,
  bahanBakuRows,
  watchItems,
}: Props) {
  const [search, setSearch] = useState("");

  const filteredIndices = bahanBakuRows
    .map((_, i) => i)
    .filter((i) =>
      bahanBakuRows[i].nama.toLowerCase().includes(search.toLowerCase()),
    );

  return (
    <div className="rounded-2xl border border-divider bg-content1 overflow-hidden flex-1">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-divider bg-default-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-warning/10 text-warning">
            <ClipboardCheck size={16} />
          </div>
          <span className="text-sm font-semibold">Daftar Koreksi Stok</span>
          <span className="text-xs text-foreground-400">
            {fields.length} item
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b border-divider">
        <SearchInput
          value={search}
          placeholder="Cari bahan baku..."
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="w-full"
        />
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-12 gap-3 px-5 py-2 text-xs font-semibold text-foreground-400 uppercase tracking-wide border-b border-divider bg-default-50/50">
        <div className="col-span-4">Bahan Baku</div>
        <div className="col-span-2">Satuan</div>
        <div className="col-span-2 text-right">Stok Sistem</div>
        <div className="col-span-3">Stok Fisik</div>
        <div className="col-span-1 text-right">Selisih</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-divider max-h-[60vh] overflow-y-auto">
        {filteredIndices.length === 0 ? (
          <p className="text-center py-8 text-sm text-foreground-400">
            Tidak ada bahan baku ditemukan
          </p>
        ) : (
          filteredIndices.map((idx) => {
            const bb = bahanBakuRows[idx];
            const stokSistem = bb.stok;
            const stokFisikRaw = watchItems[idx]?.stokFisik;
            const stokFisik =
              stokFisikRaw !== "" && stokFisikRaw !== undefined
                ? Number(stokFisikRaw)
                : NaN;
            const selisih = isNaN(stokFisik) ? null : stokFisik - stokSistem;
            const error = errors.items?.[idx];

            return (
              <div
                key={fields[idx]?.id ?? idx}
                className="grid grid-cols-12 gap-3 px-5 py-2.5 items-center hover:bg-default-50 transition-colors"
              >
                {/* Hidden field for bahanBakuId */}
                <input
                  type="hidden"
                  {...register(`items.${idx}.bahanBakuId` as const)}
                />

                {/* Nama */}
                <div className="col-span-4">
                  <p className="text-sm font-medium leading-tight">{bb.nama}</p>
                </div>

                {/* Satuan */}
                <div className="col-span-2">
                  <span className="text-xs text-foreground-500 bg-default-100 px-2 py-0.5 rounded-md">
                    {bb.unit?.nama ?? "—"}
                  </span>
                </div>

                {/* Stok Sistem */}
                <div className="col-span-2 text-right">
                  <span className="text-sm tabular-nums font-medium">
                    {stokSistem.toLocaleString("id-ID")}
                  </span>
                </div>

                {/* Stok Fisik Input */}
                <div className="col-span-3">
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    size="sm"
                    placeholder={String(stokSistem)}
                    classNames={{ inputWrapper: "h-8 min-h-8" }}
                    {...register(`items.${idx}.stokFisik` as const)}
                    isInvalid={!!error?.stokFisik}
                    errorMessage={error?.stokFisik?.message}
                  />
                </div>

                {/* Selisih */}
                <div className="col-span-1 text-right">
                  {selisih === null ? (
                    <span className="text-foreground-300 text-xs">—</span>
                  ) : (
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        selisih === 0
                          ? "text-foreground-400"
                          : selisih > 0
                            ? "text-success"
                            : "text-danger"
                      }`}
                    >
                      {selisih > 0 ? "+" : ""}
                      {selisih.toLocaleString("id-ID")}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
