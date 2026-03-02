import { ColumnDef } from "@/components/data-table/data-table";
import { Briefcase, CircleDot, Phone, User } from "lucide-react";

export const columns: ColumnDef[] = [
  {
    key: "nama",
    label: (
      <div className="flex items-center gap-2">
        <User size={16} />
        <span>NAMA</span>
      </div>
    ),
  },
  {
    key: "posisi",
    label: (
      <div className="flex items-center gap-2">
        <Briefcase size={16} />
        <span>POSISI</span>
      </div>
    ),
  },
  {
    key: "nomorHp",
    label: (
      <div className="flex items-center gap-2">
        <Phone size={16} />
        <span>NO. HP</span>
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
