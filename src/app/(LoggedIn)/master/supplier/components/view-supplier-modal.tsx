"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Chip } from "@heroui/react";
import { Button } from "@heroui/button";
import { Calendar, CircleDot, Mail, Notebook, Map, Phone } from "lucide-react";
import { Supplier } from "@/types/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null | React.ReactNode;
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

export default function ViewSupplierModal({
  supplier,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  supplier: Supplier;
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

  const createdAt = supplier.createdAt
    ? new Date(supplier.createdAt).toLocaleDateString("id-ID", {
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
                      src={supplier.image || undefined}
                      alt={supplier.nama}
                    />
                    <AvatarFallback className="text-base font-semibold">
                      {supplier.nama.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-base font-semibold leading-tight">
                      {supplier.nama}
                    </p>
                    <div className="mt-0.5">
                      {supplier.isActive ? (
                        <Chip
                          size="sm"
                          color="success"
                          variant="dot"
                          className="text-success bg-success/10 border-success/20"
                        >
                          Aktif
                        </Chip>
                      ) : (
                        <Chip
                          size="sm"
                          color="danger"
                          variant="dot"
                          className="text-danger bg-danger/10 border-danger/20"
                        >
                          Tidak Aktif
                        </Chip>
                      )}
                    </div>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody className="py-4">
                <div className="grid gap-4">
                  <InfoRow
                    icon={<Phone size={15} />}
                    label="Nomor HP"
                    value={supplier.nomorHp}
                  />
                  <InfoRow
                    icon={<Mail size={15} />}
                    label="Email"
                    value={supplier.email}
                  />
                  <InfoRow
                    icon={<Map size={15} />}
                    label="Alamat"
                    value={supplier.alamat}
                  />
                  <InfoRow
                    icon={<Notebook size={15} />}
                    label="Keterangan"
                    value={supplier.keterangan}
                  />
                  <InfoRow
                    icon={<CircleDot size={15} />}
                    label="Status"
                    value={
                      supplier.isActive ? (
                        <span className="text-success font-medium">Aktif</span>
                      ) : (
                        <span className="text-danger font-medium">
                          Tidak Aktif
                        </span>
                      )
                    }
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
