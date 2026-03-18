/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import { parseDate } from "@internationalized/date";
import { Input, Textarea } from "@heroui/input";
import { Avatar, DatePicker, Select, SelectItem } from "@heroui/react";
import { FileText, Store, Calendar, StickyNote, Paperclip } from "lucide-react";
import type { PenerimaanFormData } from "../schema";

function CardSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-divider bg-content1 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-divider bg-default-50">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="p-5 flex flex-col gap-4">{children}</div>
    </div>
  );
}

interface Props {
  control: Control<PenerimaanFormData>;
  errors: FieldErrors<PenerimaanFormData>;
  supplierData: any;
  file: File | null;
  onFileChange: (f: File | null) => void;
}

export function FakturInfoCard({
  control,
  errors,
  supplierData,
  file,
  onFileChange,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <CardSection icon={<FileText size={16} />} title="Info Faktur">
        <Controller
          name="tanggal"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="Tanggal Terima"
              hideTimeZone
              showMonthAndYearPickers
              isRequired
              startContent={
                <Calendar size={16} className="text-foreground-400 shrink-0" />
              }
              value={field.value ? parseDate(field.value) : null}
              onChange={(date) => field.onChange(date ? date.toString() : "")}
              isInvalid={!!errors.tanggal}
              errorMessage={errors.tanggal?.message}
            />
          )}
        />
        <Controller
          name="nomorFaktur"
          control={control}
          render={({ field }) => (
            <Input
              label="Nomor Faktur"
              placeholder="Masukkan nomor faktur"
              startContent={
                <FileText size={16} className="text-foreground-400 shrink-0" />
              }
              {...field}
              isInvalid={!!errors.nomorFaktur}
              errorMessage={errors.nomorFaktur?.message}
            />
          )}
        />
        <Controller
          name="supplierId"
          control={control}
          render={({ field }) => (
            <Select
              label="Supplier"
              placeholder="Pilih supplier"
              startContent={
                <Store size={16} className="text-foreground-400 shrink-0" />
              }
              selectedKeys={field.value ? [field.value] : []}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              name={field.name}
            >
              <SelectItem key="">— Tanpa Supplier —</SelectItem>
              {(supplierData?.results ?? []).map((s: any) => (
                <SelectItem
                  key={s.id}
                  startContent={
                    <Avatar
                      src={s.image ?? undefined}
                      name={s.nama}
                      size="sm"
                      className="shrink-0"
                    />
                  }
                >
                  {s.nama}
                </SelectItem>
              ))}
            </Select>
          )}
        />
      </CardSection>

      <CardSection icon={<StickyNote size={16} />} title="Lampiran & Catatan">
        <Input
          label="Bukti Nota"
          type="file"
          accept="image/*,.pdf"
          startContent={
            <Paperclip size={16} className="text-foreground-400 shrink-0" />
          }
          description={file ? `✓ ${file.name}` : "Format: gambar atau PDF"}
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
        <Controller
          name="keterangan"
          control={control}
          render={({ field }) => (
            <Textarea
              label="Catatan"
              placeholder="Catatan tambahan..."
              minRows={3}
              {...field}
            />
          )}
        />
      </CardSection>
    </div>
  );
}
