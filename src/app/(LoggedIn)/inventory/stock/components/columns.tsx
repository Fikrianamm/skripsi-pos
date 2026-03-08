import { ColumnDef } from "@/components/data-table/data-table";
import { Box, Ruler, AlertTriangle, CircleDot, Notebook } from "lucide-react";

export const columns: ColumnDef[] = [
  {
    key: "nama",
    label: (
      <div className="flex items-center gap-2">
        <Box size={16} />
        <span>NAMA BAHAN BAKU</span>
      </div>
    ),
  },
  {
    key: "unit",
    label: (
      <div className="flex items-center gap-2">
        <Ruler size={16} />
        <span>SATUAN</span>
      </div>
    ),
  },
  {
    key: "stok",
    label: (
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} />
        <span>STOK</span>
      </div>
    ),
  },
  {
    key: "minStok",
    label: (
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} />
        <span>MIN STOK</span>
      </div>
    ),
  },
  {
    key: "keterangan",
    label: (
      <div className="flex items-center gap-2">
        <Notebook size={16} />
        <span>KETERANGAN</span>
      </div>
    ),
  },
  {
    key: "isActive",
    label: (
      <div className="flex items-center gap-2">
        <CircleDot size={16} />
        <span>STATUS</span>
      </div>
    ),
  },
  { key: "actions", label: "", className: "w-10 md:hidden" },
];
