"use client";

import { Card, CardBody, CardHeader, Chip, Divider } from "@heroui/react";
import { CreditCard } from "lucide-react";
import { formatRupiah } from "@/lib/func";
import { getStatusBayarBadge } from "../../components/order-badges";
import { OrderDetail, formatMetodePembayaran } from "./types";

interface PaymentSummaryProps {
  order: OrderDetail;
}

export function PaymentSummary({ order }: PaymentSummaryProps) {
  const bayarBadge = getStatusBayarBadge(order.statusPembayaran);
  const subtotal = parseFloat(order.subtotal);
  const diskon = parseFloat(order.diskon);
  const ongkir = order.ongkir ? parseFloat(order.ongkir) : 0;
  const grandTotal = parseFloat(order.grandTotal);
  const totalQty = order.items.reduce((s, i) => s + i.qty, 0);

  return (
    <Card shadow="sm" className="border border-default-200">
      <CardHeader className="pb-1 pt-4 px-4">
        <span className="text-sm font-semibold text-default-700">
          Ringkasan Pembayaran
        </span>
      </CardHeader>
      <Divider />
      <CardBody className="p-4 gap-3">
        {/* Status + Metode */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-default-400">Status</span>
          <Chip size="sm" color={bayarBadge.color} variant="flat">
            {bayarBadge.label}
          </Chip>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-default-400 flex items-center gap-1">
            <CreditCard size={12} />
            Metode
          </span>
          <span className="text-sm font-medium">
            {formatMetodePembayaran(order.metodePembayaran)}
          </span>
        </div>

        <Divider />

        {/* Kalkulasi */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-default-500">
              Subtotal ({totalQty} pcs)
            </span>
            <span className="text-sm">{formatRupiah(subtotal)}</span>
          </div>
          {diskon > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-default-500">Diskon</span>
              <span className="text-sm text-success">
                -{formatRupiah(diskon)}
              </span>
            </div>
          )}
          {ongkir > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-default-500">Ongkir</span>
              <span className="text-sm">{formatRupiah(ongkir)}</span>
            </div>
          )}
        </div>

        <Divider />

        <div className="flex items-center justify-between">
          <span className="text-base font-semibold">Total</span>
          <span className="text-xl font-bold text-primary">
            {formatRupiah(grandTotal)}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
