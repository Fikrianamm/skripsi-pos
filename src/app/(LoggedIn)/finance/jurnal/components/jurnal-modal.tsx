"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { addToast } from "@heroui/toast";
import { DatePicker } from "@heroui/date-picker";
import { getLocalTimeZone, today, CalendarDate } from "@internationalized/date";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { ArrowDownCircle, ArrowUpCircle, Plus, RotateCcw } from "lucide-react";
import type { JurnalItem } from "./jurnal-table";

type Mode = "pengeluaran" | "pemasukan";

interface JurnalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  reversalItem?: JurnalItem | null;
}

type AkunItem = {
  id: string;
  namaAkun: string;
  kodeAkun: string;
  kelompok: string;
};

const KAS_GROUPS = ["AKTIVA_LANCAR"];
const PENGELUARAN_GROUPS = [
  "BEBAN_USAHA",
];
const PENDAPATAN_GROUPS = ["PENDAPATAN", "MODAL", "KEWAJIBAN"];

export function JurnalModal({
  isOpen,
  onOpenChange,
  onSuccess,
  reversalItem,
}: JurnalModalProps) {
  const isReversal = !!reversalItem;

  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("pengeluaran");
  const [keterangan, setKeterangan] = useState("");
  const [nominal, setNominal] = useState<number>(0);
  const [kasAkunId, setKasAkunId] = useState("");
  const [kategoriAkunId, setKategoriAkunId] = useState("");
  const [tanggal, setTanggal] = useState<CalendarDate | null>(
    today(getLocalTimeZone()),
  );

  // Pre-fill when triggered as reversal
  const [synced, setSynced] = useState(false);
  if (isReversal && !synced && isOpen) {
    // Reversal flips debet ↔ kredit
    setKasAkunId(reversalItem!.akunKreditId ?? "");
    setKategoriAkunId(reversalItem!.akunDebetId ?? "");
    setNominal(Number(reversalItem!.nominal));
    setKeterangan(`[KOREKSI] ${reversalItem!.keterangan}`);
    setMode("pemasukan");
    setSynced(true);
  }
  if (!isOpen && synced) setSynced(false);

  const { data: akunData } = useSWR("/api/finance/akun?isActive=true", fetcher);
  const rawAkuns: AkunItem[] = useMemo(() => {
    return (akunData?.akuns ?? []);
  }, [akunData]);

  const kasOptions = useMemo(
    () => rawAkuns.filter((a) => KAS_GROUPS.includes(a.kelompok)),
    [rawAkuns],
  );
  const pengeluaranOptions = useMemo(
    () => rawAkuns.filter((a) => PENGELUARAN_GROUPS.includes(a.kelompok)),
    [rawAkuns],
  );
  const pendapatanOptions = useMemo(
    () => rawAkuns.filter((a) => PENDAPATAN_GROUPS.includes(a.kelompok)),
    [rawAkuns],
  );
  const kategoriOptions =
    mode === "pengeluaran" ? pengeluaranOptions : pendapatanOptions;

  function getDebetKredit() {
    // Pengeluaran: Debet = Kategori Biaya, Kredit = Kas
    // Pemasukan:  Debet = Kas,             Kredit = Kategori
    return mode === "pengeluaran"
      ? { akunDebetId: kategoriAkunId, akunKreditId: kasAkunId }
      : { akunDebetId: kasAkunId, akunKreditId: kategoriAkunId };
  }

  function resetForm() {
    setKeterangan("");
    setNominal(0);
    setKasAkunId("");
    setKategoriAkunId("");
    setTanggal(today(getLocalTimeZone()));
    setMode("pengeluaran");
  }

  function switchMode(m: Mode) {
    setMode(m);
    setKasAkunId("");
    setKategoriAkunId("");
  }

  async function handleSubmit() {
    if (!keterangan || !kasAkunId || !kategoriAkunId || nominal <= 0) {
      addToast({
        title: "Form Belum Lengkap",
        description: "Harap isi semua field yang wajib",
        color: "warning",
      });
      return;
    }
    if (kasAkunId === kategoriAkunId) {
      addToast({
        title: "Akun Sama",
        description: "Akun kas dan kategori tidak boleh sama",
        color: "danger",
      });
      return;
    }
    setIsLoading(true);
    try {
      const { akunDebetId, akunKreditId } = getDebetKredit();
      const res = await fetch("/api/finance/jurnal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal: tanggal ? tanggal.toString() : new Date().toISOString(),
          keterangan,
          akunDebetId,
          akunKreditId,
          nominal,
          isReversal,
          reversalOfRef: reversalItem?.ref,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast({ title: "Gagal", description: json.error, color: "danger" });
        return;
      }
      addToast({
        title: "Berhasil!",
        description: isReversal
          ? "Entri koreksi dicatat"
          : "Transaksi berhasil dicatat",
        color: "success",
      });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch {
      addToast({
        title: "Error Koneksi",
        description: "Terjadi kesalahan saat menyimpan",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const isPengeluaran = mode === "pengeluaran";

  return (
    <>
      <Button
        color="primary"
        startContent={<Plus size={16} />}
        onPress={() => {
          onOpenChange(true);
        }}
        className="font-medium"
      >
        Catat Transaksi
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {isReversal ? (
                  <>
                    <span className="flex items-center gap-2">
                      <RotateCcw size={16} className="text-warning-600" />
                      Buat Entri Koreksi
                    </span>
                    <span className="text-xs font-normal text-warning-600">
                      Membalik entri:{" "}
                      <span className="font-mono">{reversalItem?.ref}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <span>Catat Transaksi Manual</span>
                    <span className="text-xs font-normal text-default-400">
                      Untuk transaksi di luar Order/POS (penyesuaian, koreksi,
                      keuangan lain-lain)
                    </span>
                  </>
                )}
              </ModalHeader>

              <ModalBody className="gap-5">
                {/* Mode Selector — disabled if reversal */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isReversal}
                    onClick={() => switchMode("pengeluaran")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left disabled:opacity-60 ${
                      isPengeluaran
                        ? "border-danger-400 bg-danger-50 shadow-sm"
                        : "border-default-200 hover:border-default-300 bg-content1"
                    }`}
                  >
                    <ArrowDownCircle
                      size={24}
                      className={
                        isPengeluaran ? "text-danger-500" : "text-default-300"
                      }
                    />
                    <div>
                      <p
                        className={`text-sm font-bold ${isPengeluaran ? "text-danger-700" : "text-default-500"}`}
                      >
                        Catat Pengeluaran
                      </p>
                      <p className="text-xs text-default-400">
                        Bayar biaya / beban
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    disabled={isReversal}
                    onClick={() => switchMode("pemasukan")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left disabled:opacity-60 ${
                      !isPengeluaran
                        ? "border-success-400 bg-success-50 shadow-sm"
                        : "border-default-200 hover:border-default-300 bg-content1"
                    }`}
                  >
                    <ArrowUpCircle
                      size={24}
                      className={
                        !isPengeluaran ? "text-success-500" : "text-default-300"
                      }
                    />
                    <div>
                      <p
                        className={`text-sm font-bold ${!isPengeluaran ? "text-success-700" : "text-default-500"}`}
                      >
                        Catat Pemasukan
                      </p>
                      <p className="text-xs text-default-400">
                        Terima uang / pendapatan lain
                      </p>
                    </div>
                  </button>
                </div>

                {/* Date + Nominal */}
                <div className="grid grid-cols-2 gap-4">
                  <DatePicker
                    label="Tanggal Transaksi"
                    value={tanggal}
                    onChange={setTanggal}
                    isRequired
                  />
                  <FormattedNumberInput
                    label="Nominal"
                    value={nominal}
                    onChange={(val) => setNominal(Number(val))}
                    isRequired
                    startContent={
                      <span className="text-default-400 text-xs">Rp</span>
                    }
                  />
                </div>

                {/* Kas & Kategori dynamically labeled */}
                <div
                  className={`grid grid-cols-1 gap-4 p-4 rounded-xl border ${isPengeluaran ? "border-danger-100 bg-danger-50/50" : "border-success-100 bg-success-50/50"}`}
                >
                  <Select
                    label={
                      isPengeluaran
                        ? "Diambil Dari (Sumber Kas)"
                        : "Disimpan Ke (Tujuan Kas)"
                    }
                    description={
                      isPengeluaran
                        ? "Rekening / kas yang akan dikurangi"
                        : "Rekening / kas yang akan bertambah"
                    }
                    placeholder="Pilih rekening kas..."
                    selectedKeys={kasAkunId ? [kasAkunId] : []}
                    onSelectionChange={(k) =>
                      setKasAkunId(Array.from(k)[0] as string)
                    }
                    isRequired
                  >
                    {kasOptions.map((a) => (
                      <SelectItem key={a.id} textValue={a.namaAkun}>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {a.namaAkun}
                          </span>
                          <span className="text-xs text-default-400">
                            {a.kodeAkun}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label={
                      isPengeluaran ? "Kategori Biaya" : "Kategori Pendapatan"
                    }
                    description={
                      isPengeluaran
                        ? "Jenis pengeluaran yang dicatat"
                        : "Jenis pendapatan atau sumber modal"
                    }
                    placeholder={
                      isPengeluaran
                        ? "Pilih jenis biaya..."
                        : "Pilih kategori pendapatan..."
                    }
                    selectedKeys={kategoriAkunId ? [kategoriAkunId] : []}
                    onSelectionChange={(k) =>
                      setKategoriAkunId(Array.from(k)[0] as string)
                    }
                    isRequired
                  >
                    {kategoriOptions.map((a) => (
                      <SelectItem key={a.id} textValue={a.namaAkun}>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {a.namaAkun}
                          </span>
                          <span className="text-xs text-default-400">
                            {a.kodeAkun} · {a.kelompok.replace("BEBAN_", "")}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <Textarea
                  label="Keterangan"
                  placeholder={
                    isPengeluaran
                      ? "Mis: Bayar listrik pabrik bulan Maret..."
                      : "Mis: Setoran modal tambahan dari owner..."
                  }
                  value={keterangan}
                  onValueChange={setKeterangan}
                  isRequired
                  minRows={2}
                />

                {/* Preview double-entry */}
                {kasAkunId && kategoriAkunId && nominal > 0 && (
                  <div className="flex items-start gap-3 bg-default-50 border border-default-200 rounded-xl px-4 py-3 text-xs text-default-500">
                    <span className="mt-0.5">📒</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-default-600 mb-1">
                        Preview Jurnal (Double-Entry):
                      </span>
                      <span>
                        <span className="text-success-700 font-bold">
                          DEBET{" "}
                        </span>
                        {isPengeluaran
                          ? kategoriOptions.find((a) => a.id === kategoriAkunId)
                              ?.namaAkun
                          : kasOptions.find((a) => a.id === kasAkunId)
                              ?.namaAkun}
                      </span>
                      <span>
                        <span className="text-danger-600 font-bold">
                          KREDIT{" "}
                        </span>
                        {isPengeluaran
                          ? kasOptions.find((a) => a.id === kasAkunId)?.namaAkun
                          : kategoriOptions.find((a) => a.id === kategoriAkunId)
                              ?.namaAkun}
                      </span>
                    </div>
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                <Button variant="flat" color="default" onPress={onClose}>
                  Batal
                </Button>
                <Button
                  color={
                    isReversal
                      ? "warning"
                      : isPengeluaran
                        ? "danger"
                        : "success"
                  }
                  onPress={handleSubmit}
                  isLoading={isLoading}
                  startContent={
                    isReversal ? (
                      <RotateCcw size={16} />
                    ) : isPengeluaran ? (
                      <ArrowDownCircle size={16} />
                    ) : (
                      <ArrowUpCircle size={16} />
                    )
                  }
                >
                  {isReversal
                    ? "Buat Koreksi"
                    : isPengeluaran
                      ? "Catat Pengeluaran"
                      : "Catat Pemasukan"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
