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
    } catch (err) {
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
              <TableColumn>DATA / NOMOR</TableColumn>
              <TableColumn>KETERANGAN</TableColumn>
              <TableColumn>TANGGAL HAPUS</TableColumn>
              <TableColumn align="end">AKSI</TableColumn>
            </TableHeader>
            <TableBody 
              items={results} 
              isLoading={isLoading}
              loadingContent={<Spinner label="Memuat data sampah..." />}
              emptyContent="Tidak ada data di tempat sampah."
            >
              {(item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-default-700">
                        {item.nomorOrder || item.nama || item.ref || "N/A"}
                      </span>
                      <span className="text-xs text-default-400">
                        ID: {item.id.slice(0, 8)}...
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <p className="text-sm line-clamp-1">{item.keterangan || item.customer?.nama || "-"}</p>
                      {item.nominal && (
                        <p className="text-xs font-semibold text-primary">{formatRupiah(Number(item.nominal))}</p>
                      )}
                    </div>
                  </TableCell>
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
