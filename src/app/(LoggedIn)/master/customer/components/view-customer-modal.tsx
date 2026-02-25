"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Calendar, Phone } from "lucide-react";
import { Customer } from "@/types/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-default-400">{icon}</span>
      <div className="flex flex-col min-w-0">
        <span className="text-xs text-default-400 font-medium uppercase tracking-wide">
          {label}
        </span>
        <span className="text-sm text-default-700 wrap-break-word">
          {value || <span className="text-default-300 italic">—</span>}
        </span>
      </div>
    </div>
  );
}

export default function ViewCustomerModal({
  customer,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  customer: Customer;
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

  const createdAt = customer.createdAt
    ? new Date(customer.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <>
      {controlledIsOpen === undefined && (
        <Button variant="light" size="sm" onPress={onOpen}>
          Lihat
        </Button>
      )}
      <Modal
        isOpen={isOpen}
        placement="bottom-center"
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1 pb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12 rounded-full">
                    <AvatarImage
                      src={customer.image || undefined}
                      alt={customer.nama}
                    />
                    <AvatarFallback className="text-base font-semibold">
                      {customer.nama.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-base font-semibold leading-tight">
                    {customer.nama}
                  </p>
                </div>
              </ModalHeader>
              <ModalBody className="py-4">
                <div className="grid gap-4">
                  <InfoRow
                    icon={<Phone size={15} />}
                    label="Nomor HP"
                    value={customer.nomorHp}
                  />
                  {createdAt && (
                    <InfoRow
                      icon={<Calendar size={15} />}
                      label="Terdaftar"
                      value={createdAt}
                    />
                  )}
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
