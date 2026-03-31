"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, formatRupiah, formatDate } from "@/lib/func";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Chip,
  Divider,
  User,
  Tooltip,
} from "@heroui/react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { Button } from "@heroui/button";
import { MessageCircle, AlertTriangle } from "lucide-react";

type PiutangItem = {
  id: string;
  nomorOrder: string;
  grandTotal: number;
  sudahDibayar: number;
  sisaTagihan: number;
  statusPembayaran: string;
  deadline: string | null;
  createdAt: string;
  customer: { id: string; nama: string; nomorHp: string; image?: string | null };
};

function buildWALink(nomorOrder: string, customer: PiutangItem["customer"], sisaTagihan: number) {
  const phone = customer.nomorHp
    .replace(/\D/g, "")
    .replace(/^0/, "62");
  const text = encodeURIComponent(
    `Halo ${customer.nama},\n\nKami ingin mengingatkan bahwa Order *#${nomorOrder}* Anda masih memiliki sisa tagihan sebesar *${formatRupiah(sisaTagihan)}*.\n\nMohon segera lakukan pembayaran. Terima kasih 🙏`
  );
  return `https://wa.me/${phone}?text=${text}`;
}

export default function PiutangPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const limit = 20;
  const today = new Date();

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(debouncedSearch && { search: debouncedSearch }),
  });

  const { data, isLoading } = useSWR<{
    results: PiutangItem[];
    pagination: { total: number; totalPages: number; page: number; limit: number };
  }>(`/api/finance/piutang?${params}`, fetcher);

  const totalPiutang = (data?.results ?? []).reduce(
    (s, o) => s + o.sisaTagihan,
    0
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4 mb-4">
      <PageHeader
        title="Laporan Piutang"
        description="Monitor tagihan pelanggan yang belum lunas"
      />

      <div className="flex flex-col md:flex-row gap-2 items-center">
        <SearchInput
          value={search}
          placeholder="Cari nomor order atau nama pelanggan..."
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="w-full"
        />
      </div>

      {/* Total Piutang Summary */}
      {(data?.results?.length ?? 0) > 0 && (
        <div className="flex items-center gap-3 bg-warning-50 border border-warning-200 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-warning shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs text-warning-700 font-medium">Total Piutang Beredar</span>
            <span className="text-lg font-bold text-warning-800 tabular-nums">
              {formatRupiah(totalPiutang)}
            </span>
          </div>
          <div className="ml-auto text-xs text-warning-600">
            {data!.pagination.total} pesanan belum lunas
          </div>
        </div>
      )}

      {data?.pagination?.total !== undefined && (
        <div className="flex gap-2 items-center">
          <span className="text-xs text-default-400 tabular-nums">
            {data.results.length} dari {data.pagination.total} pesanan
          </span>
          <Divider className="flex-1" />
        </div>
      )}

      <Table
        aria-label="Laporan Piutang"
        classNames={{
          wrapper: "flex-1 overflow-auto border border-default-200 shadow-none",
          th: "bg-default-50 text-default-500",
        }}
        bottomContent={
          (data?.pagination?.totalPages ?? 0) > 1 && (
            <div className="flex w-full justify-center mt-2">
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={page}
                total={data!.pagination.totalPages}
                onChange={setPage}
              />
            </div>
          )
        }
      >
        <TableHeader>
          <TableColumn>NO. ORDER</TableColumn>
          <TableColumn>PELANGGAN</TableColumn>
          <TableColumn>TOTAL TAGIHAN</TableColumn>
          <TableColumn>SUDAH DIBAYAR</TableColumn>
          <TableColumn>SISA TAGIHAN</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>JATUH TEMPO</TableColumn>
          <TableColumn>AKSI</TableColumn>
        </TableHeader>
        <TableBody
          items={(data?.results ?? []) as PiutangItem[]}
          emptyContent={
            isLoading ? "Memuat data..." : "Tidak ada piutang beredar. Semua pesanan sudah lunas! 🎉"
          }
          isLoading={isLoading}
        >
          {(item) => {
            const isOverdue =
              item.deadline ? new Date(item.deadline) < today : false;

            return (
              <TableRow key={item.id} className="hover:bg-default-50 transition-colors">
                <TableCell>
                  <span className="text-sm font-medium font-mono">{item.nomorOrder}</span>
                </TableCell>
                <TableCell>
                  <User
                    name={item.customer.nama}
                    description={item.customer.nomorHp}
                    avatarProps={{
                      src: item.customer.image ?? undefined,
                      size: "sm",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <span className="text-sm tabular-nums font-medium">
                    {formatRupiah(item.grandTotal)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm tabular-nums text-success">
                    {formatRupiah(item.sudahDibayar)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm tabular-nums font-semibold text-danger">
                    {formatRupiah(item.sisaTagihan)}
                  </span>
                </TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    color={item.statusPembayaran === "DP" ? "warning" : "danger"}
                    variant="flat"
                  >
                    {item.statusPembayaran === "DP" ? "DP" : "Belum Bayar"}
                  </Chip>
                </TableCell>
                <TableCell>
                  {item.deadline ? (
                    <Tooltip
                      content={isOverdue ? "Jatuh tempo sudah lewat!" : "Belum jatuh tempo"}
                      color={isOverdue ? "danger" : "default"}
                    >
                      <span
                        className={`text-sm font-medium ${
                          isOverdue ? "text-danger font-semibold" : "text-default-600"
                        }`}
                      >
                        {isOverdue && "⚠ "}
                        {formatDate(item.deadline)}
                      </span>
                    </Tooltip>
                  ) : (
                    <span className="text-xs text-default-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    color="success"
                    variant="flat"
                    as="a"
                    href={buildWALink(item.nomorOrder, item.customer, item.sisaTagihan)}
                    target="_blank"
                    rel="noopener noreferrer"
                    startContent={<MessageCircle size={14} />}
                  >
                    Kirim WA
                  </Button>
                </TableCell>
              </TableRow>
            );
          }}
        </TableBody>
      </Table>
    </div>
  );
}
