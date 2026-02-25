import { ColumnDef } from "@/components/data-table/data-table";
import { CircleDot, Map, Mail, Notebook, Phone, User } from "lucide-react";

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
    key: "email",
    label: (
      <div className="flex items-center gap-2">
        <Mail size={16} />
        <span>EMAIL</span>
      </div>
    ),
  },
  {
    key: "nomorHp",
    label: (
      <div className="flex items-center gap-2">
        <Phone size={16} />
        <span>TELEPON</span>
      </div>
    ),
  },
  {
    key: "alamat",
    label: (
      <div className="flex items-center gap-2">
        <Map size={16} />
        <span>ALAMAT</span>
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