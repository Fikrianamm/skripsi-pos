"use client";

import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import { parseDate } from "@internationalized/date";
import { Textarea } from "@heroui/input";
import { DatePicker } from "@heroui/react";
import { Calendar, StickyNote, ClipboardCheck } from "lucide-react";
import type { OpnameFormData } from "../schema";

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
        <div className="p-1.5 rounded-lg bg-warning/10 text-warning">{icon}</div>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="p-5 flex flex-col gap-4">{children}</div>
    </div>
  );
}

interface Props {
  control: Control<OpnameFormData>;
  errors: FieldErrors<OpnameFormData>;
}

export function OpnameInfoCard({ control, errors }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <CardSection icon={<ClipboardCheck size={16} />} title="Info Opname">
        <Controller
          name="tanggal"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="Tanggal Opname"
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
      </CardSection>

      <CardSection icon={<StickyNote size={16} />} title="Catatan">
        <Controller
          name="keterangan"
          control={control}
          render={({ field }) => (
            <Textarea
              label="Keterangan"
              placeholder="Catatan/alasan opname (opsional)..."
              minRows={3}
              {...field}
            />
          )}
        />
      </CardSection>
    </div>
  );
}
