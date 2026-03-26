/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";
import { fetcher, parseRibuan } from "@/lib/func";
import { PageHeader } from "@/components/page-header";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { penerimaanSchema, type PenerimaanFormData } from "../../create/schema";
import { FakturInfoCard } from "../../create/components/faktur-info-card";
import { BahanBakuList } from "../../create/components/bahan-baku-list";
import type { PenerimaanDetail } from "@/types/types";

export default function EditPenerimaanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayHarga, setDisplayHarga] = useState<string[]>([]);

  const { data: supplierData } = useSWR(
    "/api/admin/supplier?all=true&isActive=true",
    fetcher,
  );
  const { data: bahanBakuData } = useSWR(
    "/api/admin/bahan-baku?all=true&isActive=true",
    fetcher,
  );
  const { data: existing } = useSWR<PenerimaanDetail>(
    `/api/admin/inventory/in/${id}`,
    fetcher,
  );

  const form = useForm<PenerimaanFormData>({
    resolver: zodResolver(penerimaanSchema),
    defaultValues: {
      tanggal: new Date().toISOString().split("T")[0],
      supplierId: "",
      nomorFaktur: "",
      keterangan: "",
      items: [{ bahanBakuId: "", jumlah: "", hargaBeli: "" }],
    },
  });

  // Pre-fill form when data loads
  useEffect(() => {
    if (!existing) return;
    form.reset({
      tanggal: existing.tanggal.split("T")[0],
      supplierId: (existing.supplier as any)?.id ?? "",
      nomorFaktur: existing.nomorFaktur ?? "",
      keterangan: existing.keterangan ?? "",
      items: existing.items.map((item: any) => ({
        bahanBakuId: item.bahanBaku.id ?? "",
        jumlah: String(item.jumlah),
        hargaBeli: String(item.hargaBeli),
      })),
    });
    setDisplayHarga(
      existing.items.map((item) =>
        item.hargaBeli > 0
          ? Number(item.hargaBeli).toLocaleString("id-ID")
          : "",
      ),
    );
  }, [existing, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  const watchItems = form.watch("items");

  const liveTotal = watchItems.reduce(
    (acc: number, curr: any) =>
      acc + (Number(curr.jumlah) || 0) * parseRibuan(curr.hargaBeli || ""),
    0,
  );

  const handleHargaChange = useCallback(
    (index: number, raw: string) => {
      const digits = raw.replace(/\D/g, "");
      const formatted = digits ? Number(digits).toLocaleString("id-ID") : "";
      setDisplayHarga((prev) => {
        const next = [...prev];
        next[index] = formatted;
        return next;
      });
      form.setValue(`items.${index}.hargaBeli`, digits, {
        shouldValidate: false,
      });
    },
    [form],
  );

  const handleAdd = () => {
    append({ bahanBakuId: "", jumlah: "", hargaBeli: "" });
    setDisplayHarga((p) => [...p, ""]);
  };
  const handleRemove = (index: number) => {
    remove(index);
    setDisplayHarga((p) => p.filter((_, i) => i !== index));
  };

  async function onSubmit(data: PenerimaanFormData) {
    setIsSubmitting(true);
    try {
      const cleanItems = data.items.map((item: any) => ({
        bahanBakuId: item.bahanBakuId,
        jumlah: item.jumlah,
        hargaBeli: item.hargaBeli
          ? String(parseRibuan(item.hargaBeli))
          : undefined,
      }));
      const formData = new FormData();
      if (data.supplierId) formData.append("supplierId", data.supplierId);
      if (data.nomorFaktur) formData.append("nomorFaktur", data.nomorFaktur);
      formData.append("tanggal", data.tanggal);
      if (data.keterangan) formData.append("keterangan", data.keterangan);
      if (file) formData.append("buktiNota", file);
      formData.append("items", JSON.stringify(cleanItems));

      const res = await fetch(`/api/admin/inventory/in/${id}`, {
        method: "PATCH",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Terjadi kesalahan.");

      addToast({
        title: "Berhasil",
        description: "Penerimaan berhasil diperbarui.",
        color: "success",
      });
      router.push("/inventory/in");
      router.refresh();
    } catch (err: any) {
      addToast({
        title: "Gagal memperbarui",
        description: err.message,
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isReady = !!existing;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-6 mb-6">
      <div className="flex items-center gap-3">
        <Button isIconOnly variant="flat" as={Link} href="/inventory/in">
          <ArrowLeft size={18} />
        </Button>
        <PageHeader
          title="Edit Penerimaan Barang"
          description={`Memperbarui data penerimaan · ${existing?.nomorFaktur || id}`}
        />
      </div>

      {!isReady ? (
        <div className="flex items-center justify-center py-24 text-default-400">
          Memuat data...
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1">
              <FakturInfoCard
                control={form.control}
                errors={form.formState.errors}
                supplierData={supplierData}
                file={file}
                onFileChange={setFile}
              />
            </div>
            <div className="xl:col-span-2 flex flex-col gap-4">
              <BahanBakuList
                control={form.control}
                fields={fields as any}
                register={form.register}
                errors={form.formState.errors}
                bahanBakuData={bahanBakuData}
                watchItems={watchItems}
                displayHarga={displayHarga}
                liveTotal={liveTotal}
                onHargaChange={handleHargaChange}
                onAdd={handleAdd}
                onRemove={handleRemove}
              />
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="flat"
                  as={Link}
                  href="/inventory/in"
                  className="rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isSubmitting}
                  startContent={!isSubmitting && <Save size={17} />}
                  className="rounded-xl px-6"
                >
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
