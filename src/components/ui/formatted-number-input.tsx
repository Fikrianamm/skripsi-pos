import { Input } from "@heroui/input";
import type { InputProps } from "@heroui/input";
import { useState } from "react";

type FormattedNumberInputProps = Omit<
  InputProps,
  "type" | "value" | "onChange"
> & {
  value?: number;
  onChange?: (value: number) => void;
};

/** Format angka ke string dengan pemisah ribuan (contoh: 1500000 → "1.500.000") */
function formatThousands(num: number): string {
  if (!num && num !== 0) return "";
  return new Intl.NumberFormat("id-ID").format(num);
}

/** Strip semua karakter non-digit dari string */
function stripNonDigits(str: string): string {
  return str.replace(/[^0-9]/g, "");
}

/**
 * Input angka dengan format ribuan otomatis.
 * - Menampilkan angka dengan pemisah titik (1.500.000)
 * - Menghapus leading zero otomatis (007 → 7)
 * - onChange mengembalikan `number` bukan string
 */
export function FormattedNumberInput({
  value,
  onChange,
  onBlur,
  ...props
}: FormattedNumberInputProps) {
  // Apakah user sedang mengedit (fokus)
  const [isFocused, setIsFocused] = useState(false);
  // Raw string saat mengetik (tanpa format)
  const [rawValue, setRawValue] = useState<string>(
    value !== undefined && value !== 0 ? String(value) : "",
  );

  // Nilai yang ditampilkan:
  // - Saat fokus: rawValue (angka mentah, mudah diedit)
  // - Saat blur:  nilai terformat dari prop (misal reset form sync)
  const displayValue = isFocused
    ? rawValue
    : value !== undefined && value !== 0
      ? formatThousands(value)
      : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = stripNonDigits(e.target.value);
    // Hapus leading zero: "007" → "7"
    const trimmed = raw.replace(/^0+(\d)/, "$1");
    setRawValue(trimmed);
    onChange?.(trimmed ? parseInt(trimmed, 10) : 0);
  }

  function handleFocus() {
    setIsFocused(true);
    // Sync rawValue dari prop saat mulai fokus
    setRawValue(value !== undefined && value !== 0 ? String(value) : "");
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    setIsFocused(false);
    onBlur?.(e);
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  );
}
