/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import useSWR from "swr";
import { 
  Tabs, 
  Tab, 
  Card, 
  CardBody, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell, 
  Button, 
  Spinner,
  Chip,
  Tooltip as HeroTooltip,
} from "@heroui/react";
import { RotateCcw, AlertTriangle, ShoppingCart, Package, Users, BookOpen, Trash2 } from "lucide-react";
import { fetcher, formatRupiah } from "@/lib/func";
import { addToast } from "@heroui/toast";

export default function TrashPage() {
  const [activeTab, setActiveTab] = useState("order");
  const { data, isLoading, mutate } = useSWR(`/api/admin/trash?type=${activeTab}`, fetcher);
  const results = data?.results || [];

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch("/api/admin/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeTab, id, action: "restore" }),
      });
      if (res.ok) {
        addToast({ title: "Berhasil", description: "Data telah dipulihkan ke posisi semula", color: "success" });
        mutate();
      } else {
        const json = await res.json();
        addToast({ title: "Gagal", description: json.error, color: "danger" });
      }
    } catch {
      addToast({ title: "Error", description: "Terjadi kesalahan koneksi", color: "danger" });
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-default-900 flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-danger-100 text-danger-600">
               <Trash2 size={24} />
            </div>
            Tempat Sampah
          </h1>
          <p className="text-default-500 max-w-2xl">
            Pulihkan data yang tidak sengaja dihapus. Data di sini akan tersimpan selama <strong>60 hari</strong> sebelum dihapus permanen secara otomatis oleh sistem untuk menjaga efisiensi database.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Tabs 
          aria-label="Kategori Sampah" 
          selectedKey={activeTab} 
          onSelectionChange={(k) => setActiveTab(k as string)}
          variant="solid"
          color="danger"
          radius="lg"
          classNames={{
            tabList: "bg-default-100 p-1.5",
            cursor: "shadow-md",
            tab: "h-10",
            tabContent: "font-semibold text-xs uppercase tracking-wider"
          }}
        >
          <Tab 
            key="order" 
            title={
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} />
                <span>Pesanan</span>
              </div>
            } 
          />
          <Tab 
            key="product" 
            title={
              <div className="flex items-center gap-2">
                <Package size={16} />
                <span>Produk</span>
              </div>
            } 
          />
          <Tab 
            key="customer" 
            title={
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span>Customer</span>
              </div>
            } 
          />
          <Tab 
            key="jurnal" 
            title={
              <div className="flex items-center gap-2">
                <BookOpen size={16} />
                <span>Jurnal</span>
              </div>
            } 
          />
        </Tabs>

        <Card shadow="none" className="border border-default-200 rounded-2xl overflow-hidden bg-content1/50 backdrop-blur-sm">
          <CardBody className="p-0">
            <Table 
              aria-label="Tabel Data Terhapus"
              removeWrapper
              classNames={{
                th: "bg-default-100/50 text-default-600 h-12 uppercase text-[10px] tracking-[0.1em] font-bold border-b border-default-200",
                td: "py-4 text-sm",
                tr: "border-b border-default-100 last:border-0 hover:bg-default-50/80 transition-colors"
              }}
            >
              <TableHeader>
                {activeTab === "order" ? (
                  <>
                    <TableColumn>NOMOR ORDER</TableColumn>
                    <TableColumn>PELANGGAN</TableColumn>
                    <TableColumn>GRAND TOTAL</TableColumn>
                    <TableColumn>TANGGAL HAPUS</TableColumn>
                    <TableColumn align="end">AKSI</TableColumn>
                  </>
                ) : activeTab === "product" ? (
                  <>
                    <TableColumn>INFORMASI PRODUK</TableColumn>
                    <TableColumn>KATEGORI</TableColumn>
                    <TableColumn>HARGA & STOK</TableColumn>
                    <TableColumn>TANGGAL HAPUS</TableColumn>
                    <TableColumn align="end">AKSI</TableColumn>
                  </>
                ) : activeTab === "customer" ? (
                  <>
                    <TableColumn>NAMA PELANGGAN</TableColumn>
                    <TableColumn>KONTAK</TableColumn>
                    <TableColumn>TANGGAL HAPUS</TableColumn>
                    <TableColumn align="end">AKSI</TableColumn>
                  </>
                ) : (
                  <>
                    <TableColumn>NOMOR REF</TableColumn>
                    <TableColumn>KETERANGAN JURNAL</TableColumn>
                    <TableColumn>AGREGASI NOMINAL</TableColumn>
                    <TableColumn>TANGGAL HAPUS</TableColumn>
                    <TableColumn align="end">AKSI</TableColumn>
                  </>
                )}
              </TableHeader>
              <TableBody 
                items={results} 
                isLoading={isLoading}
                loadingContent={
                  <div className="flex flex-col items-center gap-4 py-20">
                     <Spinner size="lg" color="danger" />
                     <p className="text-default-400 font-medium animate-pulse">Menghubungkan ke server...</p>
                  </div>
                }
                emptyContent={
                  <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                    <div className="size-20 rounded-full bg-default-100 flex items-center justify-center text-default-300 mb-6">
                       <Trash2 size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-default-900 mb-2">Tempat Sampah Kosong</h3>
                    <p className="text-default-500 max-w-[300px]">
                      Bagus! Tidak ada data yang menumpuk di sini. Semua data Anda saat ini tersimpan secara aktif.
                    </p>
                  </div>
                }
              >
                {(item: any) => {
                  const deletedAtCell = (
                    <TableCell>
                       <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-default-700">
                            {new Date(item.deletedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          <span className="text-[10px] text-default-400 font-medium">
                            {new Date(item.deletedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                          </span>
                       </div>
                    </TableCell>
                  );

                  const actionCell = (
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <HeroTooltip content="Kembalikan data ke daftar aktif" closeDelay={0}>
                          <Button 
                            size="sm" 
                            variant="shadow" 
                            color="danger"
                            startContent={<RotateCcw size={14} className="group-hover:-rotate-45 transition-transform" />}
                            className="font-bold group"
                            onPress={() => handleRestore(item.id)}
                          >
                            Restore
                          </Button>
                        </HeroTooltip>
                      </div>
                    </TableCell>
                  );

                  if (activeTab === "order") {
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex flex-col">
                             <span className="font-extrabold text-default-900">{item.nomorOrder}</span>
                             <span className="text-[10px] font-bold text-default-400 uppercase tracking-tighter">ORDER REF: {item.id.slice(-6)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                              <div className="size-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs">
                                 {item.customer?.nama?.charAt(0) || "C"}
                              </div>
                              <span className="font-medium">{item.customer?.nama || "-"}</span>
                           </div>
                        </TableCell>
                        <TableCell>
                           <Chip variant="flat" color="primary" size="sm" className="font-bold">
                              {formatRupiah(Number(item.grandTotal))}
                           </Chip>
                        </TableCell>
                        {deletedAtCell}
                        {actionCell}
                      </TableRow>
                    );
                  }

                  if (activeTab === "product") {
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-default-800">{item.nama}</span>
                            <span className="text-[10px] font-mono text-default-400">{item.sku || "TANPA SKU"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip size="sm" variant="dot" color="default" className="border-default-200">
                             {item.category?.nama || "Umum"}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-xs">
                            <span className="font-bold text-default-700">{formatRupiah(Number(item.hargaJual))}</span>
                            <span className="text-default-400 italic">Sisa Stok: {item.stok}</span>
                          </div>
                        </TableCell>
                        {deletedAtCell}
                        {actionCell}
                      </TableRow>
                    );
                  }

                  if (activeTab === "customer") {
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                           <div className="flex items-center gap-3">
                              <div className="size-10 rounded-xl bg-linear-to-br from-default-100 to-default-200 flex items-center justify-center font-black text-default-500">
                                 {item.nama.charAt(0)}
                              </div>
                              <span className="font-bold text-default-800">{item.nama}</span>
                           </div>
                        </TableCell>
                        <TableCell>
                           <span className="text-default-500 font-mono text-xs">{item.nomorHp || "-"}</span>
                        </TableCell>
                        {deletedAtCell}
                        {actionCell}
                      </TableRow>
                    );
                  }

                  return (
                    <TableRow key={item.id}>
                      <TableCell><Chip size="sm" className="font-mono font-bold" variant="flat">{item.ref}</Chip></TableCell>
                      <TableCell>
                         <p className="text-xs text-default-500 leading-relaxed max-w-[220px] line-clamp-2">{item.keterangan}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                           <div className="flex items-center justify-between gap-4 bg-default-50 px-2 py-1 rounded border border-default-100">
                              <span className="text-[10px] font-bold text-emerald-600">DEBET</span>
                              <span className="text-[10px] font-bold truncate max-w-[100px]">{item.akunDebet?.namaAkun}</span>
                           </div>
                           <div className="flex items-center justify-between gap-4 bg-default-50 px-2 py-1 rounded border border-default-100">
                              <span className="text-[10px] font-bold text-rose-600">KREDIT</span>
                              <span className="text-[10px] font-bold truncate max-w-[100px]">{item.akunKredit?.namaAkun}</span>
                           </div>
                           <span className="font-black text-center mt-1">{formatRupiah(Number(item.nominal))}</span>
                        </div>
                      </TableCell>
                      {deletedAtCell}
                      {actionCell}
                    </TableRow>
                  );
                }}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      <div className="bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 rounded-2xl flex gap-4 items-start shadow-sm">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
           <AlertTriangle className="shrink-0" size={20} />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-black text-amber-800 uppercase tracking-wide">Peringatan Integritas Data</p>
          <p className="text-sm text-amber-700/80 leading-relaxed font-medium">
            Data yang dipulihkan akan kembali mempengaruhi <strong>laba rugi, saldo neraca, dan ketersediaan stok</strong>. 
            Pastikan data yang Anda pulihkan adalah data yang benar-benar dibutuhkan kembali untuk menjaga keakuratan pembukuan.
          </p>
        </div>
      </div>
    </div>
  );
}
