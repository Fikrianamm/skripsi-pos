"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Tooltip,
  Spinner,
} from "@heroui/react";
import { formatRupiah } from "@/lib/func";
import { Trash2 } from "lucide-react";

export type JurnalItem = {
  id: string;
  ref: string;
  tanggal: string;
  keterangan: string;
  nominal: string | number;
  akunDebet: { kodeAkun: string; namaAkun: string; kelompok: string };
  akunKredit: { kodeAkun: string; namaAkun: string };
  akunDebetId: string;
  akunKreditId: string;
  paymentId?: string | null;
  costId?: string | null;
  penerimaanId?: string | null;
  createdBy?: { name: string } | null;
};

interface JurnalTableProps {
  jurnals: JurnalItem[];
  isLoading: boolean;
  totalNominal: number;
  onDeleted: (item: JurnalItem) => void;
}

const columns = [
  { key: "ref",        label: "REF"         },
  { key: "tanggal",   label: "TANGGAL"     },
  { key: "keterangan",label: "KETERANGAN"  },
  { key: "debet",     label: "DEBET AKUN"  },
  { key: "kredit",    label: "KREDIT AKUN" },
  { key: "nominal",   label: "NOMINAL"     },
  { key: "aksi",      label: "AKSI"        },
];

export function JurnalTable({
  jurnals,
  isLoading,
  totalNominal,
  onDeleted,
}: JurnalTableProps) {
  return (
    <Table
      aria-label="Tabel Jurnal Umum"
      isHeaderSticky
      classNames={{
        base: "max-h-[680px]",
        wrapper: "border border-default-200 shadow-none rounded-xl",
        th: "text-xs uppercase",
      }}
      bottomContent={
        jurnals.length > 0 && !isLoading ? (
          <div className="flex items-center justify-between px-2 py-2 border-t border-default-200">
            <span className="text-xs text-default-500">
              {jurnals.length} entri jurnal
            </span>
            <span className="text-sm font-bold text-default-900 tabular-nums">
              Total: {formatRupiah(totalNominal)}
            </span>
          </div>
        ) : null
      }
    >
      <TableHeader columns={columns}>
        {(col) => (
          <TableColumn
            key={col.key}
            align={col.key === "nominal" || col.key === "aksi" ? "end" : "start"}
          >
            {col.label}
          </TableColumn>
        )}
      </TableHeader>

      <TableBody
        items={jurnals}
        isLoading={isLoading}
        loadingContent={<Spinner label="Memuat buku besar..." />}
        emptyContent="Belum ada transaksi pada periode ini."
      >
        {(item) => (
          <TableRow key={item.id}>
            {/* Ref */}
            <TableCell>
              <span className="font-mono text-xs font-semibold text-default-700 whitespace-nowrap">
                {item.ref}
              </span>
            </TableCell>

            {/* Tanggal */}
            <TableCell>
              <span className="text-sm text-default-700 whitespace-nowrap">
                {new Date(item.tanggal).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </TableCell>

            {/* Keterangan */}
            <TableCell>
              <div className="flex flex-col max-w-xs">
                <span className="text-sm text-default-700 line-clamp-2">
                  {item.keterangan}
                </span>
                {item.createdBy?.name && (
                  <span className="text-xs text-default-400">
                    by {item.createdBy.name}
                  </span>
                )}
              </div>
            </TableCell>

            {/* Debet Akun */}
            <TableCell>
              <div className="flex flex-col whitespace-nowrap">
                <span className="text-sm font-medium text-success-700">
                  {item.akunDebet.namaAkun}
                </span>
                <span className="text-[11px] text-default-400">
                  {item.akunDebet.kodeAkun}
                </span>
              </div>
            </TableCell>

            {/* Kredit Akun */}
            <TableCell>
              <div className="flex flex-col whitespace-nowrap">
                <span className="text-sm font-medium text-danger-600">
                  {item.akunKredit.namaAkun}
                </span>
                <span className="text-[11px] text-default-400">
                  {item.akunKredit.kodeAkun}
                </span>
              </div>
            </TableCell>

            {/* Nominal */}
            <TableCell>
              <span className="text-sm font-bold tabular-nums text-default-900 whitespace-nowrap">
                {formatRupiah(Number(item.nominal))}
              </span>
            </TableCell>

            {/* Aksi */}
            <TableCell>
              <div className="flex items-center justify-end">
                {(!item.costId && !item.paymentId && !item.penerimaanId) && (
                  <Tooltip content="Hapus Jurnal" placement="left" color="danger">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      color="danger"
                      onPress={() => onDeleted(item)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </Tooltip>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
