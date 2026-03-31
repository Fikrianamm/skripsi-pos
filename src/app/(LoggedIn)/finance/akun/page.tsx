/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
import { Button } from "@heroui/react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AkunTable } from "./components/akun-table";
import { AkunModal } from "./components/akun-modal";

export default function AkunPage() {
  const { data, isLoading, mutate } = useSWR("/api/finance/akun", fetcher);
  const akuns = data?.akuns ?? [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAkun, setSelectedAkun] = useState<any>(null);

  function handleAdd() {
    setSelectedAkun(null);
    setIsModalOpen(true);
  }

  function handleEdit(akunData: any) {
    setSelectedAkun(akunData);
    setIsModalOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Manajemen Akun (Chart of Accounts)"
        description="Pusat konfigurasi akun buku besar. Kumpulan rekening yang akan menjadi penampung nilai transaksi Jurnal Umum."
      />

      <div className="flex justify-between items-center bg-default-50 p-4 rounded-xl border border-default-200">
        <div>
          <h2 className="text-lg font-bold text-default-800">Daftar Rekening Pembukuan</h2>
          <p className="text-sm text-default-500">
            Total {akuns.length} akun terdaftar
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={16} />}
          onPress={handleAdd}
          className="font-medium"
        >
          Tambah Akun
        </Button>
      </div>

      <AkunTable 
        akuns={akuns} 
        isLoading={isLoading} 
        onEdit={handleEdit} 
      />

      <AkunModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => mutate()}
        editData={selectedAkun}
      />
    </div>
  );
}
