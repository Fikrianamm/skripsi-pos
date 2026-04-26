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
} from "@heroui/react";
import { RotateCcw, AlertTriangle } from "lucide-react";
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
        addToast({ title: "Berhasil", description: "Data telah dipulihkan", color: "success" });
        mutate();
      } else {
        const json = await res.json();
        addToast({ title: "Gagal", description: json.error, color: "danger" });
      }
    } catch{
      addToast({ title: "Error", description: "Terjadi kesalahan koneksi", color: "danger" });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Sampah (Recycle Bin)</h1>
        <p className="text-sm text-default-500">
          Kelola data yang telah dihapus secara lembut. Anda dapat memulihkan data kembali ke modul asalnya.
        </p>
      </div>

      <Tabs 
        aria-label="Kategori Sampah" 
        selectedKey={activeTab} 
        onSelectionChange={(k) => setActiveTab(k as string)}
        variant="underlined"
        color="primary"
      >
        <Tab key="order" title="Pesanan" />
        <Tab key="product" title="Produk" />
        <Tab key="customer" title="Customer" />
        <Tab key="cost" title="Biaya" />
        <Tab key="jurnal" title="Jurnal" />
      </Tabs>

      <Card shadow="sm" className="border border-default-200">
        <CardBody className="p-0">
          <Table 
            aria-label="Tabel Data Terhapus"
            removeWrapper
            classNames={{
              th: "bg-default-50 text-default-600 border-b border-default-100",
            }}
          >
            <TableHeader>
              {activeTab === "order" ? (
                <>
                  <TableColumn>NOMOR ORDER</TableColumn>
                  <TableColumn>PELANGGAN</TableColumn>
                  <TableColumn>TOTAL</TableColumn>
                  <TableColumn>TANGGAL HAPUS</TableColumn>
                  <TableColumn align="end">AKSI</TableColumn>
                </>
              ) : activeTab === "product" ? (
                <>
                  <TableColumn>PRODUK</TableColumn>
                  <TableColumn>KATEGORI</TableColumn>
                  <TableColumn>HARGA / STOK</TableColumn>
                  <TableColumn>TANGGAL HAPUS</TableColumn>
                  <TableColumn align="end">AKSI</TableColumn>
                </>
              ) : activeTab === "customer" ? (
                <>
                  <TableColumn>PELANGGAN</TableColumn>
                  <TableColumn>NOMOR HP</TableColumn>
                  <TableColumn>TANGGAL HAPUS</TableColumn>
                  <TableColumn align="end">AKSI</TableColumn>
                </>
              ) : activeTab === "cost" ? (
                <>
                  <TableColumn>BIAYA</TableColumn>
                  <TableColumn>NOMINAL</TableColumn>
                  <TableColumn>AKUN</TableColumn>
                  <TableColumn>TANGGAL HAPUS</TableColumn>
                  <TableColumn align="end">AKSI</TableColumn>
                </>
              ) : (
                <>
                  <TableColumn>REFERENSI</TableColumn>
                  <TableColumn>KETERANGAN</TableColumn>
                  <TableColumn>DEBET / KREDIT</TableColumn>
                  <TableColumn>TANGGAL HAPUS</TableColumn>
                  <TableColumn align="end">AKSI</TableColumn>
                </>
              )}
            </TableHeader>
            <TableBody 
              items={results} 
              isLoading={isLoading}
              loadingContent={<Spinner label="Memuat data sampah..." />}
              emptyContent="Tidak ada data di tempat sampah."
            >
              {(item: any) => (
                <TableRow key={item.id}>
                  {activeTab === "order" ? (
                    <>
                      <TableCell className="font-bold">{item.nomorOrder}</TableCell>
                      <TableCell>{item.customer?.nama || "-"}</TableCell>
                      <TableCell className="font-semibold text-primary">{formatRupiah(Number(item.grandTotal))}</TableCell>
                    </>
                  ) : activeTab === "product" ? (
                    <>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{item.nama}</span>
                          <span className="text-xs text-default-400">{item.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.category?.nama || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{formatRupiah(Number(item.hargaJual))}</span>
                          <span className="text-xs text-default-400">Stok: {item.stok} {item.unit?.nama}</span>
                        </div>
                      </TableCell>
                    </>
                  ) : activeTab === "customer" ? (
                    <>
                      <TableCell className="font-bold">{item.nama}</TableCell>
                      <TableCell>{item.nomorHp || "-"}</TableCell>
                    </>
                  ) : activeTab === "cost" ? (
                    <>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{item.nama}</span>
                          <span className="text-xs text-default-400 line-clamp-1">{item.keterangan || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-danger">{formatRupiah(Number(item.nominal))}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="font-medium">{item.akun?.namaAkun}</span>
                          <span className="text-default-400">{item.akun?.kodeAkun}</span>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-bold">{item.ref}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{item.keterangan}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs gap-1">
                          <div className="flex items-center gap-1">
                            <span className="text-emerald-600 font-bold">D:</span>
                            <span>{item.akunDebet?.namaAkun}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-rose-600 font-bold">K:</span>
                            <span>{item.akunKredit?.namaAkun}</span>
                          </div>
                          <span className="font-semibold">{formatRupiah(Number(item.nominal))}</span>
                        </div>
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <span className="text-sm text-default-500">
                      {new Date(item.deletedAt).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="flat" 
                        color="primary"
                        startContent={<RotateCcw size={14} />}
                        onPress={() => handleRestore(item.id)}
                      >
                        Pulihkan
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <div className="bg-danger-50 border border-danger-100 p-4 rounded-xl flex gap-3 items-start">
        <AlertTriangle className="text-danger shrink-0 mt-0.5" size={18} />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-danger-700">Informasi Penting</p>
          <p className="text-xs text-danger-600 leading-relaxed">
            Data yang dipulihkan akan muncul kembali di laporan keuangan dan dashboard stok. 
            Pastikan Anda melakukan pengecekan ulang setelah proses pemulihan untuk menjaga integritas data.
          </p>
        </div>
      </div>
    </div>
  );
}
