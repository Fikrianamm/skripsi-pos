"use client";

import { useState } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { fetcher } from "@/lib/func";
import { Button, Card, CardBody, Spinner, Tooltip } from "@heroui/react";
import { ArrowLeft, Package, RefreshCw, Trash2 } from "lucide-react";
import { addToast } from "@heroui/toast";
import { UpdateStatusModal } from "../list/components/update-status-modal";
import { OrderDetail } from "./components/types";
import { ProduksiProgress } from "./components/produksi-progress";
import { OrderInfoCard } from "./components/order-info-card";
import { OrderItemsTable } from "./components/order-items-table";
import { DesignFilesCard } from "./components/design-files-card";
import { PaymentSummary } from "./components/payment-summary";
import { SpkFormModal } from "./components/spk-form-modal";
import { SpkCard } from "./components/spk-card";
import { Printer } from "lucide-react";
import { DeleteOrderModal } from "./components/delete-order-modal";
import { PrintInvoiceModal } from "./components/print-invoice-modal";
import { formatRupiah } from "@/lib/func";

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
   const [isDeleting, setIsDeleting] = useState(false);
  const [showSpkForm, setShowSpkForm] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data, isLoading, mutate } = useSWR(`/api/order/${orderId}`, fetcher);
  const order: OrderDetail | null = data?.order ?? null;

  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefresh = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    mutate();
    setTimeout(() => setIsSpinning(false), 500); // Putar selama 500ms
  };

  async function confirmDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/order/${orderId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        addToast({
          title: "Gagal menghapus",
          description: json.error,
          color: "danger",
        });
        return;
      }
      addToast({ title: "Pesanan dihapus", color: "success" });
      router.push("/order/list");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-default-400">
        <Package size={48} strokeWidth={1.2} />
        <p className="text-base font-medium">Pesanan tidak ditemukan</p>
        <Button
          size="sm"
          variant="flat"
          startContent={<ArrowLeft size={14} />}
          onPress={() => router.push("/order/list")}
        >
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-5 mb-6">
      {/* ── Header ── */}
      <div className="pb-2 border-b border-default-200 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {order.nomorOrder}
          </h1>
          <p className="text-sm text-default-400 mt-0.5">
            Dibuat pada{" "}
            {new Date(order.createdAt).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            {" · "}Diperbarui{" "}
            {new Date(order.updatedAt).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <Button
            size="sm"
            variant="flat"
            startContent={<ArrowLeft size={14} />}
            onPress={() => router.push("/order/list")}
          >
            Kembali
          </Button>
          <Tooltip content="Refresh">
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onPress={() => handleRefresh()}
            >
              <RefreshCw size={14} className={isSpinning ? "animate-spin" : ""} />
            </Button>
          </Tooltip>
          <UpdateStatusModal
            orderId={order.id}
            nomorOrder={order.nomorOrder}
            currentStatus={order.statusProduksi}
            currentStatusBayar={order.statusPembayaran}
            hasSPK={!!order.spk}
            items={order.items}
            onUpdated={() => mutate()}
          />
           <Tooltip content="Hapus pesanan (admin only)">
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              color="danger"
              onPress={() => setShowDeleteModal(true)}
              isLoading={isDeleting}
            >
              <Trash2 size={14} />
            </Button>
          </Tooltip>
          <Button
            size="sm"
            color="primary"
            variant="flat"
            startContent={<Printer size={14} />}
            onPress={() => setShowPrintModal(true)}
          >
            Cetak Nota
          </Button>
        </div>
      </div>

      {/* ── Progress produksi ── */}
      <Card className="border border-default-200">
        <CardBody className="py-3 px-4">
          <ProduksiProgress current={order.statusProduksi} />
        </CardBody>
      </Card>

      {/* ── Grid: left content + right sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* Left */}
        <div className="flex flex-col gap-5">
          <OrderInfoCard order={order} />
          <OrderItemsTable items={order.items} />
          <DesignFilesCard files={order.designFiles} />
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-5">
          <PaymentSummary order={order} />

          {/* SPK — muncul saat status PRODUKSI */}
          {order.statusProduksi === "PRODUKSI" && (
            <>
              {order.spk ? (
                <SpkCard
                  orderId={order.id}
                  spk={order.spk}
                  onUpdated={() => mutate()}
                />
              ) : (
                /* SPK belum dibuat — tampilkan card placeholder */
                <Card className="border border-warning-200 bg-warning-50/40">
                  <CardBody className="flex flex-col items-center gap-3 py-5 text-center">
                    <div className="text-warning-600 text-sm font-medium">
                      SPK Belum Dibuat
                    </div>
                    <p className="text-xs text-default-500 leading-relaxed">
                      Pesanan ini sudah di tahap Produksi tetapi belum memiliki
                      SPK.
                    </p>
                    <Button
                      color="warning"
                      variant="flat"
                      size="sm"
                      onPress={() => setShowSpkForm(true)}
                    >
                      Buat SPK
                    </Button>
                  </CardBody>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* SPK Form Modal — terbuka ketika user memilih status PRODUKSI */}
      {showSpkForm && (
        <SpkFormModal
          isOpen={showSpkForm}
          onOpenChange={(open) => setShowSpkForm(open)}
          orderId={order.id}
          nomorOrder={order.nomorOrder}
          items={order.items}
          onSuccess={() => {
            setShowSpkForm(false);
            mutate();
          }}
        />
      )}

      {/* Print Invoice Modal */}
      {showPrintModal && (
        <PrintInvoiceModal
          isOpen={showPrintModal}
          onOpenChange={setShowPrintModal}
          order={order}
        />
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteOrderModal
          isOpen={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          nomorOrder={order.nomorOrder}
          onConfirm={confirmDelete}
        />
      )}

      {/* Invoice Preview at Bottom */}
      <div className="mt-8 pt-8 border-t-2 border-dashed border-default-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Printer size={20} className="text-primary" />
            Pratinjau Invoice
          </h2>
          <Button 
            size="sm" 
            color="primary" 
            startContent={<Printer size={14} />}
            onPress={() => setShowPrintModal(true)}
          >
            Cetak Sekarang
          </Button>
        </div>
        
        <Card className="max-w-[800px] mx-auto shadow-lg border border-default-100 overflow-hidden bg-white">
          <CardBody className="p-0">
             <iframe 
                srcDoc={`
                  <html>
                    <head>
                      <style>
                        body { 
                          font-family: sans-serif; 
                          padding: 40px; 
                          background: #fff;
                          color: #333;
                        }
                        .invoice-container { max-width: 100%; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
                        .company h1 { margin: 0; color: #111; font-size: 24px; }
                        .company p { margin: 5px 0; font-size: 14px; color: #666; }
                        .meta { text-align: right; }
                        .meta h2 { margin: 0; font-size: 28px; color: #444; }
                        .meta p { margin: 5px 0; font-size: 14px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #f8f8f8; text-align: left; padding: 12px; border-bottom: 2px solid #eee; font-size: 12px; font-weight: bold; }
                        td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
                        .summary { margin-top: 30px; display: flex; justify-content: flex-end; }
                        .summary-box { width: 250px; }
                        .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
                        .total-row { border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 18px; color: #000; }
                        .footer { margin-top: 50px; text-align: center; color: #999; font-size: 12px; border-top: 1px dashed #eee; padding-top: 20px; }
                      </style>
                    </head>
                    <body>
                      <div class="invoice-container">
                        <div class="header">
                          <div class="company">
                            <h1>POS SYSTEM</h1>
                            <p>Jl. Contoh No. 123, Jakarta</p>
                            <p>Telp: 0812-3456-7890</p>
                          </div>
                          <div class="meta">
                            <h2>INVOICE</h2>
                            <p>#${order.nomorOrder}</p>
                            <p>${new Date(order.createdAt).toLocaleDateString("id-ID")}</p>
                          </div>
                        </div>
                        <table>
                          <thead>
                            <tr>
                              <th>PRODUK</th>
                              <th>HARGA</th>
                              <th>QTY</th>
                              <th style="text-align: right;">SUBTOTAL</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${order.items.map(item => `
                              <tr>
                                <td>${item.nama}</td>
                                <td>${item.harga.toLocaleString()}</td>
                                <td>${item.qty}</td>
                                <td style="text-align: right;">${item.subtotal.toLocaleString()}</td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>
                        <div class="summary">
                          <div class="summary-box">
                            <div class="summary-row"><span>Subtotal</span><span>${Number(order.subtotal).toLocaleString("id-ID")}</span></div>
                            ${Number(order.diskon) > 0 ? `<div class="summary-row"><span>Diskon</span><span>-${Number(order.diskon).toLocaleString("id-ID")}</span></div>` : ''}
                            ${Number(order.ongkir) > 0 ? `<div class="summary-row"><span>Ongkir</span><span>+${Number(order.ongkir).toLocaleString("id-ID")}</span></div>` : ''}
                            <div class="summary-row total-row"><span>Total</span><span>${Number(order.grandTotal).toLocaleString("id-ID")}</span></div>
                          </div>
                        </div>
                        <div class="footer">
                          Terima kasih atas pesanan Anda!
                        </div>
                      </div>
                    </body>
                  </html>
                `}
                className="w-full h-[600px] border-none"
                title="Invoice Preview"
              />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
