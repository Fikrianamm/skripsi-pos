"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
import { Button } from "@heroui/react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { JurnalTable } from "./components/jurnal-table";
import { JurnalModal } from "./components/jurnal-modal";

export default function JurnalPage() {
  const { data, isLoading, mutate } = useSWR("/api/finance/jurnal?limit=200", fetcher);
  const jurnals = data?.jurnals ?? [];

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Buku Besar / Jurnal Umum"
        description="Pusat pencatatan seluruh aliran finansial perusahaan (Double-Entry). Jurnal ini tersinkronisasi murni dari Pembayaran Order dan Biaya Operasional."
      />

      <div className="flex justify-between items-center bg-default-50 p-4 rounded-xl border border-default-200">
        <div>
          <h2 className="text-lg font-bold text-default-800">Daftar Transaksi (Jurnal)</h2>
          <p className="text-sm text-default-500">Menampilkan hingga 200 transaksi terbaru</p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={16} />}
          onPress={() => setIsModalOpen(true)}
          className="font-medium"
        >
          Input Jurnal Manual
        </Button>
      </div>

      <JurnalTable jurnals={jurnals} isLoading={isLoading} />

      <JurnalModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
