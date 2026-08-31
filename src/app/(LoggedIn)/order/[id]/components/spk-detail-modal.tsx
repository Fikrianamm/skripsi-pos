/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Divider,
  Chip,
  Card,
  CardBody,
} from "@heroui/react";
import {
  ClipboardList,
  FileText,
  Package,
  Eye,
  User,
  CheckCircle,
  Calendar,
  Layers,
} from "lucide-react";
import { OrderDetail, SPKDetail, DesignFile } from "./types";

import useSWR from "swr";
import { fetcher } from "@/lib/func";
import { Spinner } from "@heroui/react";

interface SpkDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order?: OrderDetail | null;
  orderId?: string;
  spk: SPKDetail | any;
}

function getFileIcon(filePath: string) {
  const ext = filePath.split(".").pop()?.toLowerCase();
  return ext === "pdf"
    ? "📄"
    : ext === "psd" || ext === "ai"
      ? "🎨"
      : ext === "zip"
        ? "📦"
        : "🖼️";
}

function formatDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function SpkDetailModal({
  isOpen,
  onOpenChange,
  order: propOrder,
  orderId: propOrderId,
  spk,
}: SpkDetailModalProps) {
  const targetOrderId = propOrder?.id || propOrderId || spk.orderId;

  // Jika propOrder belum lengkap atau tidak ada, fetch detail order
  const { data: orderData, isLoading: isLoadingOrder } = useSWR(
    isOpen && targetOrderId && !propOrder?.items ? `/api/order/${targetOrderId}` : null,
    fetcher,
  );

  const order: OrderDetail | null = propOrder?.items ? propOrder : (orderData?.order || null);

  const customItemsWithMaterials = order?.items?.filter(
    (item) => item.kebutuhanBahanCustom && item.kebutuhanBahanCustom.length > 0,
  ) || [];

  const statusBadge =
    spk.statusSPK === "AKTIF"
      ? { color: "success" as const, label: "Aktif" }
      : spk.statusSPK === "SELESAI"
        ? { color: "primary" as const, label: "Selesai" }
        : spk.statusSPK === "REVISI"
          ? { color: "warning" as const, label: "Revisi" }
          : { color: "default" as const, label: spk.statusSPK };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="4xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 pb-2">
              <div className="flex items-center justify-between gap-2 pr-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="text-primary" size={20} />
                  <span className="font-semibold text-base">
                    Detail SPK Produksi & Desain
                  </span>
                </div>
                <Chip size="sm" color={statusBadge.color} variant="flat">
                  {statusBadge.label}
                </Chip>
              </div>
              <p className="text-xs text-default-500 font-mono">
                Order #{order?.nomorOrder || spk.order?.nomorOrder || "-"} · Customer: {order?.customer?.nama || spk.order?.customer?.nama || "-"}
              </p>
            </ModalHeader>

            <Divider />

            <ModalBody className="py-4 space-y-5">
              {isLoadingOrder && !order ? (
                <div className="flex justify-center items-center py-12">
                  <Spinner size="md" label="Memuat detail SPK & desain..." />
                </div>
              ) : (
                <>
              {/* ── Section 1: Informasi Pekerja & SPK ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card shadow="none" className="border border-default-200">
                  <CardBody className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-default-700 font-semibold text-sm">
                      <User size={16} className="text-primary" />
                      <span>Pekerja Produksi</span>
                    </div>
                    <div className="bg-default-50 p-3 rounded-lg border border-default-100">
                      <p className="font-semibold text-sm text-default-800">
                        {spk.karyawan.nama}
                      </p>
                      {spk.karyawan.posisi && (
                        <p className="text-xs text-default-500">
                          {spk.karyawan.posisi}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-default-400">Tanggal Setor:</span>
                        <p className="font-medium text-default-700">
                          {formatDate(spk.tanggalSetor)}
                        </p>
                      </div>
                      <div>
                        <span className="text-default-400">ACC Cetak:</span>
                        <p className="font-medium">
                          {spk.accCetak ? (
                            <span className="text-success inline-flex items-center gap-1">
                              <CheckCircle size={12} /> Disetujui
                            </span>
                          ) : (
                            <span className="text-default-400">Belum</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card shadow="none" className="border border-default-200">
                  <CardBody className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-default-700 font-semibold text-sm">
                      <Layers size={16} className="text-primary" />
                      <span>Spesifikasi Produksi</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs bg-default-50 p-3 rounded-lg border border-default-100">
                      <div>
                        <span className="text-default-400">Model:</span>
                        <p className="font-medium text-default-800">
                          {spk.model || "-"}
                        </p>
                      </div>
                      <div>
                        <span className="text-default-400">Ukuran:</span>
                        <p className="font-medium text-default-800">
                          {spk.ukuran || "-"}
                        </p>
                      </div>
                      <div>
                        <span className="text-default-400">Tali:</span>
                        <p className="font-medium text-default-800">
                          {spk.tali || "-"}
                        </p>
                      </div>
                      <div>
                        <span className="text-default-400">Jumlah Cetak:</span>
                        <p className="font-bold text-primary text-sm">
                          {spk.jumlah} pcs
                        </p>
                      </div>
                    </div>
                    {spk.catatan && (
                      <div className="text-xs">
                        <span className="text-default-400">Catatan SPK:</span>
                        <p className="text-default-600 italic bg-warning-50/60 border border-warning-200/60 p-2 rounded-lg mt-1">
                          {spk.catatan}
                        </p>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>

              {/* ── Section 2: Bahan Baku Kebutuhan Desainer ── */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-default-700 font-semibold text-sm">
                  <Package size={16} className="text-primary" />
                  <span>Bahan Baku yang Digunakan &amp; Dikunci Desainer</span>
                </div>

                {customItemsWithMaterials.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-default-200 text-center text-xs text-default-400">
                    Tidak ada item dengan bahan baku custom khusus.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {customItemsWithMaterials.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-default-200 overflow-hidden bg-content1"
                      >
                        <div className="bg-default-100/70 px-3 py-2 border-b border-default-200 flex items-center justify-between">
                          <span className="font-medium text-xs text-default-800">
                            Item: {item.nama} ×{item.qty}
                          </span>
                          <Chip
                            size="sm"
                            variant="flat"
                            color="secondary"
                            className="h-4 text-[10px]"
                          >
                            {item.kebutuhanBahanCustom?.length} Bahan
                          </Chip>
                        </div>
                        <div className="p-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {item.kebutuhanBahanCustom?.map((mat) => (
                              <div
                                key={mat.id}
                                className="p-2.5 rounded-lg border border-default-100 bg-default-50/50 flex flex-col gap-1 text-xs"
                              >
                                <span className="font-semibold text-default-800 truncate">
                                  {mat.bahanBaku?.nama || "Bahan Baku"}
                                </span>
                                <div className="flex items-center justify-between text-default-500 pt-1 border-t border-default-100">
                                  <span>Jumlah Butuh:</span>
                                  <span className="font-bold text-primary font-mono">
                                    {mat.jumlahDibutuhkan} {mat.satuan}
                                  </span>
                                </div>
                                {mat.bahanBaku?.stok !== undefined && (
                                  <div className="flex items-center justify-between text-[11px] text-default-400">
                                    <span>Stok Gudang:</span>
                                    <span>
                                      {mat.bahanBaku.stok} {mat.satuan}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Section 3: File Desain Terkait ── */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-default-700 font-semibold text-sm">
                    <FileText size={16} className="text-primary" />
                    <span>File Desain ({order?.designFiles?.length || 0})</span>
                  </div>
                </div>

                {!order?.designFiles || order?.designFiles.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-default-200 text-center text-xs text-default-400">
                    Belum ada file desain yang diunggah untuk pesanan ini.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {order?.designFiles.map((df) => (
                      <div
                        key={df.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-default-200 bg-default-50 hover:bg-default-100/50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl shrink-0">
                            {getFileIcon(df.filePath)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-xs text-default-800 truncate">
                              {df.nama}
                            </p>
                            <p className="text-[10px] text-default-400">
                              {df.uploadedBy?.name || "Desainer"} ·{" "}
                              {formatDate(df.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Button
                          as="a"
                          href={df.filePath}
                          target="_blank"
                          size="sm"
                          variant="flat"
                          color="primary"
                          className="h-7 text-xs px-2.5 shrink-0"
                          startContent={<Eye size={12} />}
                        >
                          Buka
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </>
              )}
            </ModalBody>

            <Divider />

            <ModalFooter>
              <Button size="sm" variant="flat" onPress={onClose}>
                Tutup
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
