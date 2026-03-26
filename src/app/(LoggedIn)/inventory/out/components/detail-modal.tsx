/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import useSWR from "swr";
import { fetcher, formatDate } from "@/lib/func";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Divider,
  Spinner,
  User,
} from "@heroui/react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import type { PengeluaranDetail } from "@/types/types";
import { Calendar, ExternalLink, Notebook, ShoppingBag, User2 } from "lucide-react";
import Link from "next/link";

interface Props {
  id: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PengeluaranDetailModal({ id, isOpen, onClose }: Props) {
  const { data, isLoading } = useSWR<PengeluaranDetail>(
    id && isOpen ? `/api/admin/inventory/out/${id}` : null,
    fetcher,
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>Detail Pengeluaran Barang</ModalHeader>
        <ModalBody>
          {isLoading || !data ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <Spinner />
              <p className="text-sm text-default-400">Memuat data...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center justify-start">
                    <ShoppingBag size={14} className="text-default-500" />
                    <p className="text-default-400 text-xs uppercase font-medium">
                      SPK / Order
                    </p>
                  </div>
                  {data.spk ? (
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/order/${data.spk.orderId}`}
                        className="flex gap-2 items-center justify-start"
                      >
                        {data.spk.order.nomorOrder}
                        <ExternalLink size={14} />
                      </Link>
                      <User
                        name={data?.spk?.order.customer.nama}
                        description="Customer"
                        classNames={{ description: "capitalize" }}
                        avatarProps={{
                          src: data?.spk?.order.customer.image ?? undefined,
                          size: "sm",
                        }}
                        className="justify-start"
                      />
                    </div>
                  ) : (
                    <span className="text-default-400">—</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center justify-start">
                    <User2 size={14} className="text-default-500" />
                    <p className="text-default-400 text-xs uppercase font-medium">
                      Dicatat Oleh
                    </p>
                  </div>
                  {data.addedBy ? (
                    <User
                      name={data?.addedBy.name}
                      description={data?.addedBy.role}
                      classNames={{ description: "capitalize" }}
                      avatarProps={{
                        src: data?.addedBy.image ?? undefined,
                        size: "sm",
                      }}
                      className="justify-start"
                    />
                  ) : (
                    <span className="text-default-400">—</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center justify-start">
                    <Calendar size={14} className="text-default-500" />
                    <p className="text-default-400 text-xs uppercase font-medium">
                      Tanggal
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{formatDate(data.tanggal)}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center justify-start">
                    <Notebook size={14} className="text-default-500" />
                    <p className="text-default-400 text-xs uppercase font-medium">
                      Keterangan
                    </p>
                  </div>
                  {data.keterangan ? (
                    <p>{data.keterangan}</p>
                  ) : (
                    <span className="text-default-400">
                      Tidak ada keterangan
                    </span>
                  )}
                </div>
              </div>

              <Divider />

              {/* Items Table */}
              <div>
                <p className="text-sm font-semibold mb-2">Bahan Baku Keluar</p>
                <Table
                  aria-label="Tabel Barang Keluar"
                  classNames={{
                    wrapper: "border border-default-200 shadow-none rounded-lg",
                    th: "bg-default-50 text-default-500",
                  }}
                >
                  <TableHeader>
                    <TableColumn>BAHAN BAKU</TableColumn>
                    <TableColumn>SATUAN</TableColumn>
                    <TableColumn>JUMLAH</TableColumn>
                  </TableHeader>
                  <TableBody items={data.items as any[]}>
                    {(item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.bahanBaku.nama}
                        </TableCell>
                        <TableCell className="text-default-500">
                          {item.bahanBaku.unit?.nama ?? "—"}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {Number(item.jumlah).toLocaleString("id-ID")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Tutup
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
