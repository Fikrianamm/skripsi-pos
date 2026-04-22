/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher, formatRupiah } from "@/lib/func";
import { PageHeader } from "@/components/page-header";
import { JurnalTable, JurnalItem } from "./components/jurnal-table";
import { JurnalModal } from "./components/jurnal-modal";
import { SearchInput } from "@/components/search-input";
import {
  FilterLanjutan,
  FilterSection,
  FilterSelect,
} from "@/components/filter-lanjutan";
import { Skeleton } from "@heroui/react";
import { BookOpen, Hash } from "lucide-react";
import { DeleteConfirmModal } from "./components/delete-confirm-modal";
import { addToast } from "@heroui/toast";

const MONTHS = [
  { key: "0",  label: "Semua Bulan" },
  { key: "1",  label: "Januari"    },
  { key: "2",  label: "Februari"   },
  { key: "3",  label: "Maret"      },
  { key: "4",  label: "April"      },
  { key: "5",  label: "Mei"        },
  { key: "6",  label: "Juni"       },
  { key: "7",  label: "Juli"       },
  { key: "8",  label: "Agustus"    },
  { key: "9",  label: "September"  },
  { key: "10", label: "Oktober"    },
  { key: "11", label: "November"   },
  { key: "12", label: "Desember"   },
];

const YEARS = Array.from({ length: 7 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return { key: String(y), label: String(y) };
});

export default function JurnalPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(String(now.getMonth() + 1));
  const [tahun, setTahun] = useState(String(now.getFullYear()));
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<JurnalItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const params = new URLSearchParams({ tahun });
  if (bulan !== "0") params.set("bulan", bulan);
  if (search) params.set("search", search);

  const { data, isLoading, mutate } = useSWR(
    `/api/finance/jurnal?${params}`,
    fetcher,
  );
  const jurnals: JurnalItem[] = useMemo(() => data?.jurnals ?? [], [data]);
  const totalNominal: number = data?.totalNominal ?? 0;

  const periodLabel = useMemo(() => {
    const bl = MONTHS.find((m) => m.key === bulan);
    return bl && bl.key !== "0" ? `${bl.label} ${tahun}` : `Tahun ${tahun}`;
  }, [bulan, tahun]);

  const handleDelete = (item: JurnalItem) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/finance/jurnal?id=${selectedItem.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus jurnal");

      addToast({
        title: "Berhasil",
        description: "Jurnal manual berhasil dihapus.",
        color: "success",
      });
      mutate();
    } catch (error: any) {
      addToast({
        title: "Gagal",
        description: error.message,
        color: "danger",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Jurnal Umum"
        description="Pusat pencatatan seluruh aliran finansial — tersinkronisasi dari Pembayaran, Biaya, dan Tabungan. Input jurnal koreksi di sini."
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Nominal */}
        <div className="relative flex items-center gap-4 p-4 rounded-xl border border-default-200 bg-linear-to-br from-primary-50/60 to-default-50 overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-primary-400" />
          <div className="p-2.5 rounded-lg bg-white shadow-sm border border-default-100 ml-2">
            <BookOpen size={18} className="text-primary-500" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-default-500 font-semibold uppercase tracking-wide">Total Nominal</span>
            {isLoading ? (
              <Skeleton className="h-7 w-36 rounded-lg mt-1" />
            ) : (
              <span className="text-2xl font-bold text-default-900 tabular-nums tracking-tight">
                {formatRupiah(totalNominal)}
              </span>
            )}
            <span className="text-[11px] text-primary-500 font-medium mt-0.5">{periodLabel}</span>
          </div>
        </div>

        {/* Jumlah Entri */}
        <div className="relative flex items-center gap-4 p-4 rounded-xl border border-default-200 bg-linear-to-br from-default-100/60 to-default-50 overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-default-400" />
          <div className="p-2.5 rounded-lg bg-white shadow-sm border border-default-100 ml-2">
            <Hash size={18} className="text-default-500" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-default-500 font-semibold uppercase tracking-wide">Jumlah Entri</span>
            {isLoading ? (
              <Skeleton className="h-7 w-20 rounded-lg mt-1" />
            ) : (
              <span className="text-2xl font-bold text-default-900 tabular-nums tracking-tight">
                {jurnals.length.toLocaleString("id-ID")}
              </span>
            )}
            <span className="text-[11px] text-default-500 font-medium mt-0.5">transaksi tercatat</span>
          </div>
        </div>
      </div>

      {/* Filter + Action bar */}
      <div className="flex flex-col md:flex-row gap-2">
        <SearchInput
          value={search}
          placeholder="Cari ref, keterangan, akun"
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="w-full"
        />
        <div className="flex flex-row gap-2 items-center justify-start">
          <FilterLanjutan
            activeCount={
              bulan !== String(now.getMonth() + 1) ||
              tahun !== String(now.getFullYear())
                ? 1
                : 0
            }
            onReset={() => {
              setSearch("");
              setBulan(String(now.getMonth() + 1));
              setTahun(String(now.getFullYear()));
            }}
          >
            <FilterSection label="Bulan">
              <FilterSelect options={MONTHS} value={bulan} onChange={setBulan} />
            </FilterSection>
            <FilterSection label="Tahun">
              <FilterSelect options={YEARS} value={tahun} onChange={setTahun} />
            </FilterSection>
          </FilterLanjutan>
          <JurnalModal
            isOpen={isModalOpen}
            onOpenChange={(o) => {
              setIsModalOpen(o);
            }}
            onSuccess={() => mutate()}
          />
        </div>
      </div>

      <JurnalTable
        jurnals={jurnals}
        isLoading={isLoading}
        totalNominal={totalNominal}
        onDeleted={handleDelete}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        item={selectedItem}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
