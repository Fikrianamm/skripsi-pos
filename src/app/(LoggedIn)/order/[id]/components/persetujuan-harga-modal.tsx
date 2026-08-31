/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Divider,
} from "@heroui/react";
import { DollarSign, Package, Check, AlertCircle } from "lucide-react";
import { addToast } from "@heroui/toast";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { formatRupiah } from "@/lib/func";
import { OrderItem } from "./types";

interface PersetujuanHargaModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  nomorOrder: string;
  orderItem: OrderItem | null;
  onSuccess: () => void;
}

export function PersetujuanHargaModal({
  isOpen,
  onOpenChange,
  orderId,
  nomorOrder,
  orderItem,
  onSuccess,
}: PersetujuanHargaModalProps) {
  const [harga, setHarga] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (orderItem && isOpen) {
      setHarga(Number(orderItem.harga) || 0);
      setErrorMsg("");
    }
  }, [orderItem, isOpen]);

  const qty = Number(orderItem?.qty || 1);
  const totalSubtotal = harga * qty;

  const handleSubmit = async (onClose: () => void) => {
    setErrorMsg("");
    if (!orderItem) return;

    if (harga <= 0) {
      setErrorMsg("Harga kesepakatan wajib diisi dengan nominal lebih dari 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/order/${orderId}/harga`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderItemId: orderItem.id,
          harga,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || "Gagal menyepakati harga.");
        return;
      }

      addToast({
        title: "Harga Disepakati",
        description: `Harga untuk item ${orderItem.nama} berhasil disepakati (${formatRupiah(harga)} / unit).`,
        color: "success",
      });

      onClose();
      onSuccess();
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="lg"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 pb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="text-success" size={20} />
                <span className="font-semibold text-base">
                  Persetujuan Harga Jasa / Custom
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-default-500 font-mono">
                <span>{nomorOrder}</span>
                <span>•</span>
                <span className="font-sans font-medium text-default-700">
                  {orderItem?.nama} (Qty: {orderItem?.qty})
                </span>
              </div>
            </ModalHeader>

            <Divider />

            <ModalBody className="py-4 space-y-4">
              {/* Bahan Baku yang Telah Dikunci */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-default-700 flex items-center gap-1.5">
                    <Package size={14} className="text-primary" />
                    Bahan Baku yang Dikunci Desainer
                  </span>
                  <Chip size="sm" variant="flat" color="primary" className="h-5 text-[11px]">
                    {orderItem?.kebutuhanBahanCustom?.length || 0} Bahan Terkunci
                  </Chip>
                </div>

                {orderItem?.kebutuhanBahanCustom &&
                orderItem.kebutuhanBahanCustom.length > 0 ? (
                  <div className="rounded-xl border border-default-200 overflow-hidden divide-y divide-default-100 bg-default-50">
                    {orderItem.kebutuhanBahanCustom.map((kbc) => (
                      <div
                        key={kbc.id}
                        className="p-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-medium text-default-800">
                            {kbc.bahanBaku?.nama || "Bahan Baku"}
                          </p>
                          <p className="text-[11px] text-default-400">
                            Sisa Stok: {kbc.bahanBaku?.stok}{" "}
                            {kbc.bahanBaku?.unit?.nama || kbc.satuan}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-primary">
                            {kbc.jumlahDibutuhkan} {kbc.satuan}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-default-400 italic">
                    Belum ada bahan baku yang dikunci oleh desainer.
                  </p>
                )}
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-danger-50 text-danger-700 rounded-lg text-xs">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form Input Harga Deal */}
              <div className="space-y-3 pt-2 border-t border-default-100">
                <div>
                  <label className="block text-xs font-medium text-default-700 mb-1.5">
                    Harga Jual Satuan (Deal Customer)
                  </label>
                  <FormattedNumberInput
                    value={harga}
                    onChange={(val) => setHarga(val)}
                    placeholder="Masukkan nominal harga jual..."
                    prefix="Rp"
                  />
                  <p className="text-[11px] text-default-400 mt-1">
                    Masukkan nominal harga jual final yang disepakati dengan
                    customer.
                  </p>
                </div>

                <div className="p-3 bg-primary-50/60 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-medium text-primary-900">
                    Subtotal Item ({qty} pcs × {formatRupiah(harga)}):
                  </span>
                  <span className="text-sm font-bold text-primary-700">
                    {formatRupiah(totalSubtotal)}
                  </span>
                </div>
              </div>
            </ModalBody>

            <Divider />

            <ModalFooter className="flex items-center justify-between">
              <Button
                size="sm"
                variant="light"
                onPress={onClose}
                isDisabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                size="sm"
                color="success"
                startContent={<Check size={14} />}
                onPress={() => handleSubmit(onClose)}
                isLoading={isSubmitting}
                isDisabled={harga <= 0}
              >
                Konfirmasi & Sepakati Harga
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
