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
import { Customer } from "@/types/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function DeleteCustomerModal({
  customer,
  onCustomerDeleted,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  customer: Customer;
  onCustomerDeleted?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
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
      const res = await fetch(`/api/admin/customer/${customer.id}`, {
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
        description: "Customer berhasil dihapus.",
        color: "success",
      });
      onClose();
      onCustomerDeleted?.();
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
                  <Avatar className="size-10 rounded-full">
                    <AvatarImage
                      src={customer.image || undefined}
                      alt={customer.nama}
                    />
                    <AvatarFallback>
                      {customer.nama.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="block text-base font-semibold">
                      Hapus Customer
                    </span>
                    <span className="font-normal text-sm text-slate-500">
                      {customer.nama}
                    </span>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody className="gap-3">
                <Alert
                  color="danger"
                  title="Konfirmasi Penghapusan"
                >
                  <p className="mb-2">
                    Data customer ini akan dipindahkan ke <strong>Tempat Sampah</strong>.
                    Anda masih dapat memulihkannya nanti jika diperlukan.
                  </p>
                  <ul className="list-disc list-inside text-sm">
                    <li>Customer tidak akan muncul lagi di daftar aktif.</li>
                    <li>Data terkait pada riwayat Order akan tetap tersimpan namun ditandai sebagai customer terhapus.</li>
                  </ul>
                </Alert>
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 shrink-0 mt-0.5"><rect width="20" height="5" x="2" y="3" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" /></svg>
                  <p className="text-xs text-blue-700">
                    Data dipindahkan ke <strong>Sampah</strong> dan bisa dipulihkan kembali.
                  </p>
                </div>
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
                  Pindahkan ke Sampah
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
