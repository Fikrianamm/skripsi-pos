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
import { Plus, Trash2, PackageMinus, Box } from "lucide-react";
import type { PengeluaranFormData } from "../schema";

interface BahanBakuItem {
  id: string;
  bahanBakuId: string;
  jumlah: string;
}

interface Props {
  fields: BahanBakuItem[];
  control: Control<PengeluaranFormData>;
  register: UseFormRegister<PengeluaranFormData>;
  errors: FieldErrors<PengeluaranFormData>;
  bahanBakuData: any;
  watchItems: PengeluaranFormData["items"];
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function BahanBakuKeluarList({
  fields,
  control,
  register,
  errors,
  bahanBakuData,
  watchItems,
  onAdd,
  onRemove,
}: Props) {
  return (
    <div className="rounded-2xl border border-divider bg-content1 overflow-hidden flex-1">
      <div className="flex items-center justify-between px-5 py-4 border-b border-divider bg-default-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-danger/10 text-danger">
            <PackageMinus size={16} />
          </div>
          <span className="text-sm font-semibold">Daftar Bahan Baku Keluar</span>
          <Chip size="sm" variant="flat" className="text-xs">
            {fields.length} item
          </Chip>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {/* Column headers (desktop) */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-1 text-xs font-semibold text-foreground-400 uppercase tracking-wide">
          <div className="col-span-7">Bahan Baku</div>
          <div className="col-span-4">Jumlah</div>
          <div className="col-span-1" />
        </div>

        {fields.map((field, index) => {
          const bId = watchItems[index]?.bahanBakuId;
          const selectedBahan = (bahanBakuData?.results ?? []).find(
            (b: any) => b.id === bId,
          );
          const unitName = selectedBahan?.unit?.nama || "Satuan";
          const stokTersedia = selectedBahan
            ? Number(selectedBahan.stok)
            : null;
          const error = errors.items?.[index];

          return (
            <div
              key={field.id}
              className="sm:grid sm:grid-cols-12 gap-3 items-start flex flex-col bg-default-50 sm:bg-transparent rounded-xl sm:rounded-none p-3 sm:p-0 border border-divider sm:border-none"
            >
              {/* Bahan Baku */}
              <div className="col-span-7 w-full">
                <label className="text-xs text-foreground-500 mb-1 block sm:hidden">
                  Bahan Baku
                </label>
                <Controller
                  name={`items.${index}.bahanBakuId`}
                  control={control}
                  render={({ field: f }) => (
                    <Select
                      placeholder="Pilih Bahan Baku"
                      startContent={
                        <Box size={16} className="text-foreground-400 shrink-0" />
                      }
                      selectedKeys={f.value ? [f.value] : []}
                      onChange={(e) => f.onChange(e.target.value)}
                      onBlur={f.onBlur}
                      name={f.name}
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
                          <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                              <span className="text-sm">{b.nama}</span>
                              <span className="text-xs text-default-400">
                                Satuan: {b.unit?.nama || "—"}
                              </span>
                            </div>
                            <span className="text-xs text-default-400 ml-2 shrink-0">
                              Stok: {Number(b.stok).toLocaleString("id-ID")}{" "}
                              {b.unit?.nama}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                />
                {stokTersedia !== null && (
                  <p className="text-xs text-foreground-400 mt-1 px-1">
                    Stok tersedia:{" "}
                    <span className="font-medium text-foreground-600">
                      {stokTersedia.toLocaleString("id-ID")} {unitName}
                    </span>
                  </p>
                )}
              </div>

              {/* Jumlah */}
              <div className="col-span-4 w-full">
                <label className="text-xs text-foreground-500 mb-1 block sm:hidden">
                  Jumlah ({unitName})
                </label>
                <Input
                  type="number"
                  step="any"
                  min={0.01}
                  placeholder={`0 ${unitName.toLowerCase()}`}
                  classNames={{ inputWrapper: "h-10 min-h-10" }}
                  endContent={
                    <span className="text-xs text-foreground-400 shrink-0">
                      {unitName}
                    </span>
                  }
                  {...register(`items.${index}.jumlah` as const)}
                  isInvalid={!!error?.jumlah}
                  errorMessage={error?.jumlah?.message}
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
