"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/react";
import { Karyawan } from "@/types/types";
import { Briefcase, Phone, User } from "lucide-react";

export default function ViewKaryawanModal({
  karyawan,
  isOpen,
  onOpenChange,
}: {
  karyawan: Karyawan;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Modal
      isOpen={isOpen}
      placement="bottom-center"
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Detail Karyawan</ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-default-100 text-default-600 mt-0.5">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-default-400 mb-0.5">Nama</p>
                    <p className="text-sm font-medium">{karyawan.nama}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-default-100 text-default-600 mt-0.5">
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-default-400 mb-0.5">Posisi</p>
                    <p className="text-sm font-medium">
                      {karyawan.posisi || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-default-100 text-default-600 mt-0.5">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-default-400 mb-0.5">Nomor HP</p>
                    <p className="text-sm font-medium">
                      {karyawan.nomorHp || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <p className="text-sm text-default-500">Status:</p>
                  <Chip
                    color={karyawan.isActive ? "success" : "danger"}
                    variant="dot"
                    className={
                      karyawan.isActive
                        ? "text-success bg-success/10 border-success/20"
                        : "text-danger bg-danger/10 border-danger/20"
                    }
                  >
                    {karyawan.isActive ? "Aktif" : "Tidak Aktif"}
                  </Chip>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Tutup
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
