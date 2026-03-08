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
  useDisclosure,
} from "@heroui/modal";
import { Tabs, Tab } from "@heroui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Alert } from "@heroui/alert";
import { addToast } from "@heroui/toast";
import { z } from "zod";
import { ArrowDownToLine, Loader2 } from "lucide-react";
import { BahanBaku } from "@/types/types";
import useSWR from "swr";
import { fetcher } from "@/lib/func";

const schema = z.object({
  jumlah: z.string().min(1, "Jumlah wajib diisi"),
  supplierId: z.string().optional(),
  hargaBeli: z.string().optional(),
  nomorFaktur: z.string().optional(),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  keterangan: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function TambahStokMasukModal({
  bahanBaku,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
  onAdded,
}: {
  bahanBaku: BahanBaku;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAdded?: () => void;
}) {
  const {
    isOpen: internalIsOpen,
    onOpen,
    onOpenChange: internalOnOpenChange,
  } = useDisclosure();

  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const onOpenChange = controlledOnOpenChange ?? internalOnOpenChange;

  const [globalError, setGlobalError] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: supplierData } = useSWR(
    isOpen ? `/api/admin/supplier?limit=100&isActive=true` : null,
    fetcher,
  );

  const { data: historyData, isLoading: isLoadingHistory } = useSWR(
    isOpen ? `/api/admin/bahan-baku/${bahanBaku.id}/stok-masuk?limit=50` : null,
    fetcher,
  );

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      jumlah: "",
      supplierId: "",
      hargaBeli: "",
      nomorFaktur: "",
      tanggal: today,
      keterangan: "",
    },
  });

  function resetForm() {
    form.reset({
      jumlah: "",
      supplierId: "",
      hargaBeli: "",
      nomorFaktur: "",
      tanggal: today,
      keterangan: "",
    });
    setFile(null);
    setGlobalError("");
  }

  async function onSubmit(data: FormData) {
    setGlobalError("");
    const jumlahNum = Number(data.jumlah);
    if (!jumlahNum || jumlahNum <= 0) {
      form.setError("jumlah", { message: "Jumlah harus lebih dari 0" });
      return;
    }
    try {
      const formData = new FormData();
      formData.append("jumlah", jumlahNum.toString());
      if (data.supplierId) formData.append("supplierId", data.supplierId);
      if (data.hargaBeli) formData.append("hargaBeli", data.hargaBeli);
      if (data.nomorFaktur) formData.append("nomorFaktur", data.nomorFaktur);
      formData.append("tanggal", data.tanggal);
      if (data.keterangan) formData.append("keterangan", data.keterangan);
      if (file) formData.append("buktiNota", file);

      const res = await fetch(
        `/api/admin/bahan-baku/${bahanBaku.id}/stok-masuk`,
        {
          method: "POST",
          body: formData,
        },
      );
      const json = await res.json();
      if (!res.ok) {
        setGlobalError(json.error || "Terjadi kesalahan.");
        return;
      }
      addToast({
        title: "Berhasil",
        description: "Stok masuk berhasil dicatat.",
        color: "success",
      });
      resetForm();
      onOpenChange(false);
      onAdded?.();
    } catch {
      setGlobalError("Terjadi kesalahan jaringan.");
    }
  }

  return (
    <>
      {controlledIsOpen === undefined && (
        <Button
          color="success"
          variant="flat"
          size="sm"
          startContent={<ArrowDownToLine size={15} />}
          onPress={onOpen}
        >
          Catat Masuk
        </Button>
      )}

      <Modal
        isOpen={isOpen}
        placement="bottom-center"
        onOpenChange={(open) => {
          onOpenChange(open);
          if (!open) resetForm();
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 pb-0">
                <p>Catat Stok Masuk</p>
                <p className="text-sm font-normal text-foreground-400">
                  {bahanBaku.nama}
                </p>
              </ModalHeader>
              <Tabs
                aria-label="Stok Masuk Options"
                className="mt-2 px-6"
                variant="underlined"
              >
                <Tab key="form" title="Tambah Stok" className="px-0">
                  <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
                    <ModalBody className="pt-2">
                      {globalError && (
                        <Alert color="danger" title={globalError} />
                      )}
                      <div className="grid gap-4 mt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            type="number"
                            label="Jumlah"
                            placeholder="0"
                            min={0.01}
                            step="any"
                            isRequired
                            endContent={
                              <span className="text-foreground-400 text-sm">
                                {bahanBaku.unit?.nama}
                              </span>
                            }
                            {...form.register("jumlah")}
                            isDisabled={form.formState.isSubmitting}
                            isInvalid={!!form.formState.errors.jumlah}
                            errorMessage={form.formState.errors.jumlah?.message}
                          />
                          <Input
                            type="date"
                            label="Tanggal"
                            isRequired
                            {...form.register("tanggal")}
                            isDisabled={form.formState.isSubmitting}
                            isInvalid={!!form.formState.errors.tanggal}
                            errorMessage={
                              form.formState.errors.tanggal?.message
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            type="number"
                            label={`Harga Beli / ${bahanBaku.unit?.nama || "Satuan"}`}
                            placeholder="Opsional"
                            min={0}
                            startContent={
                              <span className="text-foreground-400 text-sm">
                                Rp
                              </span>
                            }
                            {...form.register("hargaBeli")}
                            isDisabled={form.formState.isSubmitting}
                          />
                          <Input
                            label="Nomor Faktur"
                            placeholder="Opsional"
                            {...form.register("nomorFaktur")}
                            isDisabled={form.formState.isSubmitting}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Supplier (Opsional)
                          </label>
                          <select
                            className="w-full rounded-xl border border-divider bg-default-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            {...form.register("supplierId")}
                            disabled={form.formState.isSubmitting}
                          >
                            <option value="">— Tanpa Supplier —</option>
                            {(supplierData?.results ?? []).map(
                              (s: { id: string; nama: string }) => (
                                <option key={s.id} value={s.id}>
                                  {s.nama}
                                </option>
                              ),
                            )}
                          </select>
                        </div>
                        <Textarea
                          label="Keterangan"
                          placeholder="Keterangan tambahan (opsional)"
                          {...form.register("keterangan")}
                          isDisabled={form.formState.isSubmitting}
                        />
                        <div>
                          <label className="text-sm font-medium mb-1 block">
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
                            className="w-full text-sm text-foreground-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                            disabled={form.formState.isSubmitting}
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
                </Tab>
                <Tab key="history" title="Riwayat" className="px-0">
                  <ModalBody className="pt-2 pb-6 max-h-[60vh] overflow-y-auto">
                    {isLoadingHistory ? (
                      <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin text-primary" />
                      </div>
                    ) : historyData?.results?.length === 0 ? (
                      <p className="text-center text-sm text-foreground-500 py-8">
                        Belum ada riwayat stok masuk.
                      </p>
                    ) : (
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-foreground-500 uppercase bg-default-100">
                            <tr>
                              <th className="px-4 py-2 font-medium whitespace-nowrap">
                                Tanggal
                              </th>
                              <th className="px-4 py-2 font-medium whitespace-nowrap">
                                Jumlah
                              </th>
                              <th className="px-4 py-2 font-medium whitespace-nowrap">
                                Oleh
                              </th>
                              <th className="px-4 py-2 font-medium whitespace-nowrap">
                                Supplier
                              </th>
                              <th className="px-4 py-2 font-medium whitespace-nowrap text-right">
                                Nota
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {historyData?.results?.map(
                              (item: {
                                id: string;
                                tanggal: string;
                                jumlah: number;
                                addedBy: { name: string } | null;
                                supplier: { nama: string } | null;
                                buktiNota: string | null;
                              }) => (
                                <tr
                                  key={item.id}
                                  className="border-b border-divider hover:bg-default-50 transition-colors"
                                >
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    {new Intl.DateTimeFormat("id-ID", {
                                      dateStyle: "medium",
                                    }).format(new Date(item.tanggal))}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap font-medium text-success">
                                    +{item.jumlah} {bahanBaku.unit?.nama}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    {item.addedBy?.name || "-"}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap truncate max-w-[120px]">
                                    {item.supplier?.nama || "-"}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-right">
                                    {item.buktiNota ? (
                                      <a
                                        href={item.buktiNota}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary hover:underline text-xs font-medium"
                                      >
                                        Lihat
                                      </a>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </ModalBody>
                </Tab>
              </Tabs>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
