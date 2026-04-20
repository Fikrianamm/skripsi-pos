/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
import { PageHeader } from "@/components/page-header";
import { AkunTable } from "./components/akun-table";
import { AkunModal } from "./components/akun-modal";
import { KasBankTable } from "./components/kas-bank-table";
import { KasBankModal } from "./components/kas-bank-modal";
import { SearchInput } from "@/components/search-input";
import {
  FilterLanjutan,
  FilterSection,
  FilterSelect,
} from "@/components/filter-lanjutan";
import { useDebounce } from "@/hooks/use-debounce";
import { Divider, Tabs, Tab, type Selection } from "@heroui/react";
import { Wallet, BookOpen } from "lucide-react";

export default function AkunPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [kelompok, setKelompok] = useState<string>("");
  const [isAkunModalOpen, setIsAkunModalOpen] = useState(false);
  const [selectedAkun, setSelectedAkun] = useState<any>(null);

  const [isKasBankModalOpen, setIsKasBankModalOpen] = useState(false);
  const [selectedKasBank, setSelectedKasBank] = useState<any>(null);

  // Fetch Akun Data
  const { data, isLoading, mutate } = useSWR(
    `/api/finance/akun?search=${debouncedSearch}&kelompok=${kelompok}`,
    fetcher,
  );

  // Fetch Kas Bank Data
  const {
    data: kasBankData,
    isLoading: isLoadingKasBank,
    mutate: mutateKasBank,
  } = useSWR(`/api/finance/kas-bank`, fetcher);

  const { data: kelompokData, mutate: kelompokMutate } = useSWR(
    `/api/finance/akun/kelompok`,
    fetcher,
  );

  const [selectedStatus, setSelectedStatus] = useState<Selection>(
    new Set(["all"]),
  );
  const statusKey = Array.from(selectedStatus)[0] as string;

  const akuns = useMemo(() => {
    let list = data?.akuns ?? [];
    if (statusKey !== "all") {
      const isActiveFilter = statusKey === "active";
      list = list.filter((a: any) => a.isActive === isActiveFilter);
    }
    return list;
  }, [data, statusKey]);
  const kasBanks = useMemo(() => {
    let kbList = kasBankData?.kasBanks ?? [];
    if (debouncedSearch) {
      kbList = kbList.filter(
        (kb: any) =>
          kb.namaRekening
            ?.toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          (kb.nomorRekening &&
            kb.nomorRekening
              .toLowerCase()
              .includes(debouncedSearch.toLowerCase())),
      );
    }
    if (statusKey !== "all") {
      const isActiveFilter = statusKey === "active";
      kbList = kbList.filter((kb: any) => kb.isActive === isActiveFilter);
    }

    return kbList;
  }, [kasBankData, debouncedSearch, statusKey]);

  function handleEditAkun(akunData: any) {
    setSelectedAkun(akunData);
    setIsAkunModalOpen(true);
  }

  function handleEditKasBank(kasBankData: any) {
    setSelectedKasBank(kasBankData);
    setIsKasBankModalOpen(true);
  }

  const kelompokOptions = useMemo(
    () => [
      { key: "", label: "Semua Kelompok" },
      ...(kelompokData?.kelompok ?? []).map((a: any) => ({
        key: a,
        label: a.replace(/_/g, " ").toUpperCase(),
      })),
    ],
    [kelompokData],
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Manajemen Akun"
        description="Pusat konfigurasi akun buku besar dan rekening bank untuk penampung nilai transaksi keuangan."
      />

      <div className="flex flex-col md:flex-row gap-2">
        <SearchInput
          value={search}
          placeholder="Cari akun atau kas..."
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="w-full"
        />
        <div className="flex flex-row gap-2 items-center justify-start">
          <FilterLanjutan
            activeCount={statusKey !== "all" || kelompok !== "" ? 1 : 0}
            onReset={() => {
              setSelectedStatus(new Set(["all"]));
              setSearch("");
              setKelompok("");
            }}
          >
            <FilterSection label="Kelompok Akun">
              <FilterSelect
                options={kelompokOptions}
                value={kelompok}
                onChange={setKelompok}
              />
            </FilterSection>
            <FilterSection label="Status (Akun & Rekening)">
              <FilterSelect
                options={[
                  { key: "all", label: "Semua Status" },
                  { key: "active", label: "Aktif" },
                  { key: "inactive", label: "Tidak Aktif" },
                ]}
                value={statusKey}
                onChange={(key) => setSelectedStatus(new Set([key]))}
              />
            </FilterSection>
          </FilterLanjutan>
          <AkunModal
            isOpen={isAkunModalOpen}
            onOpenChange={(val) => {
              setIsAkunModalOpen(val);
              if (!val) setSelectedAkun(null);
            }}
            onSuccess={() => {
              mutate();
              kelompokMutate();
              mutateKasBank();
            }}
            editData={selectedAkun}
          />
          <KasBankModal
            isOpen={isKasBankModalOpen}
            onOpenChange={(val) => {
              setIsKasBankModalOpen(val);
              if (!val) setSelectedKasBank(null);
            }}
            onSuccess={() => {
              mutateKasBank();
              mutate();
            }}
            editData={selectedKasBank}
          />
        </div>
      </div>

      <Tabs
        aria-label="Management Tabs"
        color="primary"
        variant="underlined"
        classNames={{ cursor: "w-full bg-primary" }}
      >
        <Tab
          key="akun"
          title={
            <div className="flex items-center gap-2">
              <BookOpen size={16} />
              <span>Buku Besar</span>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            {data !== undefined && (
              <div className="flex gap-2 items-center">
                <span className="text-xs text-default-400 tabular-nums">
                  Menampilkan {data.akuns.length ? data.akuns.length : 0} akun
                  buku besar
                </span>
                <Divider className="flex-1" />
              </div>
            )}

            <AkunTable
              akuns={akuns}
              isLoading={isLoading}
              onEdit={handleEditAkun}
            />
          </div>
        </Tab>

        <Tab
          key="kas-bank"
          title={
            <div className="flex items-center gap-2">
              <Wallet size={16} />
              <span>Daftar Rekening Kas & Bank</span>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            {kasBankData !== undefined && (
              <div className="flex gap-2 items-center">
                <span className="text-xs text-default-400 tabular-nums">
                  Menampilkan {kasBanks.length ? kasBanks.length : 0} rekening
                  terdaftar
                </span>
                <Divider className="flex-1" />
              </div>
            )}
            <KasBankTable
              kasBanks={kasBanks}
              isLoading={isLoadingKasBank}
              onEdit={handleEditKasBank}
            />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
