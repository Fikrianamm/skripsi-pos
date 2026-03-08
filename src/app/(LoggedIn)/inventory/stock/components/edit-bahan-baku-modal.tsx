"use client";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, Controller } from "react-hook-form";
import { useState, useEffect } from "react";
import { Alert } from "@heroui/alert";
import { addToast } from "@heroui/toast";
import { z } from "zod";
import { Switch } from "@heroui/switch";
import { BahanBaku, Unit } from "@/types/types";
import { Select, SelectItem } from "@heroui/react";
import useSWR from "swr";
import { fetcher } from "@/lib/func";

const schema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  unitId: z.string().min(1, "Satuan wajib diisi"),
  minStok: z.string().optional(),
  keterangan: z.string().optional(),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function EditBahanBakuModal({
  bahanBaku,
  isOpen,
  onOpenChange,
  onEdited,
}: {
  bahanBaku: BahanBaku;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onEdited?: () => void;
}) {
  const [globalError, setGlobalError] = useState("");

  const { data: unitData } = useSWR(`/api/unit?limit=100`, fetcher);
  const units = unitData?.results ?? [];

  const toMinStokStr = (v: number | null | undefined) =>
    v !== null && v !== undefined ? String(v) : "";

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      nama: bahanBaku.nama,
      unitId: bahanBaku.unitId,
      minStok: toMinStokStr(bahanBaku.minStok),
      keterangan: bahanBaku.keterangan ?? "",
      isActive: bahanBaku.isActive,
    },
  });

  useEffect(() => {
    form.reset({
      nama: bahanBaku.nama,
      unitId: bahanBaku.unitId,
      minStok: toMinStokStr(bahanBaku.minStok),
      keterangan: bahanBaku.keterangan ?? "",
      isActive: bahanBaku.isActive,
    });
  }, [bahanBaku, form]);

  const isActiveValue = useWatch({ control: form.control, name: "isActive" });

  async function onSubmit(data: FormData) {
    setGlobalError("");
    try {
      const res = await fetch(`/api/admin/bahan-baku/${bahanBaku.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: data.nama,
          unitId: data.unitId,
          minStok: data.minStok ? Number(data.minStok) : null,
          keterangan: data.keterangan || null,
          isActive: data.isActive,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setGlobalError(json.error || "Terjadi kesalahan.");
        return;
      }
      addToast({
        title: "Berhasil",
        description: "Bahan baku berhasil diperbarui.",
        color: "success",
      });
      onOpenChange?.(false);
      onEdited?.();
    } catch {
      setGlobalError("Terjadi kesalahan jaringan.");
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      placement="bottom-center"
      onOpenChange={onOpenChange}
      backdrop="blur"
    >
      <ModalContent>
        {(onClose) => (
          <form
            noValidate
            onSubmit={form.handleSubmit(
              onSubmit as Parameters<typeof form.handleSubmit>[0],
            )}
          >
            <ModalHeader>Edit Bahan Baku</ModalHeader>
            <ModalBody>
              {globalError && <Alert color="danger" title={globalError} />}
              <div className="grid gap-4 mt-2">
                <Input
                  label="Nama Bahan Baku"
                  isRequired
                  {...form.register("nama")}
                  isDisabled={form.formState.isSubmitting}
                  isInvalid={!!form.formState.errors.nama}
                  errorMessage={form.formState.errors.nama?.message}
                />
                <Controller
                  name="unitId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      label="Satuan"
                      placeholder="Pilih satuan"
                      isRequired
                      selectedKeys={field.value ? [field.value] : []}
                      onSelectionChange={(keys) =>
                        field.onChange(Array.from(keys)[0] as string)
                      }
                      isDisabled={form.formState.isSubmitting}
                      isInvalid={!!form.formState.errors.unitId}
                      errorMessage={form.formState.errors.unitId?.message}
                    >
                      {units.map((u: Unit) => (
                        <SelectItem key={u.id!}>{u.nama}</SelectItem>
                      ))}
                    </Select>
                  )}
                />
                <Input
                  type="number"
                  label="Minimum Stok"
                  placeholder="Opsional"
                  min={0}
                  description="Indikator stok menipis"
                  {...form.register("minStok")}
                  isDisabled={form.formState.isSubmitting}
                />
                <Textarea
                  label="Keterangan"
                  placeholder="Keterangan tambahan (opsional)"
                  {...form.register("keterangan")}
                  isDisabled={form.formState.isSubmitting}
                />
                <div className="flex items-center justify-between rounded-lg border border-divider p-3">
                  <div>
                    <p className="text-sm font-medium">Status Aktif</p>
                    <p className="text-xs text-foreground-400">
                      Bahan baku tidak aktif tidak akan muncul di pilihan
                    </p>
                  </div>
                  <Switch
                    isSelected={isActiveValue}
                    onValueChange={(v) => form.setValue("isActive", v)}
                    isDisabled={form.formState.isSubmitting}
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="flat" onPress={onClose}>
                Batal
              </Button>
              <Button
                color="primary"
                type="submit"
                isDisabled={form.formState.isSubmitting}
                isLoading={form.formState.isSubmitting}
              >
                Simpan
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
