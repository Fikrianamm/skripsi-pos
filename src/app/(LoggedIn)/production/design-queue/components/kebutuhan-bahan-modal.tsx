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
  Input,
  Select,
  SelectItem,
  Chip,
  Divider,
} from "@heroui/react";
import { Plus, Trash2, Lock, Package, AlertCircle } from "lucide-react";
import { addToast } from "@heroui/toast";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
import { DesignOrderItem } from "./types";

interface BahanBakuOption {
  id: string;
  nama: string;
  stok: number | string;
  unit?: { id: string; nama: string };
}

interface BahanRow {
  bahanBakuId: string;
  jumlahDibutuhkan: string;
  satuan: string;
}

interface KebutuhanBahanModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  nomorOrder: string;
  orderItem: DesignOrderItem | null;
  onSuccess: () => void;
}

export function KebutuhanBahanModal({
  isOpen,
  onOpenChange,
  orderId,
  nomorOrder,
  orderItem,
  onSuccess,
}: KebutuhanBahanModalProps) {
  const { data: bahanBakuData, isLoading: isLoadingBahan } = useSWR<{
    results: BahanBakuOption[];
  }>(isOpen ? "/api/admin/bahan-baku?all=true&isActive=true" : null, fetcher);

  const bahanBakuOptions = bahanBakuData?.results || [];

  const [rows, setRows] = useState<BahanRow[]>([
    { bahanBakuId: "", jumlahDibutuhkan: "1", satuan: "Pcs" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Populate existing data if available
  useEffect(() => {
    if (orderItem && isOpen) {
      if (
        orderItem.kebutuhanBahanCustom &&
        orderItem.kebutuhanBahanCustom.length > 0
      ) {
        setRows(
          orderItem.kebutuhanBahanCustom.map((kbc) => ({
            bahanBakuId: kbc.bahanBakuId,
            jumlahDibutuhkan: String(kbc.jumlahDibutuhkan),
            satuan: kbc.satuan || kbc.bahanBaku?.unit?.nama || "Pcs",
          })),
        );
      } else {
        setRows([{ bahanBakuId: "", jumlahDibutuhkan: "1", satuan: "Pcs" }]);
      }
      setErrorMsg("");
    }
  }, [orderItem, isOpen]);

  const handleBahanChange = (index: number, bahanBakuId: string) => {
    const selected = bahanBakuOptions.find((b) => b.id === bahanBakuId);
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        bahanBakuId,
        satuan: selected?.unit?.nama || "Pcs",
      };
      return updated;
    });
  };

  const handleJumlahChange = (index: number, jumlahDibutuhkan: string) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], jumlahDibutuhkan };
      return updated;
    });
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { bahanBakuId: "", jumlahDibutuhkan: "1", satuan: "Pcs" },
    ]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) {
      setRows([{ bahanBakuId: "", jumlahDibutuhkan: "1", satuan: "Pcs" }]);
      return;
    }
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (onClose: () => void) => {
    setErrorMsg("");
    if (!orderItem) return;

    // Validasi kelengkapan
    const invalidRow = rows.find(
      (r) => !r.bahanBakuId || !r.jumlahDibutuhkan || Number(r.jumlahDibutuhkan) <= 0,
    );
    if (invalidRow) {
      setErrorMsg("Semua baris bahan baku harus dipilih dan memiliki jumlah > 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/order/${orderId}/kebutuhan-bahan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderItemId: orderItem.id,
          bahan: rows.map((r) => ({
            bahanBakuId: r.bahanBakuId,
            jumlahDibutuhkan: Number(r.jumlahDibutuhkan),
            satuan: r.satuan,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || "Gagal mengunci bahan custom.");
        return;
      }

      addToast({
        title: "Bahan Dikunci & Dikirim",
        description: `Bahan custom untuk ${orderItem.nama} berhasil disimpan. Kasir dapat melakukan negosiasi harga.`,
        color: "success",
      });

      onClose();
      onSuccess();
    } catch (err: any) {
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 pb-2">
              <div className="flex items-center gap-2">
                <Package className="text-primary" size={20} />
                <span className="font-semibold text-base">
                  Kebutuhan Bahan Baku Custom
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
              <div className="bg-primary-50 text-primary-800 p-3 rounded-lg text-xs leading-relaxed">
                Tentukan bahan baku dari katalog beserta jumlah yang dibutuhkan
                untuk pesanan custom ini. Sisa stok ditampilkan sebagai panduan
                ketersediaan.
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-danger-50 text-danger-700 rounded-lg text-xs">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-3">
                {rows.map((row, idx) => {
                  const selectedBahan = bahanBakuOptions.find(
                    (b) => b.id === row.bahanBakuId,
                  );
                  const currentStok = selectedBahan
                    ? Number(selectedBahan.stok)
                    : null;
                  const needed = Number(row.jumlahDibutuhkan) || 0;
                  const isLowStock = currentStok !== null && currentStok < needed;

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-default-50 rounded-xl border border-default-200 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-default-600">
                          Bahan #{idx + 1}
                        </span>
                        {rows.length > 1 && (
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            className="h-6 w-6 min-w-6"
                            onPress={() => removeRow(idx)}
                          >
                            <Trash2 size={13} />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <div className="md:col-span-8">
                          <Select
                            size="sm"
                            label="Pilih Bahan Baku"
                            placeholder="Pilih dari katalog bahan..."
                            selectedKeys={
                              row.bahanBakuId ? [row.bahanBakuId] : []
                            }
                            onChange={(e) =>
                              handleBahanChange(idx, e.target.value)
                            }
                            isLoading={isLoadingBahan}
                            variant="bordered"
                            classNames={{ label: "text-xs" }}
                          >
                            {bahanBakuOptions.map((b) => (
                              <SelectItem key={b.id} textValue={b.nama}>
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-xs">
                                    {b.nama}
                                  </span>
                                  <span className="text-[11px] text-default-400">
                                    Stok: {b.stok} {b.unit?.nama || "Pcs"}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </Select>
                        </div>

                        <div className="md:col-span-4 flex items-center gap-2">
                          <Input
                            size="sm"
                            type="number"
                            label="Jumlah Butuh"
                            placeholder="1"
                            value={row.jumlahDibutuhkan}
                            onValueChange={(val) =>
                              handleJumlahChange(idx, val)
                            }
                            endContent={
                              <span className="text-xs text-default-400 shrink-0">
                                {row.satuan}
                              </span>
                            }
                            variant="bordered"
                            classNames={{ label: "text-xs" }}
                          />
                        </div>
                      </div>

                      {selectedBahan && (
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-default-100">
                          <div className="flex items-center gap-2">
                            <span className="text-default-500">Sisa Stok:</span>
                            <Chip
                              size="sm"
                              variant="flat"
                              color={isLowStock ? "danger" : "success"}
                              className="h-5 text-[11px]"
                            >
                              {selectedBahan.stok}{" "}
                              {selectedBahan.unit?.nama || "Pcs"}
                            </Chip>
                          </div>
                          {isLowStock && (
                            <span className="text-danger-600 font-medium text-[11px]">
                              ⚠️ Stok bahan tidak mencukupi!
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <Button
                size="sm"
                variant="flat"
                color="primary"
                startContent={<Plus size={14} />}
                onPress={addRow}
                className="w-full"
              >
                Tambah Bahan Baku Lain
              </Button>
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
                color="primary"
                startContent={<Lock size={14} />}
                onPress={() => handleSubmit(onClose)}
                isLoading={isSubmitting}
              >
                Kunci & Kirim ke Kasir
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
