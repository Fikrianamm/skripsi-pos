"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
import { PageHeader } from "@/components/page-header";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  supplierId: z.string().optional(),
  nomorFaktur: z.string().optional(),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  keterangan: z.string().optional(),
  items: z
    .array(
      z.object({
        bahanBakuId: z.string().min(1, "Bahan baku wajib dipilih"),
        jumlah: z.string().min(1, "Jumlah wajib diisi"),
        hargaSatuan: z.string().optional(),
      }),
    )
    .min(1, "Minimal 1 bahan baku harus ditambahkan"),
});

type FormData = z.infer<typeof schema>;

export default function CatatPenerimaanPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const { data: supplierData } = useSWR(
    "/api/admin/supplier?limit=200&isActive=true",
    fetcher,
  );
  const { data: bahanBakuData } = useSWR(
    "/api/admin/bahan-baku?limit=500&isActive=true",
    fetcher,
  );

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tanggal: today,
      supplierId: "",
      nomorFaktur: "",
      keterangan: "",
      items: [{ bahanBakuId: "", jumlah: "", hargaSatuan: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Calculate live total tagihan
  const watchItems = form.watch("items");
  const liveTotal = watchItems.reduce((acc, curr) => {
    const q = Number(curr.jumlah) || 0;
    const p = Number(curr.hargaSatuan) || 0;
    return acc + q * p;
  }, 0);

  async function onSubmit(data: FormData) {
    // Validate if any item lacks valid jumlah
    for (const item of data.items) {
      if (Number(item.jumlah) <= 0) {
        addToast({
          title: "Gagal",
          description: "Kuantitas barang harus lebih dari 0",
          color: "danger",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (data.supplierId) formData.append("supplierId", data.supplierId);
      if (data.nomorFaktur) formData.append("nomorFaktur", data.nomorFaktur);
      formData.append("tanggal", data.tanggal);
      if (data.keterangan) formData.append("keterangan", data.keterangan);
      if (file) formData.append("buktiNota", file);
      formData.append("items", JSON.stringify(data.items));

      const res = await fetch("/api/admin/inventory/in", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Terjadi kesalahan.");

      addToast({
        title: "Berhasil",
        description: "Penerimaan barang berhasil dicatat.",
        color: "success",
      });
      router.push("/inventory/in");
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
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          variant="light"
          as={Link}
          href="/inventory/in"
          className="text-foreground-500"
        >
          <ArrowLeft size={20} />
        </Button>
        <PageHeader
          title="Catat Penerimaan Barang"
          description="Masukkan informasi faktur dan daftar bahan baku yang diterima"
        />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* HEADER SECTION */}
        <div className="bg-default-50 p-6 rounded-2xl border border-divider grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-primary uppercase tracking-wider mb-2">
              Informasi Faktur (Header)
            </h3>
            <Input
              type="date"
              label="Tanggal Terima"
              isRequired
              {...form.register("tanggal")}
              isInvalid={!!form.formState.errors.tanggal}
              errorMessage={form.formState.errors.tanggal?.message}
            />
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground-700">
                Supplier (Opsional)
              </label>
              <select
                className="w-full rounded-xl border border-divider bg-content1 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary h-12"
                {...form.register("supplierId")}
              >
                <option value="">— Tanpa Supplier —</option>
                {(supplierData?.results ?? []).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.nama}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Nomor Faktur / Surat Jalan"
              placeholder="Opsional"
              {...form.register("nomorFaktur")}
            />
          </div>

          <div className="space-y-4 md:mt-8">
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground-700">
                Bukti Nota (Opsional)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                  } else {
                    setFile(null);
                  }
                }}
                className="w-full text-sm text-foreground-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 h-12 flex items-center bg-content1 rounded-xl border border-divider"
              />
            </div>
            <Textarea
              label="Keterangan"
              placeholder="Catatan tambahan..."
              minRows={2}
              {...form.register("keterangan")}
            />
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div className="bg-default-50 p-6 rounded-2xl border border-divider space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-primary uppercase tracking-wider">
              Daftar Barang (Item Details)
            </h3>
            <div className="text-sm font-medium bg-background px-4 py-2 rounded-xl border border-divider shadow-sm text-foreground">
              Total Estimasi:{" "}
              <span className="text-primary text-base font-bold ml-1">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(liveTotal)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => {
              const bId = watchItems[index].bahanBakuId;
              const selectedBahan = (bahanBakuData?.results ?? []).find(
                (b: any) => b.id === bId,
              );
              const unitName = selectedBahan?.unit?.nama || "Satuan";
              const error = form.formState.errors.items?.[index];

              return (
                <div
                  key={field.id}
                  className="flex flex-col sm:flex-row gap-3 items-start bg-background p-4 rounded-xl border border-divider relative group"
                >
                  <div className="w-full sm:w-[40%]">
                    <label className="text-xs font-medium mb-1.5 block text-foreground-600">
                      Bahan Baku
                    </label>
                    <select
                      className={`w-full rounded-xl border ${error?.bahanBakuId ? "border-danger focus:ring-danger" : "border-divider focus:ring-primary"} bg-content1 px-3 py-2 text-sm focus:outline-none focus:ring-2  h-10`}
                      {...form.register(`items.${index}.bahanBakuId` as const)}
                    >
                      <option value="">— Pilih Bahan —</option>
                      {(bahanBakuData?.results ?? []).map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.nama} ({b.unit?.nama})
                        </option>
                      ))}
                    </select>
                    {error?.bahanBakuId && (
                      <p className="text-danger text-xs mt-1">
                        {error.bahanBakuId.message}
                      </p>
                    )}
                  </div>

                  <div className="w-full sm:w-[25%]">
                    <label className="text-xs font-medium mb-1.5 block text-foreground-600">
                      Qyt ({unitName.toLowerCase()})
                    </label>
                    <Input
                      type="number"
                      step="any"
                      min={0.01}
                      placeholder="0"
                      classNames={{ inputWrapper: "h-10 min-h-10" }}
                      {...form.register(`items.${index}.jumlah` as const)}
                      isInvalid={!!error?.jumlah}
                      errorMessage={error?.jumlah?.message}
                    />
                  </div>

                  <div className="w-full sm:w-[35%]">
                    <label className="text-xs font-medium mb-1.5 block text-foreground-600">
                      Harga per {unitName}
                    </label>
                    <div className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="Opsional (Rp)"
                          classNames={{ inputWrapper: "h-10 min-h-10" }}
                          startContent={
                            <span className="text-foreground-400 text-sm">
                              Rp
                            </span>
                          }
                          {...form.register(
                            `items.${index}.hargaSatuan` as const,
                          )}
                        />
                      </div>
                      <Button
                        isIconOnly
                        color="danger"
                        variant="light"
                        className="h-10 w-10 min-w-10 opacity-60 hover:opacity-100"
                        onPress={() => remove(index)}
                        isDisabled={fields.length === 1}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            size="sm"
            color="primary"
            variant="flat"
            startContent={<Plus size={16} />}
            onPress={() =>
              append({ bahanBakuId: "", jumlah: "", hargaSatuan: "" })
            }
            className="mt-2"
          >
            Tambah Bahan Lain
          </Button>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="flat" as={Link} href="/inventory/in">
            Batal
          </Button>
          <Button
            color="primary"
            type="submit"
            isLoading={isSubmitting}
            startContent={!isSubmitting && <Save size={18} />}
          >
            Simpan Penerimaan
          </Button>
        </div>
      </form>
    </div>
  );
}
