/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
} from "@heroui/react";
import { addToast } from "@heroui/toast";

interface KasBankModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: Record<string, any> | null;
}

const JENIS_REKENING = ["BANK", "CASH", "EWALLET"];

export function KasBankModal({
  isOpen,
  onOpenChange,
  onSuccess,
  editData,
}: KasBankModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [namaRekening, setNamaRekening] = useState("");
  const [jenisRekening, setJenisRekening] = useState("BANK");
  const [nomorRekening, setNomorRekening] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isOpen && editData) {
      setNamaRekening(editData.namaRekening || "");
      setJenisRekening(editData.jenisRekening || "BANK");
      setNomorRekening(editData.nomorRekening || "");
      setIsActive(editData.isActive ?? true);
    }
  }, [isOpen, editData]);

  async function handleSubmit() {
    if (!namaRekening) {
      addToast({
        title: "Validasi Lolos",
        description: "Nama rekening wajib diisi.",
        color: "warning",
      });
      return;
    }

    if (!editData) return; // Hanya support EDIT saja dari tabel ini

    setIsLoading(true);
    try {
      const url = "/api/finance/kas-bank";
      const payload = {
        id: editData.id,
        namaRekening,
        jenisRekening,
        nomorRekening,
        isActive
      };

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        addToast({ title: "Gagal", description: json.error, color: "danger" });
        return;
      }

      addToast({
        title: "Sukses",
        description: "Data rekening berhasil diperbarui.",
        color: "success",
      });
      onSuccess();
      onOpenChange(false);
    } catch {
      addToast({
        title: "Error",
        description: "Terjadi kesalahan server",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              Edit Rekening Kas/Bank
            </ModalHeader>
            <ModalBody className="gap-4">
               {editData && (
                  <div className="bg-primary-50 p-3 rounded-lg border border-primary-100 flex items-center justify-between mb-2">
                     <div>
                        <p className="text-xs font-semibold text-primary-700">Akun Buku Besar Terhubung</p>
                        <p className="text-sm font-medium text-primary-800">{editData.akun?.kodeAkun} - {editData.akun?.namaAkun}</p>
                     </div>
                  </div>
               )}
              <div className="flex flex-col gap-4">
                <Input
                  label="Nama Rekening"
                  placeholder="Mis. BCA Utama"
                  value={namaRekening}
                  onValueChange={setNamaRekening}
                  isRequired
                />

                <Select
                  label="Jenis Rekening"
                  placeholder="CASH / BANK"
                  selectedKeys={jenisRekening ? [jenisRekening] : []}
                  onSelectionChange={(k) =>
                    setJenisRekening(Array.from(k)[0] as string)
                  }
                  isRequired
                >
                  {JENIS_REKENING.map((p) => (
                    <SelectItem key={p}>{p}</SelectItem>
                  ))}
                </Select>

                <Input
                  label="Nomor Rekening"
                  placeholder="Mis. 1234567890 (opsional)"
                  value={nomorRekening}
                  onValueChange={setNomorRekening}
                />

                <div className="flex items-center justify-between p-3 border border-default-200 rounded-xl mt-2">
                   <div>
                      <p className="text-sm font-semibold">Status Rekening</p>
                      <p className="text-xs text-default-500">Nonaktifkan jika rekening ini sudah tidak digunakan lagi.</p>
                   </div>
                   <Switch isSelected={isActive} onValueChange={setIsActive} size="sm" />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" color="danger" onPress={onClose}>
                Batal
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isLoading}
              >
                Simpan Perubahan
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
