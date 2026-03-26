/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
import { PageHeader } from "@/components/page-header";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { pengeluaranSchema, type PengeluaranFormData } from "./schema";
import { PengeluaranInfoCard } from "./components/pengeluaran-info-card";
import { BahanBakuKeluarList } from "./components/bahan-baku-keluar-list";

interface SPKOption {
  id: string;
  order: { nomorOrder: string; customer: { nama: string } };
}

export default function CreatePengeluaranPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: bahanBakuData } = useSWR(
    "/api/admin/bahan-baku?all=true&isActive=true",
    fetcher,
  );
  const { data: spkListData } = useSWR(
    "/api/production/spk?all=true",
    fetcher,
  );

  const spkList: SPKOption[] = spkListData?.results ?? [];

  const form = useForm<PengeluaranFormData>({
    resolver: zodResolver(pengeluaranSchema),
    defaultValues: {
      spkId: "",
      tanggal: new Date().toISOString().split("T")[0],
      keterangan: "",
      items: [{ bahanBakuId: "", jumlah: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  const watchItems = form.watch("items");

  const handleAdd = () => append({ bahanBakuId: "", jumlah: "" });
  const handleRemove = (index: number) => remove(index);

  async function onSubmit(data: PengeluaranFormData) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/inventory/out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spkId: data.spkId || undefined,
          tanggal: data.tanggal,
          keterangan: data.keterangan || undefined,
          items: data.items.map((it) => ({
            bahanBakuId: it.bahanBakuId,
            jumlah: parseFloat(it.jumlah),
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Terjadi kesalahan.");

      addToast({
        title: "Berhasil",
        description: "Pengeluaran barang berhasil dicatat.",
        color: "success",
      });
      router.push("/inventory/out");
      router.refresh();
    } catch (err: any) {
      addToast({
        title: "Gagal menyimpan",
        description: err.message,
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-6 mb-6">
      <div className="flex items-center gap-3">
        <Button isIconOnly variant="flat" as={Link} href="/inventory/out">
          <ArrowLeft size={18} />
        </Button>
        <PageHeader
          title="Catat Pengeluaran Barang"
          description="Input bahan baku yang keluar untuk proses produksi SPK"
        />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Info Card */}
          <div className="xl:col-span-1">
            <PengeluaranInfoCard
              control={form.control}
              errors={form.formState.errors}
              spkList={spkList}
            />
          </div>

          {/* Right: Bahan Baku List */}
          <div className="xl:col-span-2 flex flex-col gap-4">
            <BahanBakuKeluarList
              control={form.control}
              fields={fields as any}
              register={form.register}
              errors={form.formState.errors}
              bahanBakuData={bahanBakuData}
              watchItems={watchItems}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="flat"
                as={Link}
                href="/inventory/out"
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
                Simpan Pengeluaran
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
