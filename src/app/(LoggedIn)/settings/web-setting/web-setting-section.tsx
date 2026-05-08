/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/skeleton";
import { useState, useEffect } from "react";
import { Input, Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Checkbox } from "@heroui/checkbox";
import {
  Save,
  Globe,
  CreditCard,
  Factory,
  Landmark,
  Building,
} from "lucide-react";
import { addToast } from "@heroui/toast";

export default function WebSettingSection() {
  const [settings, setSettings] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [kasBanks, setKasBanks] = useState<any[]>([]);
  const [selectedRekeningIds, setSelectedRekeningIds] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [settingsRes, accountsRes, kasBankRes] = await Promise.all([
          fetch("/api/admin/settings"),
          fetch("/api/finance/akun?isActive=true"),
          fetch("/api/finance/kas-bank?jenisRekening=BANK"),
        ]);

        const settingsData = await settingsRes.json();
        const accountsData = await accountsRes.json();
        const kasBankData = await kasBankRes.json();

        setSettings(settingsData);
        setLogoPreview(settingsData.logoUrl || null);
        setAccounts(accountsData.akuns || []);
        setKasBanks(
          (kasBankData.kasBanks || []).filter((kb: any) => kb.isActive),
        );

        // Parse saved rekening IDs
        if (settingsData.invoiceRekeningIds) {
          try {
            setSelectedRekeningIds(JSON.parse(settingsData.invoiceRekeningIds));
          } catch {
            setSelectedRekeningIds([]);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        addToast({
          title: "Gagal memuat data",
          description: "Tidak dapat mengambil data pengaturan atau akun.",
          color: "danger",
        });
      } finally {
        setIsPending(false);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      let finalLogoUrl = settings.logoUrl;

      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        formData.append("folder", "settings");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload logo");
        }

        const uploadData = await uploadRes.json();
        finalLogoUrl = uploadData.url;
      }

      const payload = {
        ...settings,
        logoUrl: finalLogoUrl,
        invoiceRekeningIds: selectedRekeningIds,
      };

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update");

      setSettings(payload);
      setLogoFile(null); // Reset file after successful upload

      addToast({
        title: "Berhasil!",
        description: "Pengaturan web telah diperbarui.",
        color: "success",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      addToast({
        title: "Gagal!",
        description: "Terjadi kesalahan saat menyimpan pengaturan.",
        color: "danger",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isPending) {
    return (
      <div className="space-y-6 py-4 max-w-4xl">
        <Skeleton className="h-6 w-32 rounded-md" />
        <Skeleton className="h-4 w-64 rounded-md" />
        <Divider />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-20 w-full rounded-md" />
          <Skeleton className="h-20 w-full rounded-md" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-0">Web Setting</h2>
      <p className="text-muted-foreground">
        Konfigurasi identitas perusahaan, preferensi sistem, dan pemetaan
        keuangan.
      </p>
      <Divider />

      <form
        onSubmit={handleSubmit}
        className="space-y-8 py-4 max-w-4xl overflow-y-auto max-h-[calc(100vh-250px)] px-1"
      >
        {/* 1. Profil & Identitas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Globe size={18} />
            <h3 className="font-medium text-lg">
              Profil & Identitas Perusahaan
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Logo Perusahaan</label>
              <div className="flex items-center gap-4">
                <div className="aspect-square size-16 rounded-md border border-default-200 bg-default-50 flex flex-col items-center justify-center overflow-hidden shrink-0">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building className="size-6 text-default-400" />
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <Input
                    type="file"
                    accept="image/*"
                    size="sm"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          addToast({
                            title: "File terlalu besar",
                            description: "Maksimal 5MB",
                            color: "danger",
                          });
                          return;
                        }
                        setLogoFile(file);
                        setLogoPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <p className="text-xs text-default-500">
                    Maks. 5MB. Format: JPG, PNG.
                  </p>
                </div>
              </div>
            </div>
            <Input
              label="Nama Perusahaan"
              placeholder="Masukkan nama perusahaan"
              value={settings.namaPerusahaan}
              onValueChange={(v) =>
                setSettings({ ...settings, namaPerusahaan: v })
              }
            />
            <Input
              label="Nomor Kontak"
              placeholder="Contoh: 081234567890"
              value={settings.nomorKontak || ""}
              onValueChange={(v) =>
                setSettings({ ...settings, nomorKontak: v })
              }
            />
            <Input
              label="Email Perusahaan"
              placeholder="Masukkan email perusahaan"
              value={settings.email || ""}
              onValueChange={(v) => setSettings({ ...settings, email: v })}
            />
            <Textarea
              label="Alamat"
              placeholder="Masukkan alamat lengkap"
              value={settings.alamat || ""}
              onValueChange={(v) => setSettings({ ...settings, alamat: v })}
            />
          </div>
        </div>

        <Divider />

        {/* 2. Preferensi Transaksi & POS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <CreditCard size={18} />
            <h3 className="font-medium text-lg">Preferensi Transaksi & POS</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Prefix Nomor Order"
              placeholder="Contoh: INV-HQ-"
              value={settings.prefixOrder}
              onValueChange={(v) =>
                setSettings({ ...settings, prefixOrder: v })
              }
            />
            <Textarea
              label="Catatan Kaki Struk"
              placeholder="Teks yang akan muncul di bawah struk"
              value={settings.catatanKakiStruk || ""}
              onValueChange={(v) =>
                setSettings({ ...settings, catatanKakiStruk: v })
              }
            />
          </div>
        </div>

        <Divider />

        {/* 3. Preferensi Produksi */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Factory size={18} />
            <h3 className="font-medium text-lg">Preferensi Produksi</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Prefix Nomor SPK"
              placeholder="Contoh: SPK-"
              value={settings.prefixSpk}
              onValueChange={(v) => setSettings({ ...settings, prefixSpk: v })}
            />
            <Input
              type="number"
              label="Estimasi Hari Pengerjaan"
              placeholder="14"
              value={settings.estimasiHariPengerjaan.toString()}
              onValueChange={(v) =>
                setSettings({
                  ...settings,
                  estimasiHariPengerjaan: parseInt(v) || 0,
                })
              }
              endContent={
                <span className="text-default-400 text-small">Hari</span>
              }
            />
          </div>
        </div>

        <Divider />

        {/* 4. Pemetaan Akun Keuangan */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Save size={18} />
            <h3 className="font-medium text-lg">Pemetaan Akun Keuangan</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Akun Pendapatan Default"
              placeholder="Pilih akun pendapatan"
              selectedKeys={
                settings.defaultPendapatanAkunId
                  ? [settings.defaultPendapatanAkunId]
                  : []
              }
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                setSettings({
                  ...settings,
                  defaultPendapatanAkunId: selected as string,
                });
              }}
            >
              {accounts.map((akun: any) => (
                <SelectItem
                  key={akun.id}
                  textValue={`${akun.kodeAkun} - ${akun.namaAkun}`}
                >
                  {akun.kodeAkun} - {akun.namaAkun}
                </SelectItem>
              ))}
            </Select>
            <div className="p-3 bg-default-50 rounded-lg border border-default-200">
              <p className="text-xs text-muted-foreground italic">
                Pilih akun kemana uang hasil pesanan (Order) akan otomatis
                dicatat dalam jurnal saat pembayaran dilakukan.
              </p>
            </div>
          </div>
        </div>

        <Divider />

        {/* 5. Rekening Invoice */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Landmark size={18} />
            <h3 className="font-medium text-lg">Rekening Invoice</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Pilih rekening bank/kas yang akan ditampilkan di invoice pelanggan.
          </p>
          {kasBanks.length === 0 ? (
            <div className="p-3 bg-default-50 rounded-lg border border-default-200">
              <p className="text-xs text-muted-foreground italic">
                Belum ada rekening kas/bank aktif. Tambahkan terlebih dahulu di
                menu Kas &amp; Bank.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {kasBanks.map((kb: any) => (
                <div
                  key={kb.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedRekeningIds.includes(kb.id)
                      ? "border-primary bg-primary/5"
                      : "border-default-200 bg-default-50 hover:border-default-300"
                  }`}
                  onClick={() => {
                    setSelectedRekeningIds((prev) =>
                      prev.includes(kb.id)
                        ? prev.filter((id) => id !== kb.id)
                        : [...prev, kb.id],
                    );
                  }}
                >
                  <Checkbox
                    isSelected={selectedRekeningIds.includes(kb.id)}
                    onValueChange={(checked) => {
                      setSelectedRekeningIds((prev) =>
                        checked
                          ? [...prev, kb.id]
                          : prev.filter((id) => id !== kb.id),
                      );
                    }}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {kb.namaRekening}
                    </span>
                    {kb.nomorRekening && (
                      <span className="text-xs text-default-400">
                        {kb.nomorRekening}
                      </span>
                    )}
                    <span className="text-xs text-default-400 uppercase tracking-wide">
                      {kb.jenisRekening}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          type="submit"
          color="primary"
          isLoading={isUpdating}
          startContent={!isUpdating && <Save size={18} />}
        >
          {isUpdating ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </form>
    </>
  );
}
