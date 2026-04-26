"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Button,
  Chip,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  useDisclosure,
} from "@heroui/react";
import { Input, Textarea } from "@heroui/input";
import { Alert } from "@heroui/alert";
import { addToast } from "@heroui/toast";
import { ArrowRightLeft, ClipboardList, Wallet } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { fetcher } from "@/lib/func";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import {
  STATUS_PRODUKSI_STEPS,
  StatusProduksiKey,
} from "../../components/types";
import {
  getStatusProduksiBadge,
  getStatusBayarBadge,
} from "../../components/order-badges";
import Link from "next/link";

// ── SPK inline form schema ────────────────────────────────────────────────────
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

interface UpdateStatusModalProps {
  orderId: string;
  nomorOrder: string;
  currentStatus: string;
  currentStatusBayar: string;
  hasSPK: boolean;
  items: { nama: string; qty: number }[];
  onUpdated: () => void;
}

export function UpdateStatusModal({
  orderId,
  nomorOrder,
  currentStatus,
  currentStatusBayar,
  hasSPK,
  items,
  onUpdated,
}: UpdateStatusModalProps) {
  // ── Status modal state ──────────────────────────────────────────────────────
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [selectedProduksi, setSelectedProduksi] = useState<StatusProduksiKey>(
    currentStatus as StatusProduksiKey,
  );
  const [isLoading, setIsLoading] = useState(false);

  // ── SPK sub-step state ──────────────────────────────────────────────────────
  const [step, setStep] = useState<"status" | "spk">("status");
  const [spkGlobalError, setSpkGlobalError] = useState("");
  const totalQty = items.reduce((sum, i) => sum + Number(i.qty), 0);
  const [displayJumlah, setDisplayJumlah] = useState<number>(totalQty || 1);

  const { data: karyawanData } = useSWR(
    step === "spk" ? "/api/admin/karyawan?isActive=true&limit=100" : null,
    fetcher,
  );
  const karyawanList: { id: string; nama: string; posisi: string | null }[] =
    karyawanData?.results ?? [];

  const spkForm = useForm<SpkFormData>({
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

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function handleOpen() {
    setSelectedProduksi(currentStatus as StatusProduksiKey);
    setStep("status");
    setSpkGlobalError("");
    spkForm.reset({
      karyawanId: "",
      model: "",
      tali: "",
      ukuran: "",
      jumlah: String(totalQty || 1),
      tanggalSetor: "",
      catatan: "",
    });
    setDisplayJumlah(totalQty || 1);
    onOpen();
  }

  const produksiChanged = selectedProduksi !== currentStatus;
  const hasChanges = produksiChanged;

  // ── Step 1: Save status directly (for non-PRODUKSI or when SPK exists) ──────
  async function handleSaveStatus() {
    if (!hasChanges) { onClose(); return; }

    // Going to PRODUKSI and NO SPK yet → show inline SPK form
    if (produksiChanged && selectedProduksi === "PRODUKSI" && !hasSPK) {
      setStep("spk");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/order/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusProduksi: selectedProduksi }),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast({ title: "Gagal", description: json.error, color: "danger" });
        return;
      }
      addToast({ title: "Status diperbarui", description: nomorOrder, color: "success" });
      onUpdated();
      onClose();
    } catch {
      addToast({ title: "Error", description: "Terjadi kesalahan jaringan.", color: "danger" });
    } finally {
      setIsLoading(false);
    }
  }

  // ── Step 2: Submit SPK → auto-sets status to PRODUKSI ───────────────────────
  async function handleSubmitSPK(data: SpkFormData) {
    setSpkGlobalError("");
    try {
      const res = await fetch(`/api/order/${orderId}/spk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, jumlah: Number(data.jumlah) }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSpkGlobalError(json.error || "Terjadi kesalahan.");
        return;
      }
      addToast({
        title: "SPK dibuat & status berubah ke Produksi 🎉",
        description: nomorOrder,
        color: "success",
      });
      onUpdated();
      onClose();
    } catch {
      setSpkGlobalError("Terjadi kesalahan jaringan.");
    }
  }

  const curProduksiBadge = getStatusProduksiBadge(currentStatus);
  const newProduksiBadge = getStatusProduksiBadge(selectedProduksi);
  const curBayarBadge = getStatusBayarBadge(currentStatusBayar);

  // Status yang memerlukan SPK sebelum bisa dipilih (kecuali BATAL selalu boleh)
  const REQUIRES_SPK: StatusProduksiKey[] = ["PACKING", "SELESAI"];
  function isStatusDisabled(key: StatusProduksiKey): boolean {
    if (!hasSPK && REQUIRES_SPK.includes(key)) return true;
    if (currentStatusBayar === "BELUM_BAYAR") return true;
    return false;
  }

  return (
    <>
      <Button
        size="sm"
        variant="flat"
        color="default"
        startContent={<ArrowRightLeft size={13} />}
        onPress={(e) => { e.continuePropagation?.(); handleOpen(); }}
        className="shrink-0"
      >
        Status
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" size="sm" scrollBehavior="inside">
        <ModalContent>
          {() => (
            <>
              {/* ── STEP 1: Pilih Status ── */}
              {step === "status" && (
                <>
                  <ModalHeader className="flex flex-col gap-0.5 pb-2">
                    <span>Update Status</span>
                    <span className="text-sm font-normal text-default-500 font-mono">{nomorOrder}</span>
                  </ModalHeader>

                  <ModalBody className="gap-4 pt-0">
                    {/* Produksi */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-default-500 uppercase tracking-wide">
                        Status Produksi
                      </span>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-default-50">
                        <Chip size="sm" color={curProduksiBadge.color} variant="flat">
                          {curProduksiBadge.label}
                        </Chip>
                        <ArrowRightLeft size={13} className="text-default-300 shrink-0" />
                        <Chip size="sm" color={newProduksiBadge.color} variant={produksiChanged ? "solid" : "flat"}>
                          {newProduksiBadge.label}
                        </Chip>
                      </div>
                      <Select
                        size="sm"
                        selectedKeys={[selectedProduksi]}
                        onSelectionChange={(keys) => {
                          const val = (Array.from(keys)[0] as StatusProduksiKey) ?? selectedProduksi;
                          // Prevent selecting a disabled option
                          if (!isStatusDisabled(val)) setSelectedProduksi(val);
                        }}
                        aria-label="Status produksi"
                      >
                        {STATUS_PRODUKSI_STEPS.map((s) => (
                          <SelectItem
                            key={s.key}
                            isDisabled={isStatusDisabled(s.key)}
                            className={isStatusDisabled(s.key) ? "opacity-40" : ""}
                            textValue={s.label}
                          >
                            <div className="flex items-center gap-2">
                              <span>{s.label}</span>
                              {isStatusDisabled(s.key) && currentStatusBayar !== "BELUM_BAYAR" && (
                                <span className="text-xs text-default-500">(butuh SPK)</span>
                              )}
                              {currentStatusBayar === "BELUM_BAYAR" && (
                                <span className="text-xs text-default-500">(status belum bayar)</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </Select>

                      {/* Hint: memilih PRODUKSI tanpa SPK */}
                      {selectedProduksi === "PRODUKSI" && !hasSPK && (
                        <div className="flex items-start gap-2 rounded-lg bg-warning-50 border border-warning-200 px-3 py-2 text-xs text-warning-700">
                          <ClipboardList size={13} className="mt-0.5 shrink-0" />
                          <span>
                            Pesanan belum memiliki SPK. Klik{" "}
                            <strong>Lanjut</strong> untuk mengisi form SPK terlebih
                            dahulu — status akan otomatis berubah ke{" "}
                            <strong>Produksi</strong>.
                          </span>
                        </div>
                      )}

                      {/* Hint: PACKING/SELESAI dikunci karena belum ada SPK */}
                      {!hasSPK && selectedProduksi !== "PRODUKSI" && (
                        <div className="flex items-start gap-2 rounded-lg bg-default-50 border border-default-200 px-3 py-2 text-xs text-default-500">
                          <ClipboardList size={13} className="mt-0.5 shrink-0" />
                          <span>
                            Status <strong>Packing</strong> dan <strong>Selesai</strong> hanya
                            tersedia setelah SPK dibuat.
                          </span>
                        </div>
                      )}
                      {currentStatusBayar === "BELUM_BAYAR" && (
                        <div className="flex items-start gap-2 rounded-lg bg-danger-50 border border-danger px-3 py-2 text-xs text-danger">
                          <Wallet size={13} className="mt-0.5 shrink-0" />
                          <span>
                            Pesanan ini belum dibayar. Klik <Link
                              href={`/order/${orderId}`}
                              className="cursor-pointer text-red-800 underline"
                            >
                              Lanjut
                            </Link> untuk menambahkan riwayat pembayaran.
                          </span>
                        </div>
                      )}
                    </div>

                    <Divider />

                    {/* Pembayaran */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-default-500 uppercase tracking-wide">
                        Status Pembayaran
                      </span>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-default-50 border border-default-200">
                        <Chip size="sm" color={curBayarBadge.color} variant="flat">
                          {curBayarBadge.label}
                        </Chip>
                        <span className="text-xs text-default-400 ml-auto text-right">
                          Diperbarui otomatis saat kasir menambahkan Riwayat Bayar.
                        </span>
                      </div>
                    </div>
                  </ModalBody>

                  <ModalFooter>
                    <Button variant="flat" color="danger" onPress={onClose} size="sm">
                      Batal
                    </Button>
                    <Button
                      color="primary"
                      onPress={handleSaveStatus}
                      isLoading={isLoading}
                      isDisabled={isLoading || !hasChanges}
                      size="sm"
                    >
                      {selectedProduksi === "PRODUKSI" && !hasSPK ? "Lanjut → Buat SPK" : "Simpan"}
                    </Button>
                  </ModalFooter>
                </>
              )}

              {/* ── STEP 2: Form SPK Inline ── */}
              {step === "spk" && (
                <form noValidate onSubmit={spkForm.handleSubmit(handleSubmitSPK)}>
                  <ModalHeader className="flex flex-col gap-0.5 pb-2">
                    <span>Buat SPK — Tahap Produksi</span>
                    <span className="text-sm font-normal text-default-500 font-mono">{nomorOrder}</span>
                  </ModalHeader>

                  <ModalBody className="gap-3 pt-0">
                    {spkGlobalError && <Alert color="danger" title={spkGlobalError} />}

                    <div className="rounded-lg bg-warning-50 border border-warning-200 px-3 py-2 text-xs text-warning-700">
                      Mengisi form ini akan memindahkan status pesanan ke{" "}
                      <span className="font-semibold">PRODUKSI</span> sekaligus membuat SPK.
                    </div>

                    <Controller
                      name="karyawanId"
                      control={spkForm.control}
                      render={({ field }) => (
                        <Select
                          label="Pekerja Produksi"
                          placeholder="Pilih pekerja"
                          isRequired
                          selectedKeys={field.value ? new Set([field.value]) : new Set()}
                          onSelectionChange={(keys) => {
                            const val = Array.from(keys)[0] as string;
                            field.onChange(val ?? "");
                          }}
                          isInvalid={!!spkForm.formState.errors.karyawanId}
                          errorMessage={spkForm.formState.errors.karyawanId?.message}
                          isDisabled={spkForm.formState.isSubmitting}
                          size="sm"
                        >
                          {karyawanList.map((k) => (
                            <SelectItem key={k.id} textValue={k.nama}>
                              <div className="flex flex-col">
                                <span className="text-sm">{k.nama}</span>
                                {k.posisi && (
                                  <span className="text-xs text-default-400">{k.posisi}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </Select>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        size="sm"
                        label="Model"
                        placeholder="Kaos, Kemeja, ..."
                        {...spkForm.register("model")}
                        isDisabled={spkForm.formState.isSubmitting}
                      />
                      <Input
                        size="sm"
                        label="Ukuran"
                        placeholder="S/M/L/XL"
                        {...spkForm.register("ukuran")}
                        isDisabled={spkForm.formState.isSubmitting}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        size="sm"
                        label="Tali / Aksesori"
                        placeholder="Bisban, Polos, ..."
                        {...spkForm.register("tali")}
                        isDisabled={spkForm.formState.isSubmitting}
                      />
                      <FormattedNumberInput
                        size="sm"
                        label="Jumlah"
                        isRequired
                        value={displayJumlah}
                        onChange={(v) => {
                          const n = Number(v);
                          setDisplayJumlah(n);
                          spkForm.setValue("jumlah", String(n), { shouldValidate: true });
                        }}
                        isInvalid={!!spkForm.formState.errors.jumlah}
                        errorMessage={spkForm.formState.errors.jumlah?.message}
                        isDisabled={spkForm.formState.isSubmitting}
                      />
                    </div>

                    <Input
                      size="sm"
                      label="Tanggal Setor"
                      type="date"
                      {...spkForm.register("tanggalSetor")}
                      isDisabled={spkForm.formState.isSubmitting}
                    />

                    <Textarea
                      size="sm"
                      label="Catatan"
                      placeholder="Instruksi tambahan..."
                      minRows={2}
                      {...spkForm.register("catatan")}
                      isDisabled={spkForm.formState.isSubmitting}
                    />
                  </ModalBody>

                  <ModalFooter>
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => setStep("status")}
                      isDisabled={spkForm.formState.isSubmitting}
                    >
                      ← Kembali
                    </Button>
                    <Button
                      size="sm"
                      color="primary"
                      type="submit"
                      isLoading={spkForm.formState.isSubmitting}
                      isDisabled={spkForm.formState.isSubmitting}
                    >
                      Buat SPK & Mulai Produksi
                    </Button>
                  </ModalFooter>
                </form>
              )}
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
