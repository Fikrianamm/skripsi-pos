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
import { Plus } from "lucide-react";

interface AddCostModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddCostModal({
  isOpen,
  onOpenChange,
  onSuccess,
}: AddCostModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [nama, setNama] = useState("");
  const [nominal, setNominal] = useState<number>(0);
  const [akunId, setAkunId] = useState("");
  const [kasBankId, setKasBankId] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [tanggal, setTanggal] = useState<CalendarDate | null>(
    today(getLocalTimeZone()),
  );

  const { data: kasBankData } = useSWR("/api/finance/kas-bank", fetcher);
  const kasBanks: {
    id: string;
    namaRekening: string;
    jenisRekening: string;
  }[] = kasBankData?.kasBanks ?? [];

  // Ambil semua akun lalu filter hanya kelompok BEBAN_USAHA di frontend
  const { data: akunData } = useSWR("/api/finance/akun?isActive=true", fetcher);
  const akunBeban: { id: string; namaAkun: string; kelompok: string }[] = (
    akunData?.akuns ?? []
  ).filter((a: { kelompok: string }) => a.kelompok === "BEBAN_USAHA");

  function resetForm() {
    setNama("");
    setNominal(0);
    setAkunId("");
    setKasBankId("");
    setKeterangan("");
    setTanggal(today(getLocalTimeZone()));
  }

  async function handleSubmit() {
    if (!nama || !akunId || nominal <= 0 || !kasBankId) {
      addToast({
        title: "Validasi",
        description: "Mohon isi semua field wajib dengan benar.",
        color: "warning",
      });
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
          akunId,
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

      addToast({
        title: "Sukses",
        description: "Pengeluaran berhasil dicatat",
        color: "success",
      });
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch {
      addToast({
        title: "Error",
        description: "Gagal terhubung ke server",
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
        Catat Pengeluaran
      </Button>
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
                    startContent={
                      <span className="text-default-400 text-xs">Rp</span>
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Akun Beban (Buku Besar)"
                    placeholder="Pilih akun beban"
                    selectedKeys={akunId ? [akunId] : []}
                    onSelectionChange={(k) =>
                      setAkunId(Array.from(k)[0] as string)
                    }
                    isRequired
                  >
                    {akunBeban.map((a) => (
                      <SelectItem key={a.id} textValue={a.namaAkun}>
                        {a.namaAkun}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Sumber Dana (Kas/Bank)"
                    placeholder="Potong dari Rekening..."
                    selectedKeys={kasBankId ? [kasBankId] : []}
                    onSelectionChange={(k) =>
                      setKasBankId(Array.from(k)[0] as string)
                    }
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
                <Button
                  color="primary"
                  onPress={handleSubmit}
                  isLoading={isLoading}
                >
                  Catat Pengeluaran
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
