"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Alert } from "@heroui/alert";
import { addToast } from "@heroui/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { fetcher } from "@/lib/func";
import useSWR from "swr";
import { z } from "zod";
import { OrderItem } from "./types";

const spkSchema = z.object({
  karyawanId: z.string().min(1, "Karyawan wajib dipilih"),
  model: z.string().optional(),
  tali: z.string().optional(),
  ukuran: z.string().optional(),
  jumlah: z.string().min(1, "Jumlah wajib diisi"),
  tanggalSetor: z.string().optional(),
  catatan: z.string().optional(),
});

type SpkFormData = z.infer<typeof spkSchema>;

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  nomorOrder: string;
  items: OrderItem[];
  onSuccess: () => void;
}

export function SpkFormModal({
  isOpen,
  onOpenChange,
  orderId,
  nomorOrder,
  items,
  onSuccess,
}: Props) {
  const [globalError, setGlobalError] = useState("");

  const { data: karyawanData } = useSWR(
    "/api/admin/karyawan?isActive=true&limit=100",
    fetcher,
  );
  const karyawanList: { id: string; nama: string; posisi: string | null }[] =
    karyawanData?.results ?? [];

  const totalQty = items.reduce((sum, i) => sum + Number(i.qty), 0);

  const form = useForm<SpkFormData>({
    resolver: zodResolver(spkSchema),
    defaultValues: {
      karyawanId: "",
      model: "",
      tali: "",
      ukuran: "",
      jumlah: String(totalQty || 1),
      tanggalSetor: "",
      catatan: "",
    },
  });

  useEffect(() => {
    if (totalQty > 0) form.setValue("jumlah", String(totalQty));
  }, [totalQty, form]);

  async function onSubmit(data: SpkFormData) {
    setGlobalError("");
    try {
      const res = await fetch(`/api/order/${orderId}/spk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, jumlah: Number(data.jumlah) }),
      });
      const json = await res.json();
      if (!res.ok) {
        setGlobalError(json.error || "Terjadi kesalahan.");
        return;
      }
      addToast({
        title: "SPK Dibuat",
        description: `Status pesanan ${nomorOrder} diperbarui ke JAHIT.`,
        color: "success",
      });
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch {
      setGlobalError("Terjadi kesalahan jaringan.");
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          form.reset();
          setGlobalError("");
        }
      }}
      placement="center"
      size="md"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <ModalHeader className="flex flex-col gap-0.5 pb-2">
              <span>Buat SPK — Tahap Jahit</span>
              <span className="text-sm font-normal text-default-500 font-mono">
                {nomorOrder}
              </span>
            </ModalHeader>

            <ModalBody className="gap-3 pt-0">
              {globalError && <Alert color="danger" title={globalError} />}

              <div className="rounded-lg bg-warning-50 border border-warning-200 px-3 py-2 text-xs text-warning-700">
                Mengisi form ini akan memindahkan status pesanan ke{" "}
                <span className="font-semibold">JAHIT</span> sekaligus membuat
                SPK untuk karyawan yang dipilih.
              </div>

              <Controller
                name="karyawanId"
                control={form.control}
                render={({ field }) => (
                  <Select
                    label="Penjahit / Karyawan"
                    placeholder="Pilih karyawan"
                    isRequired
                    selectedKeys={
                      field.value ? new Set([field.value]) : new Set()
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] as string;
                      field.onChange(val ?? "");
                    }}
                    isInvalid={!!form.formState.errors.karyawanId}
                    errorMessage={form.formState.errors.karyawanId?.message}
                    isDisabled={form.formState.isSubmitting}
                  >
                    {karyawanList.map((k) => (
                      <SelectItem key={k.id} textValue={k.nama}>
                        <div className="flex flex-col">
                          <span className="text-sm">{k.nama}</span>
                          {k.posisi && (
                            <span className="text-xs text-default-400">
                              {k.posisi}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Model"
                  placeholder="Kaos, Kemeja, ..."
                  {...form.register("model")}
                  isDisabled={form.formState.isSubmitting}
                />
                <Input
                  label="Ukuran"
                  placeholder="S/M/L/XL atau angka"
                  {...form.register("ukuran")}
                  isDisabled={form.formState.isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Tali / Aksesori"
                  placeholder="Detail tali, kancing, ..."
                  {...form.register("tali")}
                  isDisabled={form.formState.isSubmitting}
                />
                <Input
                  label="Jumlah"
                  type="number"
                  isRequired
                  {...form.register("jumlah")}
                  isDisabled={form.formState.isSubmitting}
                  isInvalid={!!form.formState.errors.jumlah}
                  errorMessage={form.formState.errors.jumlah?.message}
                />
              </div>

              <Input
                label="Tanggal Setor"
                type="date"
                placeholder="Deadline karyawan setor"
                {...form.register("tanggalSetor")}
                isDisabled={form.formState.isSubmitting}
              />

              <Textarea
                label="Catatan"
                placeholder="Instruksi tambahan untuk penjahit..."
                minRows={2}
                {...form.register("catatan")}
                isDisabled={form.formState.isSubmitting}
              />
            </ModalBody>

            <ModalFooter>
              <Button
                variant="flat"
                color="danger"
                onPress={onClose}
                isDisabled={form.formState.isSubmitting}
                size="sm"
              >
                Batal
              </Button>
              <Button
                color="primary"
                type="submit"
                isLoading={form.formState.isSubmitting}
                isDisabled={form.formState.isSubmitting}
                size="sm"
              >
                Buat SPK & Lanjut ke Jahit
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
