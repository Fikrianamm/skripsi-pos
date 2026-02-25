import { ColumnDef } from "@/components/data-table/data-table";
import { CircleDot, Phone, User } from "lucide-react";

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
    key: "nomorHp",
    label: (
      <div className="flex items-center gap-2">
        <Phone size={16} />
        <span>TELEPON</span>
      </div>
    ),
  },
  {
    key: "firstOrder",
    label: (
      <div className="flex items-center gap-2">
        <CircleDot size={16} />
        <span>PESANAN PERTAMA</span>
      </div>
    ),
  },
  {
    key: "totalOrder",
    label: (
      <div className="flex items-center gap-2">
        <CircleDot size={16} />
        <span>TOTAL PESANAN</span>
      </div>
    ),
  },
  {
    key: "totalSpend",
    label: (
      <div className="flex items-center gap-2">
        <CircleDot size={16} />
        <span>TOTAL BELANJA</span>
      </div>
    ),
  },
  { key: "actions", label: "", className: "w-10 md:hidden" },
];