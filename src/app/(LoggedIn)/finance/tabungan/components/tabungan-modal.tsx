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
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { addToast } from "@heroui/toast";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";

interface TabunganModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const BULAN = [
  { id: 1, label: "Januari" },
  { id: 2, label: "Februari" },
  { id: 3, label: "Maret" },
  { id: 4, label: "April" },
  { id: 5, label: "Mei" },
  { id: 6, label: "Juni" },
  { id: 7, label: "Juli" },
  { id: 8, label: "Agustus" },
  { id: 9, label: "September" },
  { id: 10, label: "Oktober" },
  { id: 11, label: "November" },
  { id: 12, label: "Desember" },
];

const TAHUN = Array.from({ length: 11 }, (_, i) => 2020 + i);

export function TabunganModal({ isOpen, onOpenChange, onSuccess }: TabunganModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [jenisTabunganId, setJenisTabunganId] = useState("");
  const [kasBankId, setKasBankId] = useState("");
  const [nominal, setNominal] = useState<number>(0);
  const [bulan, setBulan] = useState<number>(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [keterangan, setKeterangan] = useState("");

  const { data: jenisData } = useSWR("/api/finance/jenis-tabungan", fetcher);
  const jenisTabungans: any[] = jenisData?.jenisTabungans ?? [];

  const { data: kasBankData } = useSWR("/api/finance/kas-bank", fetcher);
  const kasBanks: any[] = kasBankData?.kasBanks ?? [];

  function resetForm() {
    setJenisTabunganId("");
    setKasBankId("");
    setNominal(0);
    setBulan(new Date().getMonth() + 1);
    setTahun(new Date().getFullYear());
    setKeterangan("");
  }

  async function handleSubmit() {
    if (!jenisTabunganId || !kasBankId || nominal <= 0 || !bulan || !tahun) {
      addToast({
        title: "Validasi Lolos",
        description: "Pastikan semua field bertanda * terisi dengan benar (termasuk nominal)",
        color: "warning",
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        jenisTabunganId,
        kasBankId,
        nominal,
        bulan,
        tahun,
        keterangan,
      };

      const res = await fetch("/api/finance/tabungan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        addToast({ title: "Gagal (Ditolak)", description: json.error, color: "danger" });
        return;
      }

      addToast({
        title: "Berhasil",
        description: "Alokasi tabungan sukses dicatat & Kas telah dipotong otomatis.",
        color: "success",
      });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch {
      addToast({ title: "Error", description: "Kesalahan server saat mencatat tabungan.", color: "danger" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Alokasi / Setor Tabungan</ModalHeader>
            <ModalBody className="gap-5">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Tujuan Tabungan (*)"
                  placeholder="Pilih Kategori Tabungan"
                  selectedKeys={jenisTabunganId ? [jenisTabunganId] : []}
                  onSelectionChange={(k) => setJenisTabunganId(Array.from(k)[0] as string)}
                  isRequired
                >
                  {jenisTabungans.map((j) => (
                    <SelectItem key={j.id} textValue={j.nama}>
                      {j.nama}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Sumber Dana / Potong Kas (*)"
                  placeholder="Pilih rekening debet"
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

              <FormattedNumberInput
                label="Nominal Alokasi (*)"
                value={nominal}
                onChange={(val) => setNominal(Number(val))}
                isRequired
                startContent={<span className="text-default-400 text-xs">Rp</span>}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Periode Bulan (*)"
                  selectedKeys={[bulan.toString()]}
                  onSelectionChange={(k) => setBulan(Number(Array.from(k)[0]))}
                  isRequired
                >
                  {BULAN.map((b) => (
                    <SelectItem key={b.id.toString()} textValue={b.label}>
                      {b.label}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Tahun (*)"
                  selectedKeys={[tahun.toString()]}
                  onSelectionChange={(k) => setTahun(Number(Array.from(k)[0]))}
                  isRequired
                >
                  {TAHUN.map((t) => (
                    <SelectItem key={t.toString()} textValue={t.toString()}>
                      {t.toString()}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <Textarea
                label="Keterangan Rinci (Opsional)"
                placeholder="Mis. Pencairan sisa laba proyek kemeja 120pcs ke Tabungan THR..."
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
                Alokasikan / Setor Dana
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
