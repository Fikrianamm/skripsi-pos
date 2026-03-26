/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
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
import { opnameSchema, type OpnameFormData } from "./schema";
import { OpnameInfoCard } from "./components/opname-info-card";
import { BahanBakuOpnameList } from "./components/bahan-baku-opname-list";

interface BahanBakuRow {
  id: string;
  nama: string;
  stok: number;
  unit?: { nama: string };
}

export default function CreateOpnamePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: bahanBakuData } = useSWR(
    "/api/admin/bahan-baku?all=true&isActive=true",
    fetcher,
  );

  const bahanBakuRows: BahanBakuRow[] = (bahanBakuData?.results ?? []).map(
    (b: any) => ({
      id: b.id,
      nama: b.nama,
      stok: Number(b.stok),
      unit: b.unit,
    }),
  );

  const form = useForm<OpnameFormData>({
    resolver: zodResolver(opnameSchema),
    defaultValues: {
      tanggal: new Date().toISOString().split("T")[0],
      keterangan: "",
      items: [],
    },
  });

  // Pre-populate ALL bahan baku rows when data loads
  useEffect(() => {
    if (bahanBakuRows.length === 0) return;
    form.reset({
      tanggal: form.getValues("tanggal"),
      keterangan: form.getValues("keterangan"),
      items: bahanBakuRows.map((bb) => ({
        bahanBakuId: bb.id,
        stokFisik: String(bb.stok), // Default = current system stock (no change)
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bahanBakuData]);

  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  });
  const watchItems = form.watch("items");

  async function onSubmit(data: OpnameFormData) {
    // Only submit items where stok fisik differs from stok sistem
    // (or submit all — API handles the correction either way)
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/inventory/opname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal: data.tanggal,
          keterangan: data.keterangan || undefined,
          items: data.items.map((it) => ({
            bahanBakuId: it.bahanBakuId,
            stokFisik: parseFloat(it.stokFisik),
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Terjadi kesalahan.");

      addToast({
        title: "Berhasil",
        description: "Stok opname berhasil dicatat dan stok dikoreksi.",
        color: "success",
      });
      router.push("/inventory/opname");
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

  const isLoading = bahanBakuRows.length === 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-6 mb-6">
      <div className="flex items-center gap-3">
        <Button isIconOnly variant="flat" as={Link} href="/inventory/opname">
          <ArrowLeft size={18} />
        </Button>
        <PageHeader
          title="Stok Opname Baru"
          description="Koreksi stok bahan baku berdasarkan hitungan fisik di lapangan"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-default-400 text-sm">
          Memuat daftar bahan baku...
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left: Info */}
            <div className="xl:col-span-1">
              <OpnameInfoCard
                control={form.control}
                errors={form.formState.errors}
              />
            </div>

            {/* Right: Pre-populated bahan baku table */}
            <div className="xl:col-span-2 flex flex-col gap-4">
              <BahanBakuOpnameList
                fields={fields}
                register={form.register}
                errors={form.formState.errors}
                bahanBakuRows={bahanBakuRows}
                watchItems={watchItems}
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="flat"
                  as={Link}
                  href="/inventory/opname"
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
                  Simpan Opname
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
