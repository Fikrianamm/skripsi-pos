/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
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
  Textarea,
} from "@heroui/react";
import { addToast } from "@heroui/toast";

interface JenisTabunganModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function JenisTabunganModal({
  isOpen,
  onOpenChange,
  onSuccess,
}: JenisTabunganModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [nama, setNama] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [akunId, setAkunId] = useState("");

  const { data: akunData } = useSWR("/api/finance/akun", fetcher);
  const akuns: any[] = akunData?.akuns ?? [];

  function resetForm() {
    setNama("");
    setKeterangan("");
    setAkunId("");
  }

  async function handleSubmit() {
    if (!nama || !akunId) {
      addToast({
        title: "Validasi Lolos",
        description: "Nama dan Akun Penampung wajib diisi",
        color: "warning",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/finance/jenis-tabungan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, keterangan, akunId }),
      });

      const json = await res.json();
      if (!res.ok) {
        addToast({ title: "Gagal", description: json.error, color: "danger" });
        return;
      }

      addToast({
        title: "Sukses",
        description: "Master kategori tabungan berhasil disimpan",
        color: "success",
      });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch {
      addToast({
        title: "Error",
        description: "Terjadi kesalahan pada server",
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
            <ModalHeader>Tambah Kategori Tabungan Baru</ModalHeader>
            <ModalBody className="gap-4">
              <Input
                label="Nama Kategori"
                placeholder="Mis. Tabungan THR, Dana Darurat"
                value={nama}
                onValueChange={setNama}
                isRequired
              />
              <Select
                label="Akun Buku Besar Kategori Tabungan (Asset/Aktiva)"
                placeholder="Pilih Akun"
                selectedKeys={akunId ? [akunId] : []}
                onSelectionChange={(k) =>
                  setAkunId(Array.from(k)[0] as string)
                }
                isRequired
              >
                {akuns.map((a) => (
                  <SelectItem key={a.id} textValue={`${a.kodeAkun} - ${a.namaAkun}`}>
                    {a.kodeAkun} - {a.namaAkun}
                  </SelectItem>
                ))}
              </Select>
              <Textarea
                label="Keterangan (opsional)"
                placeholder="Catatan tambahan..."
                value={keterangan}
                onValueChange={setKeterangan}
                minRows={2}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" color="danger" onPress={onClose}>
                Batal
              </Button>
              <Button color="primary" onPress={handleSubmit} isLoading={isLoading}>
                Simpan Master
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
