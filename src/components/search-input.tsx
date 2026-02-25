import { Input } from "@heroui/input";
import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export function SearchInput({
  value,
  placeholder = "Cari...",
  onChange,
  onClear,
}: SearchInputProps) {
  return (
    <Input
      placeholder={placeholder}
      startContent={<Search size={14} className="text-slate-500" />}
      variant="bordered"
      isClearable
      classNames={{ inputWrapper: "border-1" }}
      className="lg:w-1/3 w-full"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClear={onClear}
    />
  );
}
