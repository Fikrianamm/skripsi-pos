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
  Image,
} from "@heroui/react";
import { formatRupiah } from "@/lib/func";
import { Trash2, ExternalLink, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export type JurnalItem = {
  id: string;
  ref: string;
  tanggal: string;
  namaBiaya: string;          
  keterangan?: string | null; 
  buktiNota?: string | null;
  nominal: string | number;
  akunDebet: { kodeAkun: string; namaAkun: string; kelompok: string };
  akunKredit: { kodeAkun: string; namaAkun: string };
  akunDebetId: string;
  akunKreditId: string;
  paymentId?: string | null;
  payment?: { orderId: string } | null;
  penerimaanId?: string | null;
  createdBy?: { name: string } | null;
};

interface JurnalTableProps {
  jurnals: JurnalItem[];
  isLoading: boolean;
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
              <div className="flex flex-col max-w-xs gap-1">
                {item.namaBiaya && (
                  <span className="text-xs font-bold text-primary-700 uppercase tracking-wide">
                    {item.namaBiaya}
                  </span>
                )}
                <span className="text-sm text-default-700 line-clamp-2">
                  {item.keterangan}
                </span>
                {item.createdBy?.name && (
                  <span className="text-[10px] text-default-400">
                    by {item.createdBy.name}
                  </span>
                )}
                <div className="mt-1 flex flex-wrap gap-2">
                  {item.buktiNota && (
                    <Tooltip 
                      content={
                        <Image 
                          src={item.buktiNota} 
                          alt="Bukti Nota" 
                          width={200}
                          className="rounded-lg shadow-xl"
                        />
                      }
                      placement="right"
                    >
                      <Link 
                        href={item.buktiNota}
                        target="_blank"
                        className="text-[10px] bg-danger-50 text-danger-600 px-1.5 py-0.5 rounded border border-danger-100 hover:bg-danger-100 flex items-center gap-1 w-fit"
                      >
                        <ImageIcon size={10} /> Lihat Bukti
                      </Link>
                    </Tooltip>
                  )}
                  {item.payment?.orderId && (
                    <Link 
                      href={`/order/${item.payment.orderId}`}
                      className="text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded border border-primary-100 hover:bg-primary-100 flex items-center gap-1 w-fit"
                    >
                      <ExternalLink size={10} /> Lihat Pesanan
                    </Link>
                  )}
                  {item.penerimaanId && (
                    <Link 
                      href={`/inventory/in?id=${item.penerimaanId}`}
                      className="text-[10px] bg-success-50 text-success-600 px-1.5 py-0.5 rounded border border-success-100 hover:bg-success-100 flex items-center gap-1 w-fit"
                    >
                      <ExternalLink size={10} /> Lihat Stok In
                    </Link>
                  )}
                </div>
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
                <Tooltip content="Hapus Jurnal & Data Terkait" placement="left" color="danger">
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
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
