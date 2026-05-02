/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Controller,
  type UseFormRegister,
  type FieldErrors,
  type Control,
} from "react-hook-form";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Chip, Select, SelectItem } from "@heroui/react";
import { Plus, Trash2, PackagePlus, Box } from "lucide-react";
import { formatRupiah } from "@/lib/func";
import type { PenerimaanFormData } from "../schema";

interface BahanBakuItem {
  id: string;
  bahanBakuId: string;
  jumlah: string;
  hargaBeli?: string;
}

interface Props {
  fields: BahanBakuItem[];
  control: Control<PenerimaanFormData>;
  register: UseFormRegister<PenerimaanFormData>;
  errors: FieldErrors<PenerimaanFormData>;
  bahanBakuData: any;
  watchItems: PenerimaanFormData["items"];
  displayHarga: string[];
  liveTotal: number;
  onHargaChange: (index: number, raw: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function BahanBakuList({
  fields,
  control,
  register,
  errors,
  bahanBakuData,
  watchItems,
  displayHarga,
  liveTotal,
  onHargaChange,
  onAdd,
  onRemove,
}: Props) {
  return (
    <div className="rounded-2xl border border-divider bg-content1 overflow-hidden flex-1">
      <div className="flex items-center justify-between px-5 py-4 border-b border-divider bg-default-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-success/10 text-success">
            <PackagePlus size={16} />
          </div>
          <span className="text-sm font-semibold">Daftar Bahan Baku</span>
          <Chip size="sm" variant="flat" className="text-xs">
            {fields.length} item
          </Chip>
        </div>
        <div className="text-right">
          <p className="text-xs text-foreground-400 mb-0.5">Total Estimasi</p>
          <p className="text-base font-bold text-primary">
            {formatRupiah(liveTotal)}
          </p>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {/* Column headers (desktop) */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-1 text-xs font-semibold text-foreground-400 uppercase tracking-wide">
          <div className="col-span-5">Bahan Baku</div>
          <div className="col-span-3">Qty</div>
          <div className="col-span-3">Harga Beli</div>
          <div className="col-span-1" />
        </div>

        {fields.map((field, index) => {
          const bId = watchItems[index]?.bahanBakuId;
          const selectedBahan = (bahanBakuData?.results ?? []).find(
            (b: any) => b.id === bId,
          );
          const unitName = selectedBahan?.unit?.nama || "Satuan";
          const error = errors.items?.[index];

          return (
            <div
              key={field.id}
              className="sm:grid sm:grid-cols-12 gap-3 items-start flex flex-col bg-default-50 sm:bg-transparent rounded-xl sm:rounded-none p-3 sm:p-0 border border-divider sm:border-none"
            >
              {/* Bahan Baku */}
              <div className="col-span-5 w-full">
                <label className="text-xs text-foreground-500 mb-1 block sm:hidden">
                  Bahan Baku
                </label>
                <Controller
                  name={`items.${index}.bahanBakuId`}
                  control={control}
                  render={({ field }) => (
                    <Select
                      placeholder="Pilih Bahan Baku"
                      startContent={
                        <Box
                          size={16}
                          className="text-foreground-400 shrink-0"
                        />
                      }
                      selectedKeys={field.value ? [field.value] : []}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      name={field.name}
                      isInvalid={!!error?.bahanBakuId}
                      errorMessage={error?.bahanBakuId?.message}
                      classNames={{ trigger: "h-10 min-h-10" }}
                    >
                      <SelectItem key="">— Pilih Bahan Baku —</SelectItem>
                      {(bahanBakuData?.results ?? []).map((b: any) => (
                        <SelectItem
                          key={b.id}
                          textValue={`${b.nama} (${b.unit?.nama})`}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm">{b.nama}</span>
                            <span className="text-xs text-default-400">
                              Satuan: {b.unit?.nama || "-"}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                />
              </div>

              {/* Qty */}
              <div className="col-span-3 w-full">
                <label className="text-xs text-foreground-500 mb-1 block sm:hidden">
                  Qty ({unitName})
                </label>
                <Input
                  type="number"
                  step="any"
                  min={0.01}
                  placeholder={`0 ${unitName?.toLowerCase()}`}
                  classNames={{ inputWrapper: "h-10 min-h-10" }}
                  {...register(`items.${index}.jumlah` as const)}
                  isInvalid={!!error?.jumlah}
                  errorMessage={error?.jumlah?.message}
                />
              </div>

              {/* Harga Beli */}
              <div className="col-span-3 w-full">
                <label className="text-xs text-foreground-500 mb-1 block sm:hidden">
                  Harga Beli
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  classNames={{ inputWrapper: "h-10 min-h-10" }}
                  startContent={
                    <span className="text-foreground-400 text-sm shrink-0">
                      Rp
                    </span>
                  }
                  endContent={
                    <span className="text-foreground-400 text-sm shrink-0">
                      /{unitName}
                    </span>

                  }
                  value={displayHarga[index] ?? ""}
                  onChange={(e) => onHargaChange(index, e.target.value)}
                />
              </div>

              {/* Remove */}
              <div className="col-span-1 flex items-center justify-end sm:justify-center w-full sm:w-auto">
                <Button
                  isIconOnly
                  color="danger"
                  variant="light"
                  size="sm"
                  className="rounded-lg opacity-50 hover:opacity-100"
                  onPress={() => onRemove(index)}
                  isDisabled={fields.length === 1}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          );
        })}

        <Button
          size="sm"
          variant="solid"
          color="primary"
          startContent={<Plus size={15} />}
          onPress={onAdd}
          className="mt-1 rounded-xl w-full sm:w-auto"
        >
          Tambah Bahan Lain
        </Button>
      </div>
    </div>
  );
}
