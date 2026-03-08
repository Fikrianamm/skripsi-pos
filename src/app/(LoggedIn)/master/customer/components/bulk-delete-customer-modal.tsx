"use client";

import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { useState } from "react";
import { Alert } from "@heroui/alert";
import { addToast } from "@heroui/toast";

export default function BulkDeleteCustomerModal({
  selectedIds,
  onDeleted,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  selectedIds: string[];
  onDeleted?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const {
    isOpen: internalIsOpen,
    onOpen,
    onOpenChange: internalOnOpenChange,
  } = useDisclosure();
  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const onOpenChange = controlledOnOpenChange ?? internalOnOpenChange;
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete(onClose: () => void) {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/customer", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast({
          title: "Gagal",
          description: json.error || "Terjadi kesalahan.",
          color: "danger",
        });
        return;
      }
      addToast({
        title: "Berhasil",
        description: json.message,
        color: "success",
      });
      onClose();
      onDeleted?.();
    } catch {
      addToast({
        title: "Gagal",
        description: "Terjadi kesalahan jaringan.",
        color: "danger",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      {controlledIsOpen === undefined && (
        <Button color="danger" variant="flat" size="sm" onPress={onOpen}>
          Hapus {selectedIds.length} Customer
        </Button>
      )}
      <Modal
        isOpen={isOpen}
        placement="bottom-center"
        onOpenChange={onOpenChange}
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Hapus {selectedIds.length} Customer</ModalHeader>
              <ModalBody>
                <Alert
                  color="danger"
                  title="Tindakan ini tidak dapat dibatalkan."
                >
                  <p className="mb-2">
                    {selectedIds.length} customer yang dipilih akan dihapus
                    secara permanen beserta data terkait berikut:
                  </p>
                  <ul className="list-disc list-inside text-sm">
                    <li>Riwayat Order (Transaksi Penjualan)</li>
                  </ul>
                </Alert>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="flat" onPress={onClose}>
                  Batal
                </Button>
                <Button
                  color="danger"
                  onPress={() => handleDelete(onClose)}
                  isDisabled={isDeleting}
                  isLoading={isDeleting}
                >
                  Hapus Semua
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
