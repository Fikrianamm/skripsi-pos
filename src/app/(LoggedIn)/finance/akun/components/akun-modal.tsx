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
import { Plus } from "lucide-react";

interface AkunModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: Record<string, any> | null;
}

const POSISI_NORMAL = ["DEBET", "KREDIT"];
const KELOMPOK_AKUN = [
  "AKTIVA_LANCAR",
  "KEWAJIBAN",
  "MODAL",
  "PENDAPATAN",
  "BEBAN_USAHA",
];

export function AkunModal({
  isOpen,
  onOpenChange,
  onSuccess,
  editData,
}: AkunModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [kodeAkun, setKodeAkun] = useState("");
  const [namaAkun, setNamaAkun] = useState("");
  const [kelompok, setKelompok] = useState("");
  const [posisiNormal, setPosisiNormal] = useState("");
  const [isActive, setIsActive] = useState(true);
  
  const [createKasBank, setCreateKasBank] = useState(false);

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
        setCreateKasBank(false);
      }
    }
  }, [isOpen, editData]);

  async function handleSubmit() {
    if (!namaAkun || !kelompok || !posisiNormal || (editData && !kodeAkun)) {
      addToast({
        title: "Validasi Lolos",
        description: "Lengkapi semua field bertanda *",
        color: "warning",
      });
      return;
    }

    setIsLoading(true);
    try {
      const isEdit = !!editData;
      const url = "/api/finance/akun";
      const method = isEdit ? "PATCH" : "POST";

      const payload: any = {
        id: isEdit ? editData.id : crypto.randomUUID(),
        kodeAkun,
        namaAkun,
        kelompok,
        posisiNormal,
      };

      if (isEdit) {
        payload.isActive = isActive;
      }

      if (!isEdit) {
        payload.createKasBank = createKasBank;
        // Backend akan menggunakan default "BANK" dan nomor kosong
      }

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

      addToast({
        title: "Sukses",
        description: `Akun berhasil ${isEdit ? "diperbarui" : "ditambahkan"}`,
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
    <>
      <Button
        color="primary"
        startContent={<Plus size={16} />}
        onPress={() => onOpenChange(true)}
        className="font-medium"
      >
        Tambah Akun
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {editData ? "Edit Master Akun" : "Tambah Akun (CoA)"}
              </ModalHeader>
              <ModalBody className="gap-4">
                <div className="flex flex-col gap-4">
                  {editData && (
                    <Input
                      label="Kode Akun"
                      placeholder="Mis. 1-001, 4-001"
                      value={kodeAkun}
                      onValueChange={setKodeAkun}
                      isRequired
                    />
                  )}

                  <Input
                    label="Nama Akun"
                    placeholder="Mis. Kas di BCA, Omset Konveksi"
                    value={namaAkun}
                    onValueChange={setNamaAkun}
                    isRequired
                  />

                  <Select
                    label="Kelompok Akun"
                    placeholder="Pilih kelompok..."
                    selectedKeys={kelompok ? [kelompok] : []}
                    onSelectionChange={(k) => setKelompok(Array.from(k)[0] as string)}
                    isRequired
                  >
                    {KELOMPOK_AKUN.map((k) => (
                      <SelectItem key={k}>{k.replace(/_/g, " ").toUpperCase()}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Posisi Normal"
                    placeholder="DEBET atau KREDIT"
                    selectedKeys={posisiNormal ? [posisiNormal] : []}
                    onSelectionChange={(k) =>
                      setPosisiNormal(Array.from(k)[0] as string)
                    }
                    isRequired
                  >
                    {POSISI_NORMAL.map((p) => (
                      <SelectItem key={p}>{p}</SelectItem>
                    ))}
                  </Select>

                  {editData && (
                    <div className="flex items-center justify-between mt-2 p-3 border border-default-200 rounded-lg bg-default-50">
                      <div>
                        <p className="font-semibold text-sm">Status Akun</p>
                        <p className="text-xs text-default-500">
                          {isActive ? "Akun ini aktif dan dapat digunakan" : "Akun ini dinonaktifkan"}
                        </p>
                      </div>
                      <Switch
                        size="sm"
                        color="success"
                        isSelected={isActive}
                        onValueChange={setIsActive}
                      />
                    </div>
                  )}
                  
                  {!editData && (
                    <div className="p-4 border rounded-xl bg-default-50 border-default-200 mt-2 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                         <div>
                            <p className="font-semibold text-sm">Buat Referensi Rekening Kas/Bank?</p>
                            <p className="text-xs text-default-500">Otomatis buat data master rekening untuk fitur pembayaran.</p>
                         </div>
                         <Switch isSelected={createKasBank} onValueChange={setCreateKasBank} size="sm" />
                      </div>
                    </div>
                  )}
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
                  Simpan
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

