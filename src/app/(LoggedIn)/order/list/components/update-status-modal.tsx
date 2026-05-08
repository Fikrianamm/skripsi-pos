/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
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
import { addToast } from "@heroui/toast";
import { ArrowRightLeft, ClipboardList, Wallet } from "lucide-react";
import {
  getStatusProduksiBadge,
  getStatusBayarBadge,
} from "../../components/order-badges";
import {
  STATUS_PRODUKSI_STEPS,
  StatusProduksiKey,
} from "../../components/types";
import Link from "next/link";
import { SpkFormModal } from "@/app/(LoggedIn)/order/[id]/components/spk-form-modal";

interface UpdateStatusModalProps {
  orderId: string;
  nomorOrder: string;
  currentStatus: string;
  currentStatusBayar: string;
  hasSPK: boolean;
  items: { nama: string; qty: number }[];
  onUpdated: () => void | Promise<any>;
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
  const { isOpen: isSpkOpen, onOpen: onOpenSpk, onOpenChange: onOpenChangeSpk } = useDisclosure();
  
  const [selectedProduksi, setSelectedProduksi] = useState<StatusProduksiKey>(
    currentStatus as StatusProduksiKey,
  );
  const [isLoading, setIsLoading] = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function handleOpen() {
    setSelectedProduksi(currentStatus as StatusProduksiKey);
    onOpen();
  }

  const produksiChanged = selectedProduksi !== currentStatus;
  const hasChanges = produksiChanged;

  async function handleSaveStatus() {
    if (!hasChanges) {
      onClose();
      return;
    }

    // Jika ke PRODUKSI tapi belum ada SPK -> buka form SPK
    if (selectedProduksi === "PRODUKSI" && !hasSPK) {
      onClose();
      onOpenSpk();
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
      addToast({
        title: "Status diperbarui",
        description: nomorOrder,
        color: "success",
      });
      await onUpdated();
      onClose();
    } catch {
      addToast({
        title: "Error",
        description: "Terjadi kesalahan jaringan.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const curProduksiBadge = getStatusProduksiBadge(currentStatus);
  const newProduksiBadge = getStatusProduksiBadge(selectedProduksi);
  const curBayarBadge = getStatusBayarBadge(currentStatusBayar);

  // Status yang memerlukan SPK sebelum bisa dipilih (kecuali BATAL selalu boleh)
  const REQUIRES_SPK: StatusProduksiKey[] = ["PACKING", "SELESAI"];

  function isStatusDisabled(key: StatusProduksiKey): boolean {
    // 1. Jika belum ada SPK, tidak bisa loncat ke PACKING/SELESAI
    if (!hasSPK && REQUIRES_SPK.includes(key)) return true;

    // 2. Jika belum bayar sama sekali, tidak bisa ke tahap PRODUKSI/setelahnya
    // DESAIN & PENDING masih boleh diakses meski belum bayar (biasanya proses awal)
    const needsPayment = ["PRODUKSI", "PACKING", "SELESAI"];
    if (currentStatusBayar === "BELUM_BAYAR" && needsPayment.includes(key))
      return true;

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
        </ModalContent>
      </Modal>

      {/* Shared SPK Form Modal */}
      <SpkFormModal
        isOpen={isSpkOpen}
        onOpenChange={onOpenChangeSpk}
        orderId={orderId}
        nomorOrder={nomorOrder}
        order={{ items }}
        onSuccess={onUpdated}
      />
    </>
  );
}
