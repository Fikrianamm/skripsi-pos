import { ColumnDef } from "@/components/data-table/data-table";
import { Package, Tag, User, Warehouse } from "lucide-react";

export const columns: ColumnDef[] = [
  {
    key: "name",
    label: (
      <div className="flex items-center gap-2">
        <User size={16} />
        <span>NAMA</span>
      </div>
    ),
  },
  {
    key: "sku",
    label: (
      <div className="flex items-center gap-2">
        <Tag size={16} />
        <span>SKU</span>
      </div>
    ),
  },
  {
    key: "category",
    label: (
      <div className="flex items-center gap-2">
        <Package size={16} />
        <span>KATEGORI</span>
      </div>
    ),
  },
  {
    key: "type",
    label: (
      <div className="flex items-center gap-2">
        <Package size={16} />
        <span>TIPE</span>
      </div>
    ),
  },
  {
    key: "hpp",
    label: (
      <div className="flex items-center gap-2">
        <span>HPP</span>
      </div>
    ),
  },
  {
    key: "hargaJual",
    label: (
      <div className="flex items-center gap-2">
        <span>HARGA</span>
      </div>
    ),
  },
  {
    key: "sold",
    label: (
      <div className="flex items-center gap-2">
        <span>TERJUAL</span>
      </div>
    ),
  },
  {
    key: "stock",
    label: (
      <div className="flex items-center gap-2">
        <Warehouse size={16} />
        <span>STATUS STOK</span>
      </div>
    ),
  },
  { key: "actions", label: "", className: "w-10 md:hidden" },
];