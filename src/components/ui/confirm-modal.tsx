"use client";

import React from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Archive, AlertTriangle, Info } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string | React.ReactNode;
  onConfirm: () => void;
  isLoading: boolean;
  confirmLabel: string;
  confirmColor?: "danger" | "primary" | "warning";
  // ── Props baru untuk delete-aware modal ──
  /** List relasi data yang akan ikut terhapus (ditampilkan sebagai bullet list) */
  relatedData?: string[];
  /** Jika true, menampilkan info bahwa data di-soft-delete (ke sampah) */
  hasSoftDelete?: boolean;
  /** Jika true, menampilkan saran nonaktifkan beserta tombolnya */
  hasActiveStatus?: boolean;
  /** Callback saat user memilih "Nonaktifkan Saja" */
  onDeactivate?: () => void;
  /** Custom content tambahan setelah description */
  extraContent?: React.ReactNode;
}

export function ConfirmModal({
  isOpen,
  onClose,
  title,
  description,
  onConfirm,
  isLoading,
  confirmLabel,
  confirmColor = "primary",
  relatedData,
  hasSoftDelete,
  hasActiveStatus,
  onDeactivate,
  extraContent,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalContent>
        <ModalHeader className="text-sm">{title}</ModalHeader>
        <ModalBody className="gap-3">
          {typeof description === "string" ? (
            <p className="text-sm text-default-600">{description}</p>
          ) : (
            description
          )}

          {/* Soft delete info */}
          {hasSoftDelete && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Archive size={14} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Data akan dipindahkan ke <strong>Sampah</strong> dan bisa
                dipulihkan kembali.
              </p>
            </div>
          )}

          {/* Hard delete: relasi yang terhapus */}
          {relatedData && relatedData.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <AlertTriangle
                size={13}
                className="text-danger-600 shrink-0 mt-0.5"
              />
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-danger-700">
                  Data berikut akan ikut terhapus:
                </p>
                <ul className="text-xs text-danger-600 list-disc list-inside space-y-0.5">
                  {relatedData.map((rel, i) => (
                    <li key={i}>{rel}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Saran nonaktifkan */}
          {hasActiveStatus && onDeactivate && (
            <div className="flex items-start gap-2 p-3 bg-warning-50 border border-warning-200 rounded-lg">
              <Info size={14} className="text-warning-600 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-warning-700">
                  Jika data masih dibutuhkan sebagai referensi historis,
                  sebaiknya <strong>nonaktifkan</strong> daripada dihapus.
                </p>
                <Button
                  size="sm"
                  variant="flat"
                  color="warning"
                  className="h-7 text-xs w-fit"
                  onPress={() => {
                    onDeactivate();
                    onClose();
                  }}
                >
                  Nonaktifkan Saja
                </Button>
              </div>
            </div>
          )}

          {extraContent}
        </ModalBody>
        <ModalFooter>
          <Button
            size="sm"
            variant="flat"
            onPress={onClose}
            isDisabled={isLoading}
          >
            Batal
          </Button>
          <Button
            size="sm"
            color={confirmColor}
            onPress={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
