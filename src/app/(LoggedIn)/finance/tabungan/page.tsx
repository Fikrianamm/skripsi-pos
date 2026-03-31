"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
import { Button } from "@heroui/react";
import { Plus, PiggyBank } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TabunganTable } from "./components/tabungan-table";
import { TabunganModal } from "./components/tabungan-modal";
import { JenisTabunganModal } from "./components/jenis-tabungan-modal";

export default function TabunganPage() {
  const { data, isLoading, mutate } = useSWR("/api/finance/tabungan?limit=200", fetcher);
  const tabungans = data?.tabungans ?? [];

  const [isTabunganModalOpen, setIsTabunganModalOpen] = useState(false);
  const [isKategoriModalOpen, setIsKategoriModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Alokasi Tabungan Laba"
        description="Fitur untuk menyisihkan uang dari pendapatan operasional/kas berjalan menuju pos-pos tabungan rutin bulanan."
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-default-50 p-4 rounded-xl border border-default-200 gap-4">
        <div>
          <h2 className="text-lg font-bold text-default-800">Riwayat Setoran Tabungan</h2>
          <p className="text-sm text-default-500">
             Log alokasi kas tersimpan berdasarkan peruntukannya.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
           <Button
             color="default"
             variant="flat"
             onPress={() => setIsKategoriModalOpen(true)}
             className="font-medium"
             startContent={<PiggyBank size={16} />}
           >
             Kategori (Master) Baru
           </Button>
           <Button
             color="primary"
             startContent={<Plus size={16} />}
             onPress={() => setIsTabunganModalOpen(true)}
             className="font-medium"
           >
             Catat Setoran (Alokasi)
           </Button>
        </div>
      </div>

      <TabunganTable tabungans={tabungans} isLoading={isLoading} />

      <TabunganModal
        isOpen={isTabunganModalOpen}
        onOpenChange={setIsTabunganModalOpen}
        onSuccess={() => mutate()}
      />

      <JenisTabunganModal
        isOpen={isKategoriModalOpen}
        onOpenChange={setIsKategoriModalOpen}
        onSuccess={() => {}}
      />
    </div>
  );
}
