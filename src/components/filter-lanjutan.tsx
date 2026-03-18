"use client";
import React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Button } from "@heroui/button";

import { Filter, RotateCcw } from "lucide-react";
import { Select, SelectItem } from "@heroui/react";
import { useIsMobile } from "@/hooks/use-mobile";

// ── Sub-components exported for page-level use ────────────────────────────────

/** Label section header di dalam panel filter */
export function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground-400">
        {label}
      </p>
      {children}
    </div>
  );
}

/** Tombol pilihan mutual-exclusive (mirip radio group) */
export function FilterButtonGroup({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            value === opt.key
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-default-100 text-foreground-600 border-transparent hover:bg-default-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** HeroUI Select untuk filter dengan options array */
export function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { key: string; label: string }[];
}) {
  return (
    <Select
      selectedKeys={new Set([value])}
      onSelectionChange={(keys) => {
        const sel = Array.from(keys)[0] as string | undefined;
        onChange(sel ?? "");
      }}
      aria-label="Filter"
      variant="bordered"
      size="sm"
      classNames={{ trigger: "border-1" }}
    >
      {options.map((opt) => (
        <SelectItem key={opt.key}>{opt.label}</SelectItem>
      ))}
    </Select>
  );
}

// ── Main FilterLanjutan component ─────────────────────────────────────────────

interface FilterLanjutanProps {
  /** Jumlah filter yang sedang aktif (untuk badge) */
  activeCount?: number;
  /** Callback untuk reset semua filter */
  onReset: () => void;
  /** Konten filter (gunakan FilterSection, FilterButtonGroup, FilterSelect) */
  children: React.ReactNode;
}

export function FilterLanjutan({
  activeCount = 0,
  onReset,
  children,
}: FilterLanjutanProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const isMobile = useIsMobile();

  const trigger = (
    <Button
      variant="bordered"
      startContent={<Filter size={15} />}
      className="border-1 capitalize shrink-0"
      endContent={
        activeCount > 0 && !isMobile ? (
          <span className="ml-1 min-w-[18px] h-[18px] text-[10px] font-bold rounded-full bg-primary text-primary-foreground flex items-center justify-center px-1">
            {activeCount}
          </span>
        ) : undefined
      }
      isIconOnly={isMobile}
    >
      <span className="hidden lg:flex">Filter</span>
    </Button>
  );

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      placement="bottom-end"
      offset={8}
    >
      <PopoverTrigger>{trigger}</PopoverTrigger>
      <PopoverContent className="p-0 w-72 shadow-xl rounded-2xl border border-divider">
        <div className="p-4 space-y-4 w-full">{children}</div>
        <div className="px-4 pb-3 w-full">
          <Button
            variant="light"
            size="sm"
            fullWidth
            startContent={<RotateCcw size={14} />}
            onPress={() => {
              onReset();
              setIsOpen(false);
            }}
            className="text-foreground-500 text-sm w-full"
          >
            Reset Filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
