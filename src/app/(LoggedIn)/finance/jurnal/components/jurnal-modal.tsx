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
import { DatePicker } from "@heroui/date-picker";
import { getLocalTimeZone, today, CalendarDate } from "@internationalized/date";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";

interface JurnalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function JurnalModal({ isOpen, onOpenChange, onSuccess }: JurnalModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [keterangan, setKeterangan] = useState("");
  const [nominal, setNominal] = useState<number>(0);
  const [akunDebetId, setAkunDebetId] = useState("");
  const [akunKreditId, setAkunKreditId] = useState("");
  const [tanggal, setTanggal] = useState<CalendarDate | null>(today(getLocalTimeZone()));

  const { data: akunData } = useSWR("/api/finance/akun", fetcher);
  const akuns: { id: string; namaAkun: string; kodeAkun: string; kelompok: string }[] = akunData?.akuns ?? [];

  function resetForm() {
    setKeterangan("");
    setNominal(0);
    setAkunDebetId("");
    setAkunKreditId("");
    setTanggal(today(getLocalTimeZone()));
  }

  async function handleSubmit() {
    if (!keterangan || !akunDebetId || !akunKreditId || nominal <= 0) {
      addToast({ title: "Validasi Lolos", description: "Lengkapi semua field bertanda *", color: "warning" });
      return;
    }

    if (akunDebetId === akunKreditId) {
      addToast({ title: "Validasi Berhenti", description: "Akun Debet tidak boleh sama dengan Akun Kredit", color: "danger" });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        tanggal: tanggal ? tanggal.toString() : new Date().toISOString(),
        keterangan,
        akunDebetId,
        akunKreditId,
        nominal,
      };

      const res = await fetch("/api/finance/jurnal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        addToast({ title: "Gagal", description: json.error, color: "danger" });
        return;
      }

      addToast({ title: "Sukses", description: "Jurnal manual berhasil tersimpan", color: "success" });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch {
      addToast({ title: "Error", description: "Terjadi kesalahan koneksi saat save jurnal", color: "danger" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="xl">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Catat Jurnal Umum Manual</ModalHeader>
            <ModalBody className="gap-4">
              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  label="Tanggal Transaksi"
                  value={tanggal}
                  onChange={setTanggal}
                  isRequired
                />
                <FormattedNumberInput
                  label="Nominal Jurnal"
                  value={nominal}
                  onChange={(val) => setNominal(Number(val))}
                  isRequired
                  startContent={<span className="text-default-400 text-xs">Rp</span>}
                />
              </div>

              <div className="flex flex-col gap-4 bg-primary-50 p-4 rounded-xl border border-primary-100">
                <h3 className="text-sm font-semibold text-primary-800">Pemetaan Transaksi Double-Entry</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Akun (+ Debet)"
                    description="Akun yang menerima nilai"
                    placeholder="Pilih Akun"
                    selectedKeys={akunDebetId ? [akunDebetId] : []}
                    onSelectionChange={(k) => setAkunDebetId(Array.from(k)[0] as string)}
                    isRequired
                    classNames={{ label: "text-success-600 font-bold" }}
                  >
                    {akuns.map((a) => (
                      <SelectItem key={a.id} textValue={`${a.kodeAkun} - ${a.namaAkun}`}>
                        {a.kodeAkun} - {a.namaAkun}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Akun (- Kredit)"
                    description="Akun asal / pengeluar nilai"
                    placeholder="Pilih Akun"
                    selectedKeys={akunKreditId ? [akunKreditId] : []}
                    onSelectionChange={(k) => setAkunKreditId(Array.from(k)[0] as string)}
                    isRequired
                    classNames={{ label: "text-danger-600 font-bold" }}
                  >
                    {akuns.map((a) => (
                      <SelectItem key={a.id} textValue={`${a.kodeAkun} - ${a.namaAkun}`}>
                        {a.kodeAkun} - {a.namaAkun}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>

              <Textarea
                label="Keterangan Jurnal"
                placeholder="Mis. Penyesuaian persediaan bulan ini, setoran modal investasi tambahan..."
                value={keterangan}
                onValueChange={setKeterangan}
                isRequired
                minRows={2}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" color="danger" onPress={onClose}>
                Batal
              </Button>
              <Button color="primary" onPress={handleSubmit} isLoading={isLoading}>
                Catat Jurnal Manual
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
