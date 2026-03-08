"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import { PackagePlus, Eye } from "lucide-react";
import { Button } from "@heroui/button";
import { Pagination } from "@heroui/pagination";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";

export default function PenerimaanBarangPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const limit = 10;

  const { data, isLoading } = useSWR(
    `/api/admin/inventory/in?page=${page}&limit=${limit}&search=${encodeURIComponent(
      debouncedSearch,
    )}`,
    fetcher,
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4 mb-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader
          title="Riwayat Penerimaan"
          description="Kelola faktur dan histori stok masuk bahan baku"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-3 justify-between items-center border-t border-default-200 pt-4">
        <SearchInput
          value={search}
          placeholder="Cari faktur atau supplier..."
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="w-full md:w-auto"
        />
        <div className="flex flex-col md:flex-row gap-2 justify-center md:justify-end w-full">
          <Button
            as={Link}
            href="/inventory/in/create"
            color="primary"
            startContent={<PackagePlus size={18} />}
          >
            Catat Penerimaan
          </Button>
        </div>
      </div>

      <Table
        aria-label="Tabel Penerimaan Barang"
        classNames={{
          wrapper: "flex-1 overflow-auto border border-default-200 shadow-none",
          th: "bg-default-50 text-default-500",
        }}
        bottomContent={
          data?.pagination?.totalPages > 1 && (
            <div className="flex w-full justify-center mt-2">
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={page}
                total={data.pagination.totalPages}
                onChange={(p) => setPage(p)}
              />
            </div>
          )
        }
      >
        <TableHeader>
          <TableColumn>TANGGAL</TableColumn>
          <TableColumn>FAKTUR / SURAT JALAN</TableColumn>
          <TableColumn>SUPPLIER</TableColumn>
          <TableColumn>TOTAL ITEM</TableColumn>
          <TableColumn>TOTAL TAGIHAN</TableColumn>
          <TableColumn>BUKTI NOTA</TableColumn>
        </TableHeader>
        <TableBody
          items={data?.results || []}
          emptyContent={
            isLoading
              ? "Memuat data..."
              : "Belum ada riwayat penerimaan barang."
          }
          isLoading={isLoading}
        >
          {(item: {
            id: string;
            tanggal: Date | string;
            addedBy: { name: string } | null;
            nomorFaktur: string | null;
            supplier: { nama: string } | null;
            _count: { items: number };
            totalTagihan: number | string;
            buktiNota: string | null;
          }) => (
            <TableRow key={item.id}>
              <TableCell>
                {new Intl.DateTimeFormat("id-ID", {
                  dateStyle: "medium",
                }).format(new Date(item.tanggal))}
                <div className="text-xs text-foreground-400 mt-1 font-medium">
                  {item.addedBy?.name || "-"}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {item.nomorFaktur || "-"}
              </TableCell>
              <TableCell>{item.supplier?.nama || "-"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 font-medium text-success">
                  {item._count?.items || 0} Macam
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(Number(item.totalTagihan) || 0)}
              </TableCell>
              <TableCell>
                {item.buktiNota ? (
                  <Button
                    as="a"
                    href={item.buktiNota}
                    target="_blank"
                    rel="noreferrer"
                    size="sm"
                    variant="flat"
                    color="primary"
                    startContent={<Eye size={14} />}
                  >
                    Lihat
                  </Button>
                ) : (
                  "-"
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
