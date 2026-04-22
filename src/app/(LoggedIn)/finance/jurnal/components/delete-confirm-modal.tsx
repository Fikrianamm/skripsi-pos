"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { JurnalItem } from "./jurnal-table";
import { formatRupiah } from "@/lib/func";
import { AlertCircle } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: JurnalItem | null;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onOpenChange,
  item,
  onConfirm,
  isLoading,
}: DeleteConfirmModalProps) {
  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Konfirmasi Hapus Jurnal
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-danger-50 text-danger-700 text-sm border border-danger-200">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>
                    Apakah Anda yakin ingin menghapus entri jurnal ini? Tindakan
                    ini tidak dapat dibatalkan.
                  </p>
                </div>

                <div className="flex flex-col gap-2 p-4 rounded-xl border border-default-200 bg-default-50">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-default-500 font-medium uppercase">
                      REF
                    </span>
                    <span className="text-sm font-mono font-bold text-default-900">
                      {item.ref}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-default-500 font-medium uppercase mt-1">
                      KETERANGAN
                    </span>
                    <span className="text-sm text-default-700 text-right max-w-[200px]">
                      {item.keterangan}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-default-200">
                    <span className="text-xs text-default-500 font-medium uppercase">
                      NOMINAL
                    </span>
                    <span className="text-base font-bold text-danger-600">
                      {formatRupiah(Number(item.nominal))}
                    </span>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={onClose}
                isDisabled={isLoading}
              >
                Batal
              </Button>
              <Button
                color="danger"
                onPress={() => {
                  onConfirm().then(() => onClose());
                }}
                isLoading={isLoading}
              >
                Hapus Jurnal
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
