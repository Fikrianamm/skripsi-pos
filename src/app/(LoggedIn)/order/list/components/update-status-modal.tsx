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
  userRole?: string;
}

export function UpdateStatusModal({
  orderId,
  nomorOrder,
  currentStatus,
  currentStatusBayar,
  hasSPK,
  items,
  onUpdated,
  userRole,
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

  // Status yang TIDAK bisa diubah dari modal ini — harus dari halaman antrean
  const MODAL_LOCKED: StatusProduksiKey[] = ["PRODUKSI", "PACKING"];
  const isKasir = userRole === "kasir";

  function isStatusDisabled(key: StatusProduksiKey): boolean {
    // PRODUKSI dan PACKING dikunci dari modal ini untuk semua role
    if (MODAL_LOCKED.includes(key)) return true;

    // Kasir tidak bisa set SELESAI (hanya admin/produksi)
    if (isKasir && key === "SELESAI") return true;

    // Belum bayar → tidak bisa ke SELESAI
    if (currentStatusBayar === "BELUM_BAYAR" && key === "SELESAI") return true;

    return false;
  }

  // Helper: alasan kenapa status disabled
  function getDisabledReason(key: StatusProduksiKey): string | null {
    if (key === "PRODUKSI") return "(via Antrean Desain)";
    if (key === "PACKING") return "(via Antrean Produksi)";
    if (isKasir && key === "SELESAI") return "(hanya admin/produksi)";
    if (currentStatusBayar === "BELUM_BAYAR" && key === "SELESAI") return "(belum bayar)";
    return null;
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
                          {isStatusDisabled(s.key) && getDisabledReason(s.key) && (
                            <span className="text-xs text-default-400">{getDisabledReason(s.key)}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </Select>

                  {/* Hint: flow produksi */}
                  <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
                    <ClipboardList size={13} className="mt-0.5 shrink-0" />
                    <span>
                      Status <strong>Produksi</strong> diubah dari halaman{" "}
                      <Link href="/production/design-queue" className="underline font-medium">
                        Antrean Desain
                      </Link>{" "}
                      setelah desain di-ACC. Status <strong>Packing</strong> diubah dari halaman{" "}
                      <Link href="/production/spk" className="underline font-medium">
                        Antrean Produksi
                      </Link>.
                    </span>
                  </div>

                  {isKasir && (
                    <div className="flex items-start gap-2 rounded-lg bg-default-50 border border-default-200 px-3 py-2 text-xs text-default-500">
                      <ClipboardList size={13} className="mt-0.5 shrink-0" />
                      <span>
                        Sebagai <strong>Kasir</strong>, Anda dapat mengubah status
                        ke <strong>Desain</strong> atau <strong>Batal</strong>. Status <strong>Selesai</strong>{" "}
                        dilakukan oleh admin atau tim produksi.
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
                  {selectedProduksi === "PRODUKSI" && !hasSPK && !isKasir ? "Lanjut \u2192 Buat SPK" : "Simpan"}
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
