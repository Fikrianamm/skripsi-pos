"use client";

import { useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Alert } from "@heroui/alert";
import { addToast } from "@heroui/toast";
import { Trash2 } from "lucide-react";

export default function BulkDeleteKaryawanModal({
  karyawanIds,
  onDeleted,
}: {
  karyawanIds: string[];
  onDeleted?: () => void;
}) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/karyawan", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: karyawanIds }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Terjadi kesalahan.");
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
      setError("Terjadi kesalahan jaringan.");
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
        startContent={<Trash2 size={14} />}
        onPress={onOpen}
      >
        Hapus ({karyawanIds.length})
      </Button>

      <Modal
        isOpen={isOpen}
        placement="bottom-center"
        onOpenChange={(open) => {
          onOpenChange();
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
                  Apakah Anda yakin ingin menghapus{" "}
                  <span className="font-semibold">
                    {karyawanIds.length} karyawan
                  </span>{" "}
                  yang dipilih? Tindakan ini tidak dapat dibatalkan.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={onClose}
                  isDisabled={isDeleting}
                >
                  Batal
                </Button>
                <Button
                  color="danger"
                  onPress={handleDelete}
                  isLoading={isDeleting}
                  isDisabled={isDeleting}
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
