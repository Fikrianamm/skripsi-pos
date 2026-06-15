"use client";

import { useState } from "react";
import { addToast } from "@heroui/toast";
import { Karyawan } from "@/types/types";
import { ConfirmModal } from "@/components/ui/confirm-modal";

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

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/karyawan/${karyawan.id}`, {
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
        description: "Karyawan berhasil dihapus.",
        color: "success",
      });
      onOpenChange?.(false);
      onKaryawanDeleted?.();
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
    <ConfirmModal
      isOpen={isOpen ?? false}
      onClose={() => onOpenChange?.(false)}
      title="Hapus Karyawan"
      description={
        <p className="text-sm text-default-600">
          Apakah Anda yakin ingin menghapus karyawan{" "}
          <span className="font-semibold">{karyawan.nama}</span>?
        </p>
      }
      onConfirm={handleDelete}
      isLoading={isDeleting}
      confirmLabel="Hapus"
      confirmColor="danger"
      relatedData={["SPK yang terkait dengan karyawan ini"]}
    />
  );
}
