"use client";

import { useEffect, useState, useMemo } from "react";
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
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";

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
  order: {
    items: {
      nama: string;
      qty: number;
      statusHarga?: string;
      product?: { sku: string; isService?: boolean } | null;
      kebutuhanBahanCustom?: {
        id: string;
        bahanBakuId: string;
        jumlahDibutuhkan: string | number;
        satuan: string;
        bahanBaku?: { nama: string; stok: string | number };
      }[];
    }[];
  };
  onSuccess: () => void;
}

export function SpkFormModal({
  isOpen,
  onOpenChange,
  orderId,
  nomorOrder,
  order,
  onSuccess,
}: Props) {
  const unagreedCustomItems = useMemo(() => {
    return (order?.items || []).filter(
      (item) =>
        (item.product?.isService || (item.statusHarga && item.statusHarga !== "NA")) &&
        item.statusHarga !== "DISEPAKATI",
    );
  }, [order.items]);

  const hasUnagreedItems = unagreedCustomItems.length > 0;

  const customMaterialsSummary = useMemo(() => {
    const list: { nama: string; jumlah: number; satuan: string }[] = [];
    (order?.items || []).forEach((item) => {
      if (item.kebutuhanBahanCustom && item.kebutuhanBahanCustom.length > 0) {
        item.kebutuhanBahanCustom.forEach((kbc) => {
          list.push({
            nama: kbc.bahanBaku?.nama || "Bahan Baku",
            jumlah: Number(kbc.jumlahDibutuhkan),
            satuan: kbc.satuan,
          });
        });
      }
    });
    return list;
  }, [order.items]);

  const suggestedModel = useMemo(() => {
    return (order?.items || [])
      .map((item) => `${item.product?.sku || item.nama} x${item.qty}`)
      .join(", ");
  }, [order.items]);
  
  const [globalError, setGlobalError] = useState("");
  const totalQty = order.items.reduce((sum, i) => sum + Number(i.qty), 0);
  const [displayJumlah, setDisplayJumlah] = useState<number>(totalQty || 1);

  const { data: karyawanData } = useSWR(
    "/api/admin/karyawan?isActive=true&limit=100",
    fetcher,
  );
  const karyawanList: { id: string; nama: string; posisi: string | null }[] =
    karyawanData?.results ?? [];

  const form = useForm<SpkFormData>({
    resolver: zodResolver(spkSchema),
    values: {
      karyawanId: "",
      model: suggestedModel || "",
      tali: "",
      ukuran: "",
      jumlah: String(totalQty || 1),
      tanggalSetor: "",
      catatan: "",
    },
  });

  useEffect(() => {
  // Hanya set value ketika modal sedang dalam keadaan terbuka
  if (isOpen) {
    if (suggestedModel) {
      form.setValue("model", suggestedModel);
    }
    if (totalQty > 0) {
      form.setValue("jumlah", String(totalQty));
    }
  }
}, [isOpen, suggestedModel, totalQty, form]);

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
        description: `Status pesanan ${nomorOrder} diperbarui ke PRODUKSI.`,
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
      size="xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <form className="contents" noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <ModalHeader className="flex flex-col gap-0.5 pb-2">
              <span>Buat SPK — Tahap Produksi</span>
              <span className="text-sm font-normal text-default-500 font-mono">
                {nomorOrder}
              </span>
            </ModalHeader>

            <ModalBody className="gap-3 pt-0">
              {globalError && <Alert color="danger" title={globalError} />}

              {hasUnagreedItems && (
                <div className="rounded-lg bg-danger-50 border border-danger-200 p-3 text-xs text-danger-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <span>⚠️ Pembuatan SPK Ditangguhkan</span>
                  </div>
                  <p>
                    Terdapat item custom yang belum disepakati harganya:{" "}
                    <strong>
                      {unagreedCustomItems.map((i) => i.nama).join(", ")}
                    </strong>
                    . Kasir harus menyepakati harga jual terlebih dahulu sebelum SPK dapat dibuat.
                  </p>
                </div>
              )}

              {customMaterialsSummary.length > 0 && (
                <div className="rounded-lg bg-secondary-50/70 border border-secondary-200 p-3 text-xs text-secondary-900 space-y-1.5">
                  <div className="font-semibold flex items-center justify-between">
                    <span>📦 Bahan Baku Custom (Terkunci Desainer)</span>
                    <span className="text-[11px] text-secondary-600 font-normal">
                      {customMaterialsSummary.length} bahan
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {customMaterialsSummary.map((m, idx) => (
                      <span
                        key={idx}
                        className="bg-white/80 border border-secondary-200 px-2 py-0.5 rounded text-[11px] font-medium"
                      >
                        {m.nama}: {m.jumlah} {m.satuan}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-warning-50 border border-warning-200 px-3 py-2 text-xs text-warning-700">
                <span className="block mb-1">
                  Mengisi form ini akan memindahkan status pesanan ke{" "}
                  <span className="font-semibold">PRODUKSI</span> sekaligus membuat
                  SPK untuk pekerja yang dipilih.
                </span>
                <span className="block">
                  Sistem juga akan <strong>otomatis memotong stok bahan baku</strong> berdasarkan Resep BOM produk dan bahan custom yang terkunci.
                </span>
              </div>

              <Controller
                name="karyawanId"
                control={form.control}
                render={({ field }) => (
                  <Select
                    label="Pekerja Produksi"
                    placeholder="Pilih pekerja"
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
                  label="Tali / Aksesoris"
                  placeholder="Detail tali, kancing, ..."
                  {...form.register("tali")}
                  isDisabled={form.formState.isSubmitting}
                />
                <FormattedNumberInput
                  label="Jumlah"
                  isRequired
                  value={displayJumlah}
                  onChange={(v) => {
                    const n = Number(v);
                    setDisplayJumlah(n);
                    form.setValue("jumlah", String(n), { shouldValidate: true });
                  }}
                  isInvalid={!!form.formState.errors.jumlah}
                  errorMessage={form.formState.errors.jumlah?.message}
                  isDisabled={form.formState.isSubmitting}
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
                placeholder="Instruksi tambahan untuk produksi..."
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
                isDisabled={form.formState.isSubmitting || hasUnagreedItems}
                size="sm"
              >
                Buat SPK & Lanjut ke Produksi
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
