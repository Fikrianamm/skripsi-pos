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
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Alert } from "@heroui/alert";
import { addToast } from "@heroui/toast";

export default function BulkDeleteSupplierModal({
  supplierIds,
  onDeleted,
}: {
  supplierIds: string[];
  onDeleted?: () => void;
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete(onClose: () => void) {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/supplier", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: supplierIds }),
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
        description: `${supplierIds.length} supplier berhasil dihapus.`,
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
      <Button
        color="danger"
        variant="flat"
        startContent={<Trash2 size={16} />}
        onPress={onOpen}
        size="sm"
      >
        Hapus {supplierIds.length} Supplier
      </Button>
      <Modal
        isOpen={isOpen}
        placement="bottom-center"
        onOpenChange={onOpenChange}
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Hapus Supplier</ModalHeader>
              <ModalBody>
                <Alert color="danger" title="Peringatan">
                  Anda akan menghapus {supplierIds.length} supplier beserta
                  semua data yang terkait. Tindakan ini tidak dapat dibatalkan.
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
                  Hapus {supplierIds.length} Supplier
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
