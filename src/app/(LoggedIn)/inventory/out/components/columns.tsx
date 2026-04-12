import { ColumnDef } from "@/components/data-table/data-table";
import { Box, Calendar, FileText, User, CreditCard } from "lucide-react";

export const columns: ColumnDef[] = [
  {
    key: "tanggal",
    label: (
      <div className="flex items-center gap-2">
        <Calendar size={16} />
        <span>TANGGAL</span>
      </div>
    ),
  },
  {
    key: "nomorOrder",
    label: (
      <div className="flex items-center gap-2">
        <FileText size={16} />
        <span>SPK / ORDER</span>
      </div>
    ),
  },
  {
    key: "addedBy",
    label: (
      <div className="flex items-center gap-2">
        <User size={16} />
        <span>DITAMBAHKAN OLEH</span>
      </div>
    ),
  },
  {
    key: "bahanBaku",
    label: (
      <div className="flex items-center gap-2">
        <Box size={16} />
        <span>BAHAN BAKU</span>
      </div>
    ),
  },
  {
    key: "keterangan",
    label: (
      <div className="flex items-center gap-2">
        <CreditCard size={16} />
        <span>KETERANGAN</span>
      </div>
    ),
  },
  { key: "actions", label: "", className: "w-10 md:hidden" },
];
