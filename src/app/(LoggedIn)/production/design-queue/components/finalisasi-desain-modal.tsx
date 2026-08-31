/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Divider,
  Select,
  SelectItem,
  Input,
  Chip,
  Switch,
} from "@heroui/react";
import { Package, Lock, Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { addToast } from "@heroui/toast";

interface CustomItem {
  id: string;
  nama: string;
  qty: string | number;
  kebutuhanBahanCustom?: {
    bahanBakuId: string;
    jumlahDibutuhkan: string | number;
    satuan: string;
  }[];
}

interface MaterialRow {
  bahanBakuId: string;
  jumlahDibutuhkan: string;
  satuan: string;
}

interface FinalisasiDesainModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  nomorOrder: string;
  customItems: CustomItem[];
  onSuccess: () => void;
}

export function FinalisasiDesainModal({
  isOpen,
  onOpenChange,
  orderId,
  nomorOrder,
  customItems,
  onSuccess,
}: FinalisasiDesainModalProps) {
  const { data: bahanBakuData, isLoading: isLoadingBahan } = useSWR(
    isOpen ? "/api/admin/bahan-baku?limit=1000" : null,
    fetcher,
  );
  const bahanBakuOptions: any[] = bahanBakuData?.results || [];

  const [materialsByItem, setMaterialsByItem] = useState<Record<string, MaterialRow[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Initialize materials state when modal opens, pre-loading existing items
  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      const initial: Record<string, MaterialRow[]> = {};
      customItems.forEach(item => {
        if (item.kebutuhanBahanCustom && item.kebutuhanBahanCustom.length > 0) {
          initial[item.id] = item.kebutuhanBahanCustom.map(k => ({
            bahanBakuId: k.bahanBakuId,
            jumlahDibutuhkan: String(k.jumlahDibutuhkan),
            satuan: k.satuan || "",
          }));
        } else {
          initial[item.id] = [{ bahanBakuId: "", jumlahDibutuhkan: "", satuan: "" }];
        }
      });
      setMaterialsByItem(initial);
    }
  }, [isOpen, customItems]);

  const addRow = (itemId: string) => {
    setMaterialsByItem(prev => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), { bahanBakuId: "", jumlahDibutuhkan: "", satuan: "" }]
    }));
  };

  const removeRow = (itemId: string, index: number) => {
    setMaterialsByItem(prev => {
      const rows = prev[itemId] ? [...prev[itemId]] : [];
      if (rows.length > 1) {
        rows.splice(index, 1);
      }
      return { ...prev, [itemId]: rows };
    });
  };

  const updateRow = (itemId: string, index: number, field: keyof MaterialRow, value: string) => {
    setMaterialsByItem(prev => {
      const rows = prev[itemId] ? [...prev[itemId]] : [];
      if (rows[index]) {
        rows[index] = { ...rows[index], [field]: value };
        if (field === "bahanBakuId") {
          const selected = bahanBakuOptions.find(b => b.id === value);
          if (selected?.unit?.nama) {
            rows[index].satuan = selected.unit.nama;
          }
        }
      }
      return { ...prev, [itemId]: rows };
    });
  };

  const handleSubmit = async (onClose: () => void) => {
    setErrorMsg("");

    // Validation
    const materialsPayload: any[] = [];
    for (const item of customItems) {
      const rows = materialsByItem[item.id] || [];
      const validRows = rows.filter(r => r.bahanBakuId && Number(r.jumlahDibutuhkan) > 0);
      
      if (validRows.length === 0) {
        setErrorMsg(`Item "${item.nama}" harus memiliki minimal 1 bahan baku dengan jumlah valid.`);
        return;
      }
      
      materialsPayload.push({
        orderItemId: item.id,
        bahan: validRows.map(r => ({
          bahanBakuId: r.bahanBakuId,
          jumlahDibutuhkan: Number(r.jumlahDibutuhkan),
          satuan: r.satuan,
        }))
      });
    }

    setIsSubmitting(true);
    try {
      const payload = {
        materials: materialsPayload
      };

      const res = await fetch(`/api/order/${orderId}/finalisasi-desain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || "Gagal menyimpan data.");
        return;
      }

      addToast({
        title: "Berhasil",
        description: "Kebutuhan bahan baku berhasil disimpan.",
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
      size="3xl"
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
              </div>
            </ModalHeader>

            <Divider />

            <ModalBody className="py-4 space-y-5">
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-danger-50 text-danger-700 rounded-lg text-xs">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <h3 className="font-semibold text-sm">Daftar Bahan Baku per Item</h3>
                {customItems.length === 0 ? (
                  <p className="text-xs text-default-500 italic">Tidak ada item pesanan custom yang memerlukan bahan baku.</p>
                ) : (
                  customItems.map((item) => {
                    const rows = materialsByItem[item.id] || [];
                    return (
                      <div key={item.id} className="border border-default-200 rounded-xl overflow-hidden">
                        <div className="bg-default-100/50 px-3 py-2 flex items-center justify-between border-b border-default-200">
                          <span className="font-medium text-xs text-default-700">{item.nama} ×{item.qty}</span>
                        </div>
                        <div className="p-3 space-y-3 bg-default-50/30">
                          {rows.map((row, idx) => {
                            const selectedBahan = bahanBakuOptions.find((b) => b.id === row.bahanBakuId);
                            const currentStok = selectedBahan ? Number(selectedBahan.stok) : null;
                            const needed = Number(row.jumlahDibutuhkan) || 0;
                            const isLowStock = currentStok !== null && currentStok < needed;

                            return (
                              <div key={idx} className="flex flex-col gap-2 p-2 bg-white rounded-lg border border-default-100 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-semibold text-default-500 uppercase tracking-wider">Bahan #{idx + 1}</span>
                                  {rows.length > 1 && (
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      color="danger"
                                      className="h-5 w-5 min-w-5"
                                      onPress={() => removeRow(item.id, idx)}
                                    >
                                      <Trash2 size={12} />
                                    </Button>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                                  <div className="md:col-span-8">
                                    <Select
                                      size="sm"
                                      placeholder="Pilih dari katalog bahan..."
                                      selectedKeys={row.bahanBakuId ? [row.bahanBakuId] : []}
                                      onChange={(e) => updateRow(item.id, idx, "bahanBakuId", e.target.value)}
                                      isLoading={isLoadingBahan}
                                      variant="bordered"
                                      classNames={{ label: "text-xs" }}
                                    >
                                      {bahanBakuOptions.map((b) => (
                                        <SelectItem key={b.id} textValue={b.nama}>
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-xs">{b.nama}</span>
                                            <span className="text-[11px] text-default-400">
                                              Stok: {b.stok} {b.unit?.nama || "Pcs"}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </Select>
                                  </div>
                                  <div className="md:col-span-4">
                                    <Input
                                      size="sm"
                                      type="number"
                                      placeholder="Jumlah"
                                      value={row.jumlahDibutuhkan}
                                      onValueChange={(val) => updateRow(item.id, idx, "jumlahDibutuhkan", val)}
                                      endContent={<span className="text-[10px] text-default-400 shrink-0">{row.satuan}</span>}
                                      variant="bordered"
                                    />
                                  </div>
                                </div>
                                {selectedBahan && (
                                  <div className="flex items-center justify-between text-[11px] pt-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-default-400">Sisa Stok:</span>
                                      <Chip size="sm" variant="flat" color={isLowStock ? "danger" : "success"} className="h-4 text-[10px] px-1">
                                        {selectedBahan.stok} {selectedBahan.unit?.nama || "Pcs"}
                                      </Chip>
                                    </div>
                                    {isLowStock && <span className="text-danger-500 font-medium">⚠️ Stok kurang</span>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            startContent={<Plus size={14} />}
                            onPress={() => addRow(item.id)}
                            className="w-full text-xs border border-dashed border-primary-200 bg-primary-50/50"
                          >
                            Tambah Bahan Baku Lain untuk Item Ini
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </ModalBody>

            <Divider />

            <ModalFooter>
              <Button size="sm" variant="light" onPress={onClose} isDisabled={isSubmitting}>
                Batal
              </Button>
              <Button
                size="sm"
                color="primary"
                startContent={<Package size={14} />}
                onPress={() => handleSubmit(onClose)}
                isLoading={isSubmitting}
              >
                Simpan Bahan Baku
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
