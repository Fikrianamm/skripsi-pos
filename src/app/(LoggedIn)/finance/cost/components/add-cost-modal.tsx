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
import { DatePicker } from "@heroui/date-picker";
import { getLocalTimeZone, today, CalendarDate } from "@internationalized/date";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";

interface AddCostModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddCostModal({ isOpen, onOpenChange, onSuccess }: AddCostModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [nama, setNama] = useState("");
  const [nominal, setNominal] = useState<number>(0);
  const [costCategoryId, setCostCategoryId] = useState("");
  const [kasBankId, setKasBankId] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [tanggal, setTanggal] = useState<CalendarDate | null>(today(getLocalTimeZone()));

  const { data: kasBankData } = useSWR("/api/finance/kas-bank", fetcher);
  const kasBanks: { id: string; namaRekening: string; jenisRekening: string }[] = kasBankData?.kasBanks ?? [];

  const { data: categoryData } = useSWR("/api/finance/cost-category", fetcher);
  const categories: { id: string; nama: string; jenisBeban: string }[] = categoryData?.categories ?? [];

  function resetForm() {
    setNama("");
    setNominal(0);
    setCostCategoryId("");
    setKasBankId("");
    setKeterangan("");
    setTanggal(today(getLocalTimeZone()));
  }

  async function handleSubmit() {
    if (!nama || !costCategoryId || nominal <= 0 || !kasBankId) {
      addToast({ title: "Validasi", description: "Mohon isi semua field wajib dengan benar.", color: "warning" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/finance/cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama,
          nominal,
          costCategoryId,
          kasBankId,
          keterangan,
          tanggal: tanggal ? tanggal.toString() : new Date().toISOString(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        addToast({ title: "Gagal", description: json.error, color: "danger" });
        return;
      }

      addToast({ title: "Sukses", description: "Pengeluaran berhasil dicatat", color: "success" });
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch {
      addToast({ title: "Error", description: "Gagal terhubung ke server", color: "danger" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetForm();
      }}
      size="xl"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Tambah Transaksi Pengeluaran / Biaya</ModalHeader>
            <ModalBody className="gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nama Pengeluaran"
                  placeholder="Mis. Gaji Tim Borongan, Belanja Jarum"
                  value={nama}
                  onValueChange={setNama}
                  isRequired
                />
                <FormattedNumberInput
                  label="Nominal Pengeluaran"
                  value={nominal}
                  onChange={(val) => setNominal(Number(val))}
                  isRequired
                  startContent={<span className="text-default-400 text-xs">Rp</span>}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Kategori Beban (Buku Besar)"
                  placeholder="Pilih kelompok beban"
                  selectedKeys={costCategoryId ? [costCategoryId] : []}
                  onSelectionChange={(k) => setCostCategoryId(Array.from(k)[0] as string)}
                  isRequired
                >
                  {categories.map((c) => (
                    <SelectItem key={c.id} textValue={c.nama}>
                      <div className="flex flex-col">
                        <span>{c.nama}</span>
                        <span className="text-xs text-default-400">{c.jenisBeban}</span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Sumber Dana (Kas/Bank)"
                  placeholder="Potong dari Rekening..."
                  selectedKeys={kasBankId ? [kasBankId] : []}
                  onSelectionChange={(k) => setKasBankId(Array.from(k)[0] as string)}
                  isRequired
                >
                  {kasBanks.map((kb) => (
                    <SelectItem key={kb.id} textValue={kb.namaRekening}>
                      {kb.namaRekening} ({kb.jenisRekening})
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  label="Tanggal Transaksi"
                  value={tanggal}
                  onChange={setTanggal}
                  isRequired
                />
              </div>

              <Textarea
                label="Keterangan Lanjutan (opsional)"
                placeholder="Rincian informasi pengeluaran..."
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
                Catat Pengeluaran
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
