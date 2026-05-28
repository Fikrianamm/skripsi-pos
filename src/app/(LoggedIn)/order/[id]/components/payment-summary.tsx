/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardBody, CardHeader, Chip, Divider } from "@heroui/react";
import { CreditCard } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { fetcher, formatRupiah } from "@/lib/func";
import { getStatusBayarBadge } from "../../components/order-badges";
import { OrderDetail, formatMetodePembayaran } from "./types";
import { PaymentModal } from "./payment-modal";
import { Button } from "@heroui/react";

import { authClient } from "@/lib/auth-client";

interface PaymentSummaryProps {
  order: OrderDetail;
}

export function PaymentSummary({ order }: PaymentSummaryProps) {
  const { data: sessionData } = authClient.useSession();
  const role = sessionData?.user?.role ?? "";
  const canAddPayment = role === "admin" || role === "kasir";
  const bayarBadge = getStatusBayarBadge(order.statusPembayaran);
  const subtotal = parseFloat(order.subtotal);
  const diskon = parseFloat(order.diskon);
  const ongkir = order.ongkir ? parseFloat(order.ongkir) : 0;
  const grandTotal = parseFloat(order.grandTotal);
  const totalQty = order.items.reduce((s, i) => s + Number(i.qty), 0);

  const { data, mutate } = useSWR(`/api/order/${order.id}/payment`, fetcher);
  const payments: any[] = data?.payments || [];
  
  const totalDibayar = payments.reduce((acc, p) => acc + Number(p.nominal), 0);
  const sisaTagihan = Math.max(0, grandTotal - totalDibayar);
  const isLunas = sisaTagihan === 0;

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Card shadow="none" className="border border-default-200">
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
          <span className="text-base font-semibold">Total Tagihan</span>
          <span className="text-xl font-bold text-primary">
            {formatRupiah(grandTotal)}
          </span>
        </div>

        <Divider />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-default-600">Terbayar</span>
            <span className="text-sm font-semibold text-success">{formatRupiah(totalDibayar)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-default-600">Sisa Tagihan</span>
            <span className="text-sm font-semibold text-danger">{formatRupiah(sisaTagihan)}</span>
          </div>
        </div>

        {payments.length > 0 && (
          <div className="mt-2 flex flex-col gap-2 bg-default-50 p-3 rounded-lg border border-default-100">
            <span className="text-xs font-semibold text-default-500 uppercase tracking-wide">
              Riwayat Pembayaran
            </span>
            {payments.map((p) => (
              <div key={p.id} className="flex flex-col border-b border-default-200 last:border-0 pb-2 mb-1 last:pb-0 last:mb-0">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{formatRupiah(Number(p.nominal))}</span>
                  <span className="text-xs text-default-400">
                     {new Date(p.tanggal).toLocaleDateString("id-ID", { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <span className="text-xs text-default-500">
                  Via {formatMetodePembayaran(p.metodePembayaran)} | Oleh {p.user?.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {!isLunas && canAddPayment && (
          <Button
            color="primary"
            variant="flat"
            size="sm"
            className="w-full mt-2 font-medium"
            onPress={() => setIsOpen(true)}
          >
            Tambah Pembayaran
          </Button>
        )}
      </CardBody>
    </Card>

    <PaymentModal
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      orderId={order.id}
      nomorOrder={order.nomorOrder}
      sisaTagihan={sisaTagihan}
      onSuccess={() => mutate()}
    />
  </>
  );
}
