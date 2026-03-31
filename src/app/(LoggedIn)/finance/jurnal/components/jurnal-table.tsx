/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from "@heroui/react";
import { formatRupiah } from "@/lib/func";
import { ArrowRight } from "lucide-react";

interface JurnalTableProps {
  jurnals: any[];
  isLoading: boolean;
}

export function JurnalTable({ jurnals, isLoading }: JurnalTableProps) {
  return (
    <Table
      aria-label="Buku Besar / Jurnal Umum"
      isHeaderSticky
      classNames={{
        base: "max-h-[800px] overflow-scroll",
        wrapper: "border border-default-200 shadow-none",
      }}
    >
      <TableHeader>
        <TableColumn>TANGGAL & REF</TableColumn>
        <TableColumn>KETERANGAN TRANSAKSI</TableColumn>
        <TableColumn>PENCATATAN (DEBET {"->"} KREDIT)</TableColumn>
        <TableColumn>NOMINAL TRANSAKSI</TableColumn>
        <TableColumn>SUMBER</TableColumn>
      </TableHeader>
      <TableBody
        items={jurnals}
        isLoading={isLoading}
        emptyContent={isLoading ? "Memuat buku besar..." : "Belum ada transaksi di jurnal umum."}
      >
        {(item: any) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold">
                  {new Date(item.tanggal).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="text-xs text-default-400 font-mono">{item.ref}</span>
              </div>
            </TableCell>
            
            <TableCell>
              <span className="text-sm max-w-sm block truncate" title={item.keterangan}>
                {item.keterangan}
              </span>
            </TableCell>

            <TableCell>
              <div className="flex items-center gap-2 text-sm font-medium">
                <div className="flex flex-col text-success-600">
                  <span className="text-xs opacity-70">DEBET (+)</span>
                  <span>{item.akunDebet.kodeAkun} - {item.akunDebet.namaAkun}</span>
                </div>
                <ArrowRight size={16} className="text-default-300" />
                <div className="flex flex-col text-danger-600 text-right">
                  <span className="text-xs opacity-70">KREDIT (-)</span>
                  <span>{item.akunKredit.kodeAkun} - {item.akunKredit.namaAkun}</span>
                </div>
              </div>
            </TableCell>

            <TableCell>
              <span className="text-sm font-bold tracking-tight">
                {formatRupiah(Number(item.debet))}
              </span>
            </TableCell>

            <TableCell>
              <div className="flex flex-col items-start gap-1">
                <Chip size="sm" variant="flat" color={item.sumber === "MANUAL" ? "warning" : "primary"}>
                  {item.sumber}
                </Chip>
                {item.createdBy?.name && (
                  <span className="text-[10px] text-default-400">by {item.createdBy.name}</span>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
