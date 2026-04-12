import { ColumnDef } from "@/components/data-table/data-table";
import { Box, Notebook, Calendar, User } from "lucide-react";

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
    key: "addedBy",
    label: (
      <div className="flex items-center gap-2">
        <User size={16} />
        <span>DICATAT OLEH</span>
      </div>
    ),
  },
  {
    key: "itemDikoreksi",
    label: (
      <div className="flex items-center gap-2">
        <Box size={16} />
        <span>ITEM DIKOREKSI</span>
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
  { key: "actions", label: "", className: "w-10 md:hidden" },
];
