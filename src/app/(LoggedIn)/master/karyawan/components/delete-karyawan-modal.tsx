"use client";

import { useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Alert } from "@heroui/alert";
import { addToast } from "@heroui/toast";
import { Karyawan } from "@/types/types";

export default function DeleteKaryawanModal({
  karyawan,
  onKaryawanDeleted,
  isOpen,
  onOpenChange,
}: {
  karyawan: Karyawan;
  onKaryawanDeleted?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete(onClose: () => void) {
    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/karyawan/${karyawan.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Terjadi kesalahan.");
        return;
      }
      addToast({
        title: "Berhasil",
        description: "Karyawan berhasil dihapus.",
        color: "success",
      });
      onClose();
      onKaryawanDeleted?.();
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      placement="bottom-center"
      onOpenChange={(open) => {
        onOpenChange?.(open);
        if (!open) setError("");
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Hapus Karyawan</ModalHeader>
            <ModalBody>
              {error && <Alert color="danger" title={error} />}
              <p className="text-sm text-default-600">
                Apakah Anda yakin ingin menghapus karyawan{" "}
                <span className="font-semibold">{karyawan.nama}</span>? Tindakan
                ini tidak dapat dibatalkan.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose} isDisabled={isDeleting}>
                Batal
              </Button>
              <Button
                color="danger"
                onPress={() => handleDelete(onClose)}
                isLoading={isDeleting}
                isDisabled={isDeleting}
              >
                Hapus
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
