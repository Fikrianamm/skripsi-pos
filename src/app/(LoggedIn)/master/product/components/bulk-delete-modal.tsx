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
import { authClient } from "@/lib/auth-client";

export default function BulkDeleteModal({
  userIds,
  onDeleted,
}: {
  userIds: string[];
  onDeleted?: () => void;
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete(onClose: () => void) {
    setIsDeleting(true);

    try {
      const results = await Promise.allSettled(
        userIds.map((userId) => authClient.admin.removeUser({ userId })),
      );

      const failed = results.filter(
        (r) =>
          r.status === "rejected" ||
          (r.status === "fulfilled" && r.value.error),
      );

      if (failed.length > 0) {
        addToast({
          title: "Sebagian gagal",
          description: `${userIds.length - failed.length} berhasil dihapus, ${failed.length} gagal.`,
          color: "warning",
        });
      } else {
        addToast({
          title: "Berhasil",
          description: `${userIds.length} pengguna berhasil dihapus.`,
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
        Hapus {userIds.length} Pengguna
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
              <ModalHeader>Hapus Pengguna</ModalHeader>
              <ModalBody>
                <Alert color="danger" title="Peringatan">
                  Anda akan menghapus {userIds.length} pengguna beserta semua
                  data yang terkait. Tindakan ini tidak dapat dibatalkan.
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
                  Hapus {userIds.length} Pengguna
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
