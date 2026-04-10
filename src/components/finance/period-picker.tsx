"use client";

import { Select, SelectItem } from "@heroui/react";

const BULAN_LABELS: Record<number, string> = {
  1:"Januari",2:"Februari",3:"Maret",4:"April",5:"Mei",6:"Juni",
  7:"Juli",8:"Agustus",9:"September",10:"Oktober",11:"November",12:"Desember",
};
const TAHUN_LIST = Array.from({ length: 6 }, (_, i) => 2023 + i);

interface PeriodPickerProps {
  bulan: number;
  tahun: number;
  onBulanChange: (v: number) => void;
  onTahunChange: (v: number) => void;
  hideBulan?: boolean;
}

export function PeriodPicker({ bulan, tahun, onBulanChange, onTahunChange, hideBulan }: PeriodPickerProps) {
  return (
    <div className="flex items-center gap-3">
      {!hideBulan && (
        <Select
          label="Bulan"
          size="sm"
          className="w-36"
          variant="bordered"
          selectedKeys={[bulan.toString()]}
          onSelectionChange={(k) => onBulanChange(Number(Array.from(k)[0]))}
        >
          {Object.entries(BULAN_LABELS).map(([id, label]) => (
            <SelectItem key={id} textValue={label}>{label}</SelectItem>
          ))}
        </Select>
      )}
      <Select
        label="Tahun"
        size="sm"
        className="w-28"
        variant="bordered"
        selectedKeys={[tahun.toString()]}
        onSelectionChange={(k) => onTahunChange(Number(Array.from(k)[0]))}
      >
        {TAHUN_LIST.map((t) => (
          <SelectItem key={t.toString()} textValue={t.toString()}>{t}</SelectItem>
        ))}
      </Select>
    </div>
  );
}

export { BULAN_LABELS };
