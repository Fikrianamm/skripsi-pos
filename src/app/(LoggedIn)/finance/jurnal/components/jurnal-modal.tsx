/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Input,
} from "@heroui/react";
import { addToast } from "@heroui/toast";
import { DatePicker } from "@heroui/date-picker";
import { getLocalTimeZone, today, CalendarDate } from "@internationalized/date";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { ArrowDownCircle, ArrowUpCircle, Plus, Upload, X, FileText } from "lucide-react";

type Mode = "pengeluaran" | "pemasukan";

interface JurnalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type AkunItem = {
  id: string;
  namaAkun: string;
  kodeAkun: string;
  kelompok: string;
};

const KAS_GROUPS = ["AKTIVA_LANCAR"];
const PENGELUARAN_GROUPS = ["BEBAN_USAHA"];
const PENDAPATAN_GROUPS = ["PENDAPATAN", "MODAL", "KEWAJIBAN"];

export function JurnalModal({
  isOpen,
  onOpenChange,
  onSuccess,
}: JurnalModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("pengeluaran");
  const [namaBiaya, setNamaBiaya] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [nominal, setNominal] = useState<number>(0);
  const [kasAkunId, setKasAkunId] = useState("");
  const [kategoriAkunId, setKategoriAkunId] = useState("");
  const [tanggal, setTanggal] = useState<CalendarDate | null>(
    today(getLocalTimeZone()),
  );
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [buktiNota, setBuktiNota] = useState("");

  const { data: akunData } = useSWR("/api/finance/akun?isActive=true", fetcher);
  const rawAkuns: AkunItem[] = useMemo(() => {
    return akunData?.akuns ?? [];
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
    setNamaBiaya("");
    setKeterangan("");
    setNominal(0);
    setKasAkunId("");
    setKategoriAkunId("");
    setTanggal(today(getLocalTimeZone()));
    setMode("pengeluaran");
    setFile(null);
    setBuktiNota("");
  }

  function switchMode(m: Mode) {
    setMode(m);
    setKasAkunId("");
    setKategoriAkunId("");
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      addToast({ title: "Gagal", description: "Hanya file gambar yang diizinkan", color: "danger" });
      return;
    }

    setFile(selectedFile);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah file");

      setBuktiNota(data.url);
      addToast({ title: "Berhasil", description: "Bukti nota berhasil diunggah", color: "success" });
    } catch (err: any) {
      addToast({ title: "Gagal Unggah", description: err.message, color: "danger" });
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  async function handleSubmit() {
    const isPengeluaran = mode === "pengeluaran";
    if (!keterangan || !kasAkunId || !kategoriAkunId || nominal <= 0 || (isPengeluaran && !namaBiaya)) {
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
          namaBiaya: isPengeluaran ? namaBiaya : null,
          buktiNota: isPengeluaran ? buktiNota : null,
          akunDebetId,
          akunKreditId,
          nominal,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast({ title: "Gagal", description: json.error, color: "danger" });
        return;
      }
      addToast({
        title: "Berhasil!",
        description: "Transaksi berhasil dicatat",
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
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span>Catat Transaksi Manual</span>
                <span className="text-xs font-normal text-default-400">
                  Untuk transaksi di luar Order/POS (penyesuaian, koreksi,
                  keuangan lain-lain)
                </span>
              </ModalHeader>

              <ModalBody className="gap-5 py-6">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
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

                {isPengeluaran && (
                  <Input
                    label="Nama Biaya / Keperluan"
                    placeholder="Mis: Bayar Listrik, Gaji Karyawan, Iklan Facebook..."
                    value={namaBiaya}
                    onValueChange={setNamaBiaya}
                    isRequired
                    variant="bordered"
                  />
                )}

                {/* Date + Nominal */}
                <div className="grid grid-cols-2 gap-4">
                  <DatePicker
                    label="Tanggal Transaksi"
                    value={tanggal}
                    onChange={setTanggal}
                    isRequired
                    variant="bordered"
                  />
                  <FormattedNumberInput
                    label="Nominal"
                    value={nominal}
                    onChange={(val) => setNominal(Number(val))}
                    isRequired
                    placeholder="0"
                    variant="bordered"
                    startContent={
                      <span className="text-default-400 text-xs">Rp</span>
                    }
                  />
                </div>

                {/* Kas & Kategori dynamically labeled */}
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border ${isPengeluaran ? "border-danger-100 bg-danger-50/50" : "border-success-100 bg-success-50/50"}`}
                >
                  <Select
                    label={
                      isPengeluaran
                        ? "Sumber Dana"
                        : "Tujuan Kas"
                    }
                    placeholder="Pilih rekening..."
                    selectedKeys={kasAkunId ? [kasAkunId] : []}
                    onSelectionChange={(k) =>
                      setKasAkunId(Array.from(k)[0] as string)
                    }
                    isRequired
                    variant="flat"
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
                    placeholder="Pilih kategori..."
                    selectedKeys={kategoriAkunId ? [kategoriAkunId] : []}
                    onSelectionChange={(k) =>
                      setKategoriAkunId(Array.from(k)[0] as string)
                    }
                    isRequired
                    variant="flat"
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
                  label="Keterangan Tambahan"
                  placeholder={
                    isPengeluaran
                      ? "Mis: Pembayaran untuk periode Maret 2024..."
                      : "Mis: Penambahan modal kerja dari kas pribadi..."
                  }
                  value={keterangan}
                  onValueChange={setKeterangan}
                  isRequired
                  minRows={2}
                  variant="bordered"
                />

                {isPengeluaran && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold text-default-700">Bukti Nota / Kwitansi (Opsional)</p>
                    <div className="flex items-center gap-4">
                      {file ? (
                        <div className="relative group">
                          <div className="w-24 h-24 rounded-xl overflow-hidden border border-default-200 bg-default-100 flex items-center justify-center">
                            {buktiNota ? (
                              <img src={buktiNota} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-default-400">
                                <Upload size={20} className="animate-bounce" />
                                <span className="text-[10px]">Uploading...</span>
                              </div>
                            )}
                          </div>
                          {!uploading && (
                            <button 
                              onClick={() => { setFile(null); setBuktiNota(""); }}
                              className="absolute -top-2 -right-2 bg-danger text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-default-200 rounded-xl cursor-pointer hover:border-primary transition-colors hover:bg-primary-50/50">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload size={24} className="text-default-400 mb-2" />
                            <p className="text-xs text-default-500 font-medium">Klik untuk unggah foto nota</p>
                            <p className="text-[10px] text-default-400 mt-1">PNG, JPG up to 5MB</p>
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Preview double-entry */}
                {kasAkunId && kategoriAkunId && nominal > 0 && (
                  <div className="flex items-start gap-3 bg-default-50 border border-default-200 rounded-xl px-4 py-3 text-xs text-default-500">
                    <FileText size={16} className="mt-0.5 text-default-400" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-default-600 mb-1 uppercase tracking-wider text-[10px]">
                        Preview Jurnal (Double-Entry)
                      </span>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
                          <span className="font-bold text-default-700">DEBET:</span>
                        </span>
                        <span className="text-default-600">
                          {isPengeluaran
                            ? kategoriOptions.find((a) => a.id === kategoriAkunId)
                                ?.namaAkun
                            : kasOptions.find((a) => a.id === kasAkunId)
                                ?.namaAkun}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-danger-500" />
                          <span className="font-bold text-default-700">KREDIT:</span>
                        </span>
                        <span className="text-default-600">
                          {isPengeluaran
                            ? kasOptions.find((a) => a.id === kasAkunId)?.namaAkun
                            : kategoriOptions.find((a) => a.id === kategoriAkunId)
                                ?.namaAkun}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>

              <ModalFooter className="border-t border-default-100">
                <Button variant="flat" color="default" onPress={onClose} radius="lg" className="font-medium">
                  Batal
                </Button>
                <Button
                  color={
                    isPengeluaran
                      ? "danger"
                      : "success"
                  }
                  onPress={handleSubmit}
                  isLoading={isLoading}
                  radius="lg"
                  className="font-bold shadow-lg"
                  startContent={
                    isPengeluaran ? (
                      <ArrowDownCircle size={18} />
                    ) : (
                      <ArrowUpCircle size={18} />
                    )
                  }
                >
                  {isPengeluaran
                    ? "Simpan Pengeluaran"
                    : "Simpan Pemasukan"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

