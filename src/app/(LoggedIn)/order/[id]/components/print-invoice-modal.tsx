"use client";
import React, { useRef } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { Printer } from "lucide-react";
import { formatRupiah } from "@/lib/func";
import { OrderDetail } from "./types";
import useSWR from "swr";
import { fetcher } from "@/lib/func";

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDetail;
}

export function PrintInvoiceModal({
  isOpen,
  onOpenChange,
  order,
}: PrintInvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { data: settings } = useSWR("/api/admin/settings", fetcher);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${order.nomorOrder}</title>
          <style>
            @media print {
              @page { margin: 15mm; size: A4; }
              body { 
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                padding: 0; 
                color: #1a1a1a; 
                line-height: 1.5;
                font-size: 13px;
              }
              .invoice-box { max-width: 800px; margin: auto; }
              .header { 
                border-bottom: 2px solid #e5e7eb; 
                padding-bottom: 20px; 
                margin-bottom: 30px; 
                display: flex; 
                justify-content: space-between; 
                align-items: flex-start; 
              }
              .header-left { display: flex; gap: 15px; align-items: center; }
              .header-logo { max-width: 100px; max-height: 80px; object-fit: contain; }
              .company-info h1 { margin: 0 0 5px 0; font-size: 24px; color: #111827; font-weight: 700; }
              .company-info p { margin: 2px 0; font-size: 13px; color: #4b5563; }
              .header-right { text-align: right; }
              .header-right h2 { margin: 0 0 10px 0; font-size: 32px; color: #374151; font-weight: 800; letter-spacing: 1px; }
              .header-right p { margin: 4px 0; font-size: 13px; color: #6b7280; }
              .header-right strong { color: #111827; }
              
              .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .table th { 
                background: #f9fafb; 
                text-align: left; 
                padding: 12px; 
                border-bottom: 2px solid #e5e7eb; 
                font-size: 12px; 
                font-weight: 600;
                color: #374151;
                text-transform: uppercase;
              }
              .table td { 
                padding: 12px; 
                border-bottom: 1px solid #f3f4f6; 
                font-size: 13px; 
                vertical-align: top;
              }
              .table tr:last-child td { border-bottom: 2px solid #e5e7eb; }
              
              .summary-container {
                display: flex;
                justify-content: flex-end;
                margin-top: 20px;
              }
              .summary { width: 300px; }
              .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #4b5563; }
              .summary-row.total { 
                border-top: 2px solid #111827; 
                margin-top: 10px; 
                padding-top: 10px; 
                font-weight: 800; 
                font-size: 18px; 
                color: #111827;
              }
              .summary-row.total span:last-child { color: #2563eb; }
              
              .footer { 
                margin-top: 60px; 
                padding-top: 20px; 
                font-size: 11px; 
                color: #9ca3af; 
                text-align: center; 
                border-top: 1px dashed #e5e7eb;
              }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div class="header-left">
                ${settings?.logoUrl ? `<img src="${settings.logoUrl}" class="header-logo" alt="Logo" />` : ""}
                <div class="company-info">
                  <h1>${settings?.namaPerusahaan || "CV. Haqi Koleksi"}</h1>
                  <p>${settings?.alamat ? settings.alamat.replace(/\n/g, '<br/>') : "-"}</p>
                  <p>Kontak: ${settings?.nomorKontak || "-"}</p>
                </div>
              </div>
            <div class="header-right">
              <h2>INVOICE</h2>
              <p>Nomor: <strong>${order.nomorOrder}</strong></p>
              <p>Tanggal: ${new Date(order.createdAt).toLocaleDateString("id-ID")}</p>
              <p>Customer: ${order.customer.nama}</p>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Produk</th>
                <th>Harga</th>
                <th>Qty</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.nama} ${item.catatan ? `<br/><small>(${item.catatan})</small>` : ""}</td>
                  <td>${formatRupiah(Number(item.harga))}</td>
                  <td>${item.qty}</td>
                  <td style="text-align: right;">${formatRupiah(Number(item.subtotal))}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <div class="summary-container">
            <div class="summary">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>${formatRupiah(Number(order.subtotal))}</span>
              </div>
              ${
                Number(order.diskon) > 0
                  ? `<div class="summary-row"><span>Diskon</span><span style="color: #ef4444;">- ${formatRupiah(Number(order.diskon))}</span></div>`
                  : ""
              }
              ${
                Number(order.ongkir) > 0
                  ? `<div class="summary-row"><span>Ongkir</span><span>+ ${formatRupiah(Number(order.ongkir))}</span></div>`
                  : ""
              }
              <div class="summary-row total">
                <span>Grand Total</span>
                <span>${formatRupiah(Number(order.grandTotal))}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            ${settings?.catatanKakiStruk ? settings.catatanKakiStruk.replace(/\n/g, '<br/>') : "Terima kasih telah berbelanja!"}
          </div>
          </div>

          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Cetak Nota</ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-500">
            Nota akan dibuka di jendela baru untuk proses pencetakan.
          </p>
          <div className="p-4 border border-default-200 rounded-lg bg-default-50 flex flex-col items-center gap-2">
            <Printer size={32} className="text-primary opacity-50" />
            <p className="font-semibold text-lg">{order.nomorOrder}</p>
            <p className="text-xs text-default-400">Siap Cetak</p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button color="primary" startContent={<Printer size={18} />} onPress={handlePrint}>
            Cetak Sekarang
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
