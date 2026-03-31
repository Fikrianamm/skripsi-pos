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
import { ArrowRightLeft } from "lucide-react";
import {
  STATUS_PRODUKSI_STEPS,
  StatusProduksiKey,
} from "../../components/types";
import {
  getStatusProduksiBadge,
  getStatusBayarBadge,
} from "../../components/order-badges";

interface UpdateStatusModalProps {
  orderId: string;
  nomorOrder: string;
  currentStatus: string;
  currentStatusBayar: string;
  onUpdated: () => void;
  onNeedSPK?: () => void; // dipanggil saat user mau pindah ke JAHIT
}

export function UpdateStatusModal({
  orderId,
  nomorOrder,
  currentStatus,
  currentStatusBayar,
  onUpdated,
  onNeedSPK,
}: UpdateStatusModalProps) {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [selectedProduksi, setSelectedProduksi] = useState<StatusProduksiKey>(
    currentStatus as StatusProduksiKey,
  );
  const [isLoading, setIsLoading] = useState(false);
  function handleOpen() {
    setSelectedProduksi(currentStatus as StatusProduksiKey);
    onOpen();
  }

  const produksiChanged = selectedProduksi !== currentStatus;
  const hasChanges = produksiChanged;

  async function handleSave() {
    if (!hasChanges) {
      onClose();
      return;
    }

    // Intercept: jika user memilih JAHIT (dan belum di-JAHIT), wajib isi SPK
    if (produksiChanged && selectedProduksi === "JAHIT" && onNeedSPK) {
      onClose();
      onNeedSPK();
      return;
    }

    setIsLoading(true);
    try {
      const body: Record<string, string> = {};
      if (produksiChanged) body.statusProduksi = selectedProduksi;

      const res = await fetch(`/api/order/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      onUpdated();
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

  return (
    <>
      <Button
        size="sm"
        variant="flat"
        color="default"
        startContent={<ArrowRightLeft size={13} />}
        onPress={(e) => {
          e.continuePropagation?.();
          handleOpen();
        }}
        className="shrink-0"
      >
        Status
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        size="sm"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-0.5 pb-2">
                <span>Update Status</span>
                <span className="text-sm font-normal text-default-500 font-mono">
                  {nomorOrder}
                </span>
              </ModalHeader>

              <ModalBody className="gap-4 pt-0">
                {/* ── Produksi ── */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-default-500 uppercase tracking-wide">
                    Status Produksi
                  </span>
                  {/* Preview */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-default-50">
                    <Chip
                      size="sm"
                      color={curProduksiBadge.color}
                      variant="flat"
                    >
                      {curProduksiBadge.label}
                    </Chip>
                    <ArrowRightLeft
                      size={13}
                      className="text-default-300 shrink-0"
                    />
                    <Chip
                      size="sm"
                      color={newProduksiBadge.color}
                      variant={produksiChanged ? "solid" : "flat"}
                    >
                      {newProduksiBadge.label}
                    </Chip>
                  </div>
                  <Select
                    size="sm"
                    selectedKeys={[selectedProduksi]}
                    onSelectionChange={(keys) =>
                      setSelectedProduksi(
                        (Array.from(keys)[0] as StatusProduksiKey) ??
                          selectedProduksi,
                      )
                    }
                    aria-label="Status produksi"
                  >
                    {STATUS_PRODUKSI_STEPS.map((s) => (
                      <SelectItem key={s.key}>{s.label}</SelectItem>
                    ))}
                  </Select>
                </div>

                <Divider />

                {/* ── Pembayaran ── */}
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
                <Button
                  variant="flat"
                  color="danger"
                  onPress={onClose}
                  size="sm"
                >
                  Batal
                </Button>
                <Button
                  color="primary"
                  onPress={handleSave}
                  isLoading={isLoading}
                  isDisabled={isLoading || !hasChanges}
                  size="sm"
                >
                  Simpan
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
