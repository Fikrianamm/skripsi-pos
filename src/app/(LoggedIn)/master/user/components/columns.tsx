import { ColumnDef } from "@/components/data-table/data-table";
import { Tooltip } from "@heroui/react";
import { Info, KeyRound, Mail, ShieldUser, User } from "lucide-react";

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
    key: "email",
    label: (
      <div className="flex items-center gap-2">
        <Mail size={16} />
        <span>EMAIL</span>
      </div>
    ),
  },
  {
    key: "provider",
    label: (
      <div className="flex items-center gap-2">
        <KeyRound size={16} />
        <span>PROVIDER</span>
        <Tooltip content="Provider adalah metode autentikasi yang digunakan untuk membuat account tersebut">
          <Info size={16} />
        </Tooltip>
      </div>
    ),
  },
  {
    key: "role",
    label: (
      <div className="flex items-center gap-2">
        <ShieldUser size={16} />
        <span>ROLE</span>
      </div>
    ),
  },
  { key: "actions", label: "", className: "w-10 md:hidden" },
];