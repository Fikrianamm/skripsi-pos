"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip, Divider, Switch } from "@heroui/react";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Alert } from "@heroui/alert";
import { addToast } from "@heroui/toast";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { fetcher } from "@/lib/func";
import useSWR from "swr";
import { CheckCircle, ClipboardList, Pencil, User, X } from "lucide-react";
import { SPKDetail } from "./types";

const editSpkSchema = z.object({
  karyawanId: z.string().min(1, "Karyawan wajib dipilih"),
  model: z.string().optional(),
  tali: z.string().optional(),
  ukuran: z.string().optional(),
  jumlah: z.string().min(1, "Jumlah wajib diisi"),
  tanggalSetor: z.string().optional(),
  catatan: z.string().optional(),
});

type EditSpkFormData = z.infer<typeof editSpkSchema>;

interface Props {
  orderId: string;
  spk: SPKDetail;
  onUpdated: () => void;
}

export function SpkCard({ orderId, spk, onUpdated }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState("");
  const [isTogglingAcc, setIsTogglingAcc] = useState(false);

  const { data: karyawanData } = useSWR(
    "/api/admin/karyawan?isActive=true&limit=100",
    fetcher,
  );
  const karyawanList: { id: string; nama: string; posisi: string | null }[] =
    karyawanData?.results ?? [];

  const form = useForm<EditSpkFormData>({
    resolver: zodResolver(editSpkSchema),
    defaultValues: {
      karyawanId: spk.karyawanId,
      model: spk.model ?? "",
      tali: spk.tali ?? "",
      ukuran: spk.ukuran ?? "",
      jumlah: String(spk.jumlah),
      tanggalSetor: spk.tanggalSetor
        ? new Date(spk.tanggalSetor).toISOString().slice(0, 10)
        : "",
      catatan: spk.catatan ?? "",
    },
  });

  async function onSubmitEdit(data: EditSpkFormData) {
    setEditError("");
    try {
      const res = await fetch(`/api/order/${orderId}/spk`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, jumlah: Number(data.jumlah) }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEditError(json.error || "Terjadi kesalahan.");
        return;
      }
      addToast({ title: "SPK diperbarui", color: "success" });
      setIsEditing(false);
      onUpdated();
    } catch {
      setEditError("Terjadi kesalahan jaringan.");
    }
  }

  async function handleToggleAcc(val: boolean) {
    setIsTogglingAcc(true);
    try {
      const res = await fetch(`/api/order/${orderId}/spk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accCetak: val }),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast({ title: "Gagal", description: json.error, color: "danger" });
        return;
      }
      addToast({
        title: val ? "ACC Cetak diaktifkan" : "ACC Cetak dinonaktifkan",
        color: "success",
      });
      onUpdated();
    } finally {
      setIsTogglingAcc(false);
    }
  }

  const statusBadge =
    spk.statusSPK === "AKTIF"
      ? { color: "success" as const, label: "Aktif" }
      : spk.statusSPK === "SELESAI"
        ? { color: "primary" as const, label: "Selesai" }
        : spk.statusSPK === "REVISI"
          ? { color: "warning" as const, label: "Revisi" }
          : { color: "default" as const, label: spk.statusSPK };

  return (
    <Card shadow="sm" className="border border-default-200">
      <CardHeader className="pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList size={16} className="text-default-500" />
          <span className="font-semibold text-sm">SPK Jahit</span>
          <Chip size="sm" color={statusBadge.color} variant="flat">
            {statusBadge.label}
          </Chip>
        </div>
        {!isEditing && (
          <Button
            size="sm"
            variant="light"
            isIconOnly
            onPress={() => setIsEditing(true)}
          >
            <Pencil size={14} />
          </Button>
        )}
      </CardHeader>

      <CardBody className="pt-0 gap-3">
        {isEditing ? (
          /* ── EDIT MODE ── */
          <form
            noValidate
            onSubmit={form.handleSubmit(onSubmitEdit)}
            className="flex flex-col gap-3"
          >
            {editError && <Alert color="danger" title={editError} />}

            <Controller
              name="karyawanId"
              control={form.control}
              render={({ field }) => (
                <Select
                  label="Penjahit"
                  size="sm"
                  selectedKeys={
                    field.value ? new Set([field.value]) : new Set()
                  }
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as string;
                    field.onChange(val ?? "");
                  }}
                  isInvalid={!!form.formState.errors.karyawanId}
                  errorMessage={form.formState.errors.karyawanId?.message}
                  isDisabled={form.formState.isSubmitting}
                >
                  {karyawanList.map((k) => (
                    <SelectItem key={k.id} textValue={k.nama}>
                      {k.nama}
                      {k.posisi ? ` (${k.posisi})` : ""}
                    </SelectItem>
                  ))}
                </Select>
              )}
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                size="sm"
                label="Model"
                {...form.register("model")}
                isDisabled={form.formState.isSubmitting}
              />
              <Input
                size="sm"
                label="Ukuran"
                {...form.register("ukuran")}
                isDisabled={form.formState.isSubmitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                size="sm"
                label="Tali"
                {...form.register("tali")}
                isDisabled={form.formState.isSubmitting}
              />
              <Input
                size="sm"
                label="Jumlah"
                type="number"
                {...form.register("jumlah")}
                isInvalid={!!form.formState.errors.jumlah}
                errorMessage={form.formState.errors.jumlah?.message}
                isDisabled={form.formState.isSubmitting}
              />
            </div>
            <Input
              size="sm"
              label="Tanggal Setor"
              type="date"
              {...form.register("tanggalSetor")}
              isDisabled={form.formState.isSubmitting}
            />
            <Textarea
              size="sm"
              label="Catatan"
              minRows={2}
              {...form.register("catatan")}
              isDisabled={form.formState.isSubmitting}
            />

            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="flat"
                isIconOnly
                onPress={() => {
                  setIsEditing(false);
                  setEditError("");
                  form.reset();
                }}
                isDisabled={form.formState.isSubmitting}
              >
                <X size={14} />
              </Button>
              <Button
                size="sm"
                color="primary"
                type="submit"
                isLoading={form.formState.isSubmitting}
                isDisabled={form.formState.isSubmitting}
              >
                Simpan
              </Button>
            </div>
          </form>
        ) : (
          /* ── VIEW MODE ── */
          <div className="flex flex-col gap-2 text-sm">
            {/* Karyawan */}
            <div className="flex items-center gap-2">
              <User size={14} className="text-default-400 shrink-0" />
              <div>
                <p className="text-xs text-default-400">Penjahit</p>
                <p className="font-medium">{spk.karyawan.nama}</p>
                {spk.karyawan.posisi && (
                  <p className="text-xs text-default-400">
                    {spk.karyawan.posisi}
                  </p>
                )}
              </div>
            </div>

            <Divider className="my-0.5" />

            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              <div>
                <p className="text-xs text-default-400">Model</p>
                <p>{spk.model || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-default-400">Ukuran</p>
                <p>{spk.ukuran || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-default-400">Tali</p>
                <p>{spk.tali || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-default-400">Jumlah</p>
                <p className="font-medium">{spk.jumlah} pcs</p>
              </div>
            </div>

            {spk.tanggalSetor && (
              <div>
                <p className="text-xs text-default-400">Tanggal Setor</p>
                <p>
                  {new Date(spk.tanggalSetor).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}

            {spk.catatan && (
              <div>
                <p className="text-xs text-default-400">Catatan</p>
                <p className="text-xs text-default-600">{spk.catatan}</p>
              </div>
            )}

            <Divider className="my-0.5" />

            {/* ACC Cetak toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle
                  size={14}
                  className={spk.accCetak ? "text-success" : "text-default-300"}
                />
                <span className="text-xs font-medium">ACC Cetak</span>
              </div>
              <Switch
                size="sm"
                color="success"
                isSelected={spk.accCetak}
                onValueChange={handleToggleAcc}
                isDisabled={isTogglingAcc}
              />
            </div>
            {spk.accCetak && spk.accCetakOleh && (
              <p className="text-xs text-default-400">
                Di-ACC oleh {spk.accCetakOleh}
                {spk.accCetakAt
                  ? ` · ${new Date(spk.accCetakAt).toLocaleDateString("id-ID")}`
                  : ""}
              </p>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
