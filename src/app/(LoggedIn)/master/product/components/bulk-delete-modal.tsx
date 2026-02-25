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

export default function BulkDeleteProductModal({
  productIds,
  onDeleted,
}: {
  productIds: string[];
  onDeleted?: () => void;
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete(onClose: () => void) {
    setIsDeleting(true);

    try {
      const results = await Promise.allSettled(
        productIds.map((id) =>
          fetch(`/api/admin/product/${id}`, { method: "DELETE" }).then((r) =>
            r.ok ? r : Promise.reject(r),
          ),
        ),
      );

      const failed = results.filter((r) => r.status === "rejected");

      if (failed.length > 0) {
        addToast({
          title: "Sebagian gagal",
          description: `${productIds.length - failed.length} berhasil dihapus, ${failed.length} gagal.`,
          color: "warning",
        });
      } else {
        addToast({
          title: "Berhasil",
          description: `${productIds.length} produk berhasil dihapus.`,
          color: "success",
        });
      }

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
        Hapus {productIds.length} Produk
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
              <ModalHeader>Hapus Produk</ModalHeader>
              <ModalBody>
                <Alert color="danger" title="Peringatan">
                  Anda akan menghapus {productIds.length} produk. Tindakan ini
                  tidak dapat dibatalkan.
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
                  Hapus {productIds.length} Produk
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
