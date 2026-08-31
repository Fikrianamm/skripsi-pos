"use client";

import React, { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Chip,
  Button,
  useDisclosure,
} from "@heroui/react";
import { DollarSign, Package } from "lucide-react";
import { formatRupiah } from "@/lib/func";
import { OrderItem } from "./types";
import { PersetujuanHargaModal } from "./persetujuan-harga-modal";

interface OrderItemsTableProps {
  items: OrderItem[];
  orderId?: string;
  nomorOrder?: string;
  canAgreePrice?: boolean;
  onMutate?: () => void;
}

export function OrderItemsTable({
  items,
  orderId,
  nomorOrder,
  canAgreePrice = true,
  onMutate,
}: OrderItemsTableProps) {
  const hargaModalDisclosure = useDisclosure();
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);

  const handleOpenHargaModal = (item: OrderItem) => {
    setSelectedItem(item);
    hargaModalDisclosure.onOpen();
  };

  return (
    <>
      <Card shadow="none" className="border border-default-200">
        <CardHeader className="pb-1 pt-4 px-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-default-700">
            Item Pesanan
          </span>
          <span className="text-xs text-default-400">
            {items.length} item · {items.reduce((s, i) => s + Number(i.qty), 0)} pcs
          </span>
        </CardHeader>
        <Divider />
        <CardBody className="p-0">
          <Table
            removeWrapper
            aria-label="Daftar item pesanan"
            classNames={{ th: "bg-default-50 text-xs", td: "text-sm py-3" }}
          >
            <TableHeader>
              <TableColumn>PRODUK / JASA</TableColumn>
              <TableColumn className="text-left">STATUS HARGA / BAHAN</TableColumn>
              <TableColumn className="text-right w-36">HARGA SATUAN</TableColumn>
              <TableColumn className="text-center w-16">QTY</TableColumn>
              <TableColumn className="text-right w-32">SUBTOTAL</TableColumn>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isCustom =
                  item.product?.isService ||
                  (item.statusHarga && item.statusHarga !== "NA");
                const priceNum = parseFloat(item.harga || "0");
                const subtotalNum = parseFloat(item.subtotal || "0");

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium">{item.nama}</p>
                          {isCustom && (
                            <span className="text-[10px] bg-secondary-100 text-secondary-700 px-1.5 py-0.5 rounded font-medium">
                              Custom/Jasa
                            </span>
                          )}
                        </div>
                        {item.product && (
                          <p className="text-xs text-default-400 font-mono">
                            {item.product.sku}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {isCustom ? (
                        <div className="flex flex-col gap-1.5 items-start py-0.5">
                          <Chip
                            size="sm"
                            variant="flat"
                            color={
                              item.statusHarga === "DISEPAKATI"
                                ? "success"
                                : item.statusHarga === "MENUNGGU_NEGOSIASI"
                                  ? "primary"
                                  : "warning"
                            }
                            className="h-5 text-[11px]"
                          >
                            {item.statusHarga === "DISEPAKATI"
                              ? "Harga Disepakati"
                              : item.statusHarga === "MENUNGGU_NEGOSIASI"
                                ? "Menunggu Persetujuan Harga"
                                : "Menunggu Desain"}
                          </Chip>
                          {item.kebutuhanBahanCustom &&
                            item.kebutuhanBahanCustom.length > 0 && (
                              <div className="flex flex-col gap-1 mt-0.5">
                                <span className="text-[10px] uppercase font-bold text-default-400 tracking-wider">
                                  Bahan Baku:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {item.kebutuhanBahanCustom.map((k) => (
                                    <span
                                      key={k.id}
                                      className="inline-flex items-center gap-1 bg-default-100 border border-default-200 text-default-700 text-[11px] px-2 py-0.5 rounded-md"
                                    >
                                      <span className="font-medium text-default-800">
                                        {k.bahanBaku?.nama || "Bahan"}
                                      </span>
                                      <span className="text-default-500 font-mono">
                                        ({k.jumlahDibutuhkan} {k.satuan})
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      ) : (
                        <span className="text-xs text-default-400">-</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {isCustom && item.statusHarga !== "DISEPAKATI" ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-default-400 italic">
                            {item.statusHarga === "MENUNGGU_DESAIN"
                              ? "Belum ditentukan"
                              : "Perlu konfirmasi"}
                          </span>
                          {item.statusHarga === "MENUNGGU_NEGOSIASI" &&
                            canAgreePrice &&
                            orderId && (
                              <Button
                                size="sm"
                                color="primary"
                                variant="flat"
                                startContent={<DollarSign size={12} />}
                                className="h-6 text-[11px] px-2"
                                onPress={() => handleOpenHargaModal(item)}
                              >
                                Setujui Harga
                              </Button>
                            )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="text-default-700 font-medium">
                            {formatRupiah(priceNum)}
                          </span>
                          {isCustom && canAgreePrice && orderId && (
                            <Button
                              size="sm"
                              variant="light"
                              color="primary"
                              className="h-5 text-[10px] px-1 min-w-0"
                              onPress={() => handleOpenHargaModal(item)}
                            >
                              Ubah
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-center font-semibold">
                      {item.qty}
                    </TableCell>

                    <TableCell className="text-right font-semibold text-default-900">
                      {isCustom && item.statusHarga !== "DISEPAKATI"
                        ? "-"
                        : formatRupiah(subtotalNum)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Persetujuan Harga Modal */}
      {orderId && nomorOrder && (
        <PersetujuanHargaModal
          isOpen={hargaModalDisclosure.isOpen}
          onOpenChange={hargaModalDisclosure.onOpenChange}
          orderId={orderId}
          nomorOrder={nomorOrder}
          orderItem={selectedItem}
          onSuccess={() => {
            if (onMutate) onMutate();
          }}
        />
      )}
    </>
  );
}
