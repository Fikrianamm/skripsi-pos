"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface DeleteOrderModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  nomorOrder: string;
  onConfirm: () => Promise<void>;
}

export function DeleteOrderModal({
  isOpen,
  onOpenChange,
  nomorOrder,
  onConfirm,
}: DeleteOrderModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange} 
      size="md"
      backdrop="blur"
      classNames={{
        base: "border border-danger-100 bg-white",
        header: "border-b border-default-100",
        footer: "border-t border-default-100",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2 text-danger">
              <Trash2 size={20} />
              Konfirmasi Hapus Pesanan
            </ModalHeader>
            <ModalBody className="py-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-3 bg-danger-50 rounded-full text-danger">
                  <AlertTriangle size={32} />
                </div>
                <div className="space-y-2">
                  <p className="text-base font-semibold">
                    Apakah Anda yakin ingin menghapus pesanan <span className="text-primary">{nomorOrder}</span>?
                  </p>
                  <div className="text-sm text-default-500 bg-default-50 p-3 rounded-lg border border-default-200">
                    <p className="font-medium text-default-700 mb-1 text-left">Apa yang terjadi?</p>
                    <ul className="text-left list-disc list-inside space-y-1">
                      <li>Pesanan dipindahkan ke <strong>Tempat Sampah</strong></li>
                      <li>Seluruh riwayat pembayaran akan di-soft delete</li>
                      <li>Jurnal keuangan terkait akan dibatalkan otomatis</li>
                      <li>Anda masih dapat memulihkan data ini nanti</li>
                    </ul>
                  </div>
                  <p className="text-xs text-danger font-medium italic pt-2">
                    *Tindakan ini akan mempengaruhi laporan keuangan (Neraca & Laba Rugi).
                  </p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose} isDisabled={isLoading}>
                Batal
              </Button>
              <Button 
                color="danger" 
                onPress={handleConfirm} 
                isLoading={isLoading}
                startContent={!isLoading && <Trash2 size={16} />}
              >
                Ya, Hapus Pesanan
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
