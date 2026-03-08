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
import { BahanBaku } from "@/types/types";
import { Box } from "lucide-react";

export default function DeleteBahanBakuModal({
  bahanBaku,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
  onDeleted,
}: {
  bahanBaku: BahanBaku;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDeleted?: () => void;
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
      const res = await fetch(`/api/admin/bahan-baku/${bahanBaku.id}`, {
        method: "DELETE",
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
        description: "Bahan baku berhasil dihapus.",
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
        <Button
          color="danger"
          variant="light"
          size="sm"
          onPress={onOpen}
          isIconOnly
        >
          Hapus
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
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-danger/10 flex items-center justify-center">
                    <Box size={18} className="text-danger" />
                  </div>
                  <div>
                    <span className="block text-base font-semibold">
                      Hapus Bahan Baku
                    </span>
                    <span className="font-normal text-sm text-slate-500">
                      {bahanBaku.nama}
                    </span>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <Alert
                  color="danger"
                  title="Tindakan ini tidak dapat dibatalkan."
                >
                  <p className="mb-2">
                    Data bahan baku akan dihapus secara permanen beserta data
                    terkait berikut:
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
                  onPress={() => handleDelete(onClose)}
                  isDisabled={isDeleting}
                  isLoading={isDeleting}
                >
                  Hapus
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
