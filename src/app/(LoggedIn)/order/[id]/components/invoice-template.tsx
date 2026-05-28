/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import { Building2, Mail, Phone, MapPin } from "lucide-react";
import { formatRupiah } from "@/lib/func";
import { OrderDetail } from "./types";

interface InvoiceTemplateProps {
  order: OrderDetail;
  settings: any;
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ order, settings }, ref) => {
    if (!order || !settings) return null;

    return (
      <div ref={ref} className="p-8 text-slate-800 bg-white min-h-[29.7cm] w-[21cm] mx-auto print:m-0 print:p-8">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-6">
          <div className="flex gap-4 items-center">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-16 w-16 object-contain" />
            ) : (
              <div className="h-16 w-16 bg-slate-100 rounded-lg flex items-center justify-center">
                <Building2 size={32} className="text-slate-400" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{settings.namaPerusahaan}</h1>
              <div className="text-sm text-slate-500 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} />
                  <span>{settings.alamat}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} />
                    <span>{settings.nomorKontak}</span>
                  </div>
                  {settings.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} />
                      <span>{settings.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-black text-slate-300 uppercase tracking-tighter">INVOICE</h2>
            <div className="mt-2 space-y-1">
              <p className="text-sm font-bold text-slate-700">{order.nomorOrder}</p>
              <p className="text-xs text-slate-500">
                {new Date(order.createdAt).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Tagihan Kepada:</p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h3 className="font-bold text-slate-900">{order.customer.nama}</h3>
            <p className="text-sm text-slate-600">{order.customer.nomorHp}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8 border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="py-3 px-4 text-left text-xs font-bold rounded-l-lg">PRODUK</th>
              <th className="py-3 px-4 text-center text-xs font-bold">QTY</th>
              <th className="py-3 px-4 text-right text-xs font-bold">HARGA</th>
              <th className="py-3 px-4 text-right text-xs font-bold rounded-r-lg">TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item, idx) => (
              <tr key={idx} className="group">
                <td className="py-4 px-4">
                  <div className="font-bold text-slate-800">{item.nama}</div>
                </td>
                <td className="py-4 px-4 text-center text-sm font-medium text-slate-600">
                  {item.qty}
                </td>
                <td className="py-4 px-4 text-right text-sm text-slate-600">
                  {formatRupiah(Number(item.harga))}
                </td>
                <td className="py-4 px-4 text-right text-sm font-bold text-slate-900">
                  {formatRupiah(Number(item.subtotal))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary & Footer */}
        <div className="flex justify-between items-start gap-12 pt-6 border-t border-slate-100">
          <div className="flex-1 space-y-6">
            {/* Rekening Info */}
            {settings.invoiceRekenings && settings.invoiceRekenings.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-3">Informasi Pembayaran:</p>
                <div className="grid grid-cols-2 gap-3">
                  {settings.invoiceRekenings.map((rek: any, i: number) => (
                    <div key={i} className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <p className="font-bold text-slate-700">{rek.namaRekening}</p>
                      <p className="text-slate-500 font-mono tracking-wider">{rek.nomorRekening}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Catatan Kaki */}
            {settings.catatanKakiStruk && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Catatan:</p>
                <p className="text-[10px] text-slate-500 leading-relaxed whitespace-pre-wrap">
                  {settings.catatanKakiStruk}
                </p>
              </div>
            )}
          </div>

          <div className="w-64 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-slate-800">{formatRupiah(Number(order.subtotal))}</span>
            </div>
            {Number(order.diskon) > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Diskon</span>
                <span className="font-medium text-rose-500">-{formatRupiah(Number(order.diskon))}</span>
              </div>
            )}
            {Number(order.ongkir) > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Ongkir</span>
                <span className="font-medium text-slate-800">+{formatRupiah(Number(order.ongkir))}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <span className="font-bold text-slate-900">Grand Total</span>
              <span className="text-lg font-black text-slate-900">
                {formatRupiah(Number(order.grandTotal))}
              </span>
            </div>

            {/* Payment Summary */}
            {order.payments && order.payments.length > 0 && (
              <div className="pt-3 space-y-2 border-t border-slate-100 mt-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Terbayar</span>
                  <span className="font-medium text-slate-800">
                    {formatRupiah(order.payments.reduce((acc, p) => acc + Number(p.nominal), 0))}
                  </span>
                </div>
                {Math.max(0, Number(order.grandTotal) - order.payments.reduce((acc, p) => acc + Number(p.nominal), 0)) > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-700">Sisa Tagihan</span>
                    <span className="font-bold text-slate-900">
                      {formatRupiah(Math.max(0, Number(order.grandTotal) - order.payments.reduce((acc, p) => acc + Number(p.nominal), 0)))}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Print Only Stamp */}
        <div className="mt-16 text-center opacity-30 pointer-events-none select-none">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            Terima Kasih Atas Kepercayaan Anda
          </p>
        </div>
      </div>
    );
  }
);

InvoiceTemplate.displayName = "InvoiceTemplate";
