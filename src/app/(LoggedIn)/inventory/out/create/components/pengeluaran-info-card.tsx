"use client";

import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import { parseDate } from "@internationalized/date";
import { Textarea } from "@heroui/input";
import { DatePicker } from "@heroui/react";
import { Autocomplete, AutocompleteItem } from "@heroui/react";
import { Calendar, StickyNote, Factory } from "lucide-react";
import type { PengeluaranFormData } from "../schema";

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
        <div className="p-1.5 rounded-lg bg-danger/10 text-danger">{icon}</div>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="p-5 flex flex-col gap-4">{children}</div>
    </div>
  );
}

interface SPKOption {
  id: string;
  order: { nomorOrder: string; customer: { nama: string } };
}

interface Props {
  control: Control<PengeluaranFormData>;
  errors: FieldErrors<PengeluaranFormData>;
  spkList: SPKOption[];
}

export function PengeluaranInfoCard({ control, errors, spkList }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <CardSection icon={<Factory size={16} />} title="Info Pengeluaran">
        {/* Tanggal */}
        <Controller
          name="tanggal"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="Tanggal Keluar"
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

        {/* SPK */}
        <Controller
          name="spkId"
          control={control}
          render={({ field }) => (
            <Autocomplete
              defaultItems={spkList}
              label="SPK (Opsional)"
              placeholder="Cari dan pilih SPK..."
              selectedKey={field.value ?? ""}
              onSelectionChange={(key) =>
                field.onChange(key ? String(key) : "")
              }
              onBlur={field.onBlur}
              startContent={
                <Factory size={16} className="text-foreground-400 shrink-0" />
              }
            >
              {(spk) => (
                <AutocompleteItem
                  key={spk.id}
                  textValue={spk.order.nomorOrder}
                >
                  <div>
                    <p className="font-medium text-sm">
                      {spk.order.nomorOrder}
                    </p>
                    <p className="text-xs text-default-400">
                      {spk.order.customer.nama}
                    </p>
                  </div>
                </AutocompleteItem>
              )}
            </Autocomplete>
          )}
        />
      </CardSection>

      <CardSection icon={<StickyNote size={16} />} title="Catatan">
        <Controller
          name="keterangan"
          control={control}
          render={({ field }) => (
            <Textarea
              label="Keterangan"
              placeholder="Keterangan tambahan (opsional)..."
              minRows={3}
              {...field}
            />
          )}
        />
      </CardSection>
    </div>
  );
}
