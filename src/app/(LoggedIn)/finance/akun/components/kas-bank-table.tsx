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
import { formatRupiah } from "@/lib/func";

interface KasBankTableProps {
  kasBanks: any[];
  isLoading: boolean;
  onEdit: (data: any) => void;
}

export function KasBankTable({
  kasBanks,
  isLoading,
  onEdit,
}: KasBankTableProps) {
  return (
    <Table
      aria-label="Tabel Kas dan Bank"
      isHeaderSticky
      classNames={{
        base: "max-h-[600px]",
        wrapper: "border border-default-200 shadow-none",
      }}
    >
      <TableHeader>
        <TableColumn>NAMA REKENING</TableColumn>
        <TableColumn>JENIS</TableColumn>
        <TableColumn>NOMOR REKENING</TableColumn>
        <TableColumn>AKUN TERHUBUNG</TableColumn>
        <TableColumn align="end">SALDO SAAT INI</TableColumn>
        <TableColumn align="center">AKSI</TableColumn>
      </TableHeader>
      <TableBody
        items={kasBanks}
        isLoading={isLoading}
        emptyContent={
          isLoading ? "Memuat data rekening..." : "Belum ada rekening."
        }
      >
        {(item: any) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-semibold">{item.namaRekening}</span>
                {!item.isActive && (
                  <span className="text-[10px] text-danger font-medium mt-0.5">
                    Tidak Aktif
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Chip size="sm" variant="flat" color="secondary">
                {item.jenisRekening}
              </Chip>
            </TableCell>
            <TableCell>
              <span className="text-sm font-mono text-default-600">
                {item.nomorRekening || "-"}
              </span>
            </TableCell>
            <TableCell>
              {item.akun ? (
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">
                    {item.akun.kodeAkun}
                  </span>
                  <span className="text-xs text-default-500">
                    {item.akun.namaAkun}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-default-400 italic">
                  Tidak terhubung
                </span>
              )}
            </TableCell>
            <TableCell>
              <span
                className={`font-bold ${item.saldoSaatIni < 0 ? "text-danger" : "text-success-600"}`}
              >
                {formatRupiah(item.saldoSaatIni)}
              </span>
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
