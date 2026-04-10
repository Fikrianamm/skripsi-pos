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
import { PAYMENT_METHODS, MetodePembayaran } from "../../pos/components/types";

interface PaymentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  nomorOrder: string;
  sisaTagihan: number;
  onSuccess: () => void;
}

export function PaymentModal({
  isOpen,
  onOpenChange,
  orderId,
  nomorOrder,
  sisaTagihan,
  onSuccess,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [nominal, setNominal] = useState<number>(sisaTagihan);
  const [metode, setMetode] = useState<MetodePembayaran>("TUNAI");
  const [kasBankId, setKasBankId] = useState<string>("");
  const [keterangan, setKeterangan] = useState("");

  const { data: kasBankData } = useSWR("/api/finance/kas-bank", fetcher);
  const kasBanks: { id: string; namaRekening: string; jenisRekening: string; nomorRekening?: string }[] =
    kasBankData?.kasBanks ?? [];

  async function handleSubmit() {
    if (!kasBankId) {
      addToast({ title: "Validasi", description: "Pilih rekening tujuan", color: "warning" });
      return;
    }
    if (nominal <= 0) {
      addToast({ title: "Validasi", description: "Nominal harus lebih dari 0", color: "warning" });
      return;
    }
    if (nominal > sisaTagihan) {
      addToast({ title: "Validasi", description: `Nominal tidak boleh melebihi sisa tagihan (Rp ${sisaTagihan.toLocaleString("id-ID")})`, color: "warning" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/order/${orderId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nominal,
          metodePembayaran: metode,
          kasBankId,
          keterangan,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        addToast({ title: "Gagal", description: json.error, color: "danger" });
        return;
      }

      addToast({ title: "Berhasil", description: "Pembayaran telah dicatat", color: "success" });
      onSuccess();
    } catch {
      addToast({ title: "Error", description: "Terjadi kesalahan koneksi", color: "danger" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Tambah Pembayaran
              <span className="text-sm font-normal text-default-500">{nomorOrder}</span>
            </ModalHeader>
            <ModalBody>
              <div className="flex justify-between items-center px-3 py-2 bg-warning-50 text-warning-700 rounded-lg border border-warning-200">
                <span className="text-xs font-semibold">Sisa Tagihan</span>
                <span className="text-sm font-bold">Rp {sisaTagihan.toLocaleString("id-ID")}</span>
              </div>

              <FormattedNumberInput
                label="Nominal Pembayaran"
                value={nominal}
                onChange={(val) => {
                  const v = Number(val);
                  setNominal(v);
                }}
                isRequired
                isInvalid={nominal > sisaTagihan}
                errorMessage={nominal > sisaTagihan ? `Maksimal Rp ${sisaTagihan.toLocaleString("id-ID")}` : ""}
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Metode"
                  selectedKeys={[metode]}
                  onSelectionChange={(k) => setMetode(Array.from(k)[0] as MetodePembayaran)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.key}>{m.label}</SelectItem>
                  ))}
                </Select>

                <Select
                  label="Tujuan Kas/Bank"
                  placeholder="Pilih rekening"
                  selectedKeys={kasBankId ? [kasBankId] : []}
                  onSelectionChange={(k) => setKasBankId(Array.from(k)[0] as string)}
                  isRequired
                >
                  {kasBanks.map((kb) => (
                    <SelectItem key={kb.id} textValue={kb.namaRekening}>
                      {kb.namaRekening}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <Textarea
                label="Keterangan (opsional)"
                placeholder="Misal: Pelunasan sisa tagihan via BCA..."
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
                Simpan
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
