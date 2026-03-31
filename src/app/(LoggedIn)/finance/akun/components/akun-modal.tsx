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

interface AkunModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: Record<string, any> | null;
}

const KELOMPOK_AKUN = [
  "AKTIVA_LANCAR",
  "AKTIVA_TETAP",
  "KEWAJIBAN",
  "MODAL",
  "PENDAPATAN",
  "BEBAN_HPP",
  "BEBAN_MARKETING",
  "BEBAN_GAJI",
  "BEBAN_ADMINISTRASI",
];

const POSISI_NORMAL = ["DEBET", "KREDIT"];

export function AkunModal({ isOpen, onOpenChange, onSuccess, editData }: AkunModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [kodeAkun, setKodeAkun] = useState("");
  const [namaAkun, setNamaAkun] = useState("");
  const [kelompok, setKelompok] = useState("");
  const [posisiNormal, setPosisiNormal] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setKodeAkun(editData.kodeAkun || "");
        setNamaAkun(editData.namaAkun || "");
        setKelompok(editData.kelompok || "");
        setPosisiNormal(editData.posisiNormal || "");
        setIsActive(editData.isActive ?? true);
      } else {
        setKodeAkun("");
        setNamaAkun("");
        setKelompok("");
        setPosisiNormal("");
        setIsActive(true);
      }
    }
  }, [isOpen, editData]);

  async function handleSubmit() {
    if (!kodeAkun || !namaAkun || !kelompok || !posisiNormal) {
      addToast({ title: "Validasi Lolos", description: "Lengkapi semua field bertanda *", color: "warning" });
      return;
    }

    setIsLoading(true);
    try {
      const isEdit = !!editData;
      const url = "/api/finance/akun";
      const method = isEdit ? "PATCH" : "POST";
      
      const payload = {
        id: isEdit ? editData.id : crypto.randomUUID(),
        kodeAkun,
        namaAkun,
        kelompok,
        posisiNormal,
        isActive,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        addToast({ title: "Gagal", description: json.error, color: "danger" });
        return;
      }

      addToast({ title: "Sukses", description: `Akun berhasil ${isEdit ? "diperbarui" : "ditambahkan"}`, color: "success" });
      onSuccess();
      onOpenChange(false);
    } catch {
      addToast({ title: "Error", description: "Terjadi kesalahan server", color: "danger" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>{editData ? "Edit Master Akun" : "Tambah Akun (CoA)"}</ModalHeader>
            <ModalBody className="gap-4">
              <div className="flex flex-col gap-4">
                <Input
                  label="Kode Akun"
                  placeholder="Mis. 1-001, 4-001"
                  value={kodeAkun}
                  onValueChange={setKodeAkun}
                  isRequired
                />
                <Input
                  label="Nama Akun"
                  placeholder="Mis. Kas di BCA, Omset Konveksi"
                  value={namaAkun}
                  onValueChange={setNamaAkun}
                  isRequired
                />
                
                <Select
                  label="Kelompok Akun"
                  placeholder="Pilih Kelompok Laporan"
                  selectedKeys={kelompok ? [kelompok] : []}
                  onSelectionChange={(k) => setKelompok(Array.from(k)[0] as string)}
                  isRequired
                >
                  {KELOMPOK_AKUN.map((k) => (
                    <SelectItem key={k} textValue={k.replace(/_/g, " ")}>
                      {k.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Posisi Normal"
                  placeholder="DEBET atau KREDIT"
                  selectedKeys={posisiNormal ? [posisiNormal] : []}
                  onSelectionChange={(k) => setPosisiNormal(Array.from(k)[0] as string)}
                  isRequired
                >
                  {POSISI_NORMAL.map((p) => (
                    <SelectItem key={p}>{p}</SelectItem>
                  ))}
                </Select>

                {editData && (
                  <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg">
                     <span className="text-sm">Status Aktif</span>
                     <Switch isSelected={isActive} onValueChange={setIsActive} size="sm" />
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" color="danger" onPress={onClose}>
                Batal
              </Button>
              <Button color="primary" onPress={handleSubmit} isLoading={isLoading}>
                Simpan
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
