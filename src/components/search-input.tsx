import { Input } from "@heroui/input";
import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onClear: () => void;
  className?: string;
}

export function SearchInput({
  value,
  placeholder = "Cari...",
  onChange,
  onClear,
  className,
}: SearchInputProps) {
  return (
    <Input
      placeholder={placeholder}
      startContent={<Search size={14} className="text-slate-500" />}
      variant="bordered"
      isClearable
      classNames={{ inputWrapper: "border-1" }}
      className={className ?? "w-full max-w-xs"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClear={onClear}
    />
  );
}
