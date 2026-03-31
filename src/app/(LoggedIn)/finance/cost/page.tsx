"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, formatRupiah } from "@/lib/func";
import { Button } from "@heroui/react";
import { Plus, Receipt } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CostTable, CostData } from "./components/cost-table";
import { AddCostModal } from "./components/add-cost-modal";

export default function CostPage() {
  const { data, isLoading, mutate } = useSWR("/api/finance/cost", fetcher);
  const costs: CostData[] = data?.costs ?? [];

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Compute Total Cost (Bulan ini atau periode tertentu)
  const totalPengeluaran = costs.reduce((acc: number, cost) => acc + Number(cost.nominal), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pengeluaran Operasional"
        description="Kelola dan catat semua biaya operasional, gaji bulanan, tagihan, hingga pembelian yang memotong Kas/Bank Anda."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="flex flex-col gap-2 p-5 bg-danger-50 text-danger-800 rounded-xl border border-danger-200">
          <div className="flex items-center gap-2">
            <Receipt size={18} />
            <span className="text-sm font-semibold">Total Pengeluaran (Tercatat)</span>
          </div>
          <span className="text-2xl font-bold">{formatRupiah(totalPengeluaran)}</span>
          <span className="text-xs opacity-80 mt-1">
             Dari total {costs.length} transaksi bebean.
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center bg-default-50 p-4 rounded-xl border border-default-200">
        <div>
          <h2 className="text-lg font-bold text-default-800">Riwayat Pengeluaran</h2>
          <p className="text-sm text-default-500">Daftar beban tercatat dari yang terbaru</p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={16} />}
          onPress={() => setIsAddModalOpen(true)}
          className="font-medium"
        >
          Catat Pengeluaran
        </Button>
      </div>

      {/* Table */}
      <CostTable costs={costs} isLoading={isLoading} />

      {/* Modal */}
      <AddCostModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
