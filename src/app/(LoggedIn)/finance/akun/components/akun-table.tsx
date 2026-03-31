/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
} from "@heroui/react";
import { Edit2 } from "lucide-react";

interface AkunTableProps {
  akuns: any[];
  isLoading: boolean;
  onEdit: (data: any) => void;
}

export function AkunTable({ akuns, isLoading, onEdit }: AkunTableProps) {
  return (
    <Table
      aria-label="Tabel Chart of Accounts"
      isHeaderSticky
      classNames={{
        base: "max-h-[600px] overflow-scroll",
        wrapper: "border border-default-200 shadow-none",
      }}
    >
      <TableHeader>
        <TableColumn>KODE</TableColumn>
        <TableColumn>NAMA AKUN</TableColumn>
        <TableColumn>KELOMPOK</TableColumn>
        <TableColumn>POSISI NORMAL</TableColumn>
        <TableColumn>STATUS</TableColumn>
        <TableColumn align="center">AKSI</TableColumn>
      </TableHeader>
      <TableBody
        items={akuns}
        isLoading={isLoading}
        emptyContent={isLoading ? "Memuat data akun..." : "Belum ada master akun."}
      >
        {(item: any) => (
          <TableRow key={item.id}>
            <TableCell>
              <span className="font-semibold text-sm">{item.kodeAkun}</span>
            </TableCell>
            <TableCell>
              <span className="font-semibold">{item.namaAkun}</span>
            </TableCell>
            <TableCell>
              <Chip size="sm" variant="flat" color="primary">
                {item.kelompok.replace(/_/g, " ")}
              </Chip>
            </TableCell>
            <TableCell>
              <Chip 
                size="sm" 
                variant="dot" 
                color={item.posisiNormal === "DEBET" ? "success" : "danger"}
              >
                {item.posisiNormal}
              </Chip>
            </TableCell>
            <TableCell>
              <Chip size="sm" color={item.isActive ? "success" : "default"} variant="flat">
                {item.isActive ? "Aktif" : "Nonaktif"}
              </Chip>
            </TableCell>
            <TableCell>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onEdit(item)}
              >
                <Edit2 size={15} className="text-default-500" />
              </Button>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
