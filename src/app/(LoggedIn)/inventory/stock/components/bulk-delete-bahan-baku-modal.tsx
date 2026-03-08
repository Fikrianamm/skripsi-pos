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
import { Trash2 } from "lucide-react";

export default function BulkDeleteBahanBakuModal({
  ids,
  onDeleted,
}: {
  ids: string[];
  onDeleted?: () => void;
}) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/bahan-baku", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
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
        description: `${ids.length} bahan baku berhasil dihapus.`,
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
        size="sm"
        startContent={<Trash2 size={15} />}
        onPress={onOpen}
      >
        Hapus ({ids.length})
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
              <ModalHeader>Hapus Bahan Baku</ModalHeader>
              <ModalBody>
                <Alert
                  color="danger"
                  title="Tindakan ini tidak dapat dibatalkan."
                >
                  <p className="mb-2">
                    {ids.length} bahan baku yang dipilih akan dihapus secara
                    permanen beserta data terkait berikut:
                  </p>
                  <ul className="list-disc list-inside text-sm">
                    <li>Riwayat Stok Masuk</li>
                  </ul>
                </Alert>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="flat" onPress={onClose}>
                  Batal
                </Button>
                <Button
                  color="danger"
                  onPress={handleDelete}
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
