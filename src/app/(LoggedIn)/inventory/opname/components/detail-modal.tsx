"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Divider,
  Spinner,
  User,
  Chip,
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
import useSWR from "swr";
import { fetcher, formatDate } from "@/lib/func";
import type { StokOpnameDetail } from "@/types/types";
import { Calendar, Notebook, User2 } from "lucide-react";

interface Props {
  id: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OpnameDetailModal({ id, isOpen, onClose }: Props) {
  const { data, isLoading } = useSWR<StokOpnameDetail>(
    id && isOpen ? `/api/admin/inventory/opname/${id}` : null,
    fetcher,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader>Detail Stok Opname</ModalHeader>
        <ModalBody>
          {isLoading || !data ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Spinner />
              <p className="text-sm text-default-400">Memuat data...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <User2 size={14} className="text-default-500" />
                    <p className="text-default-400 text-xs uppercase font-medium">
                      Dicatat Oleh
                    </p>
                  </div>
                  {data.addedBy ? (
                    <User
                      name={data.addedBy.name}
                      description={data.addedBy.role}
                      classNames={{ description: "capitalize" }}
                      avatarProps={{
                        src: data.addedBy.image ?? undefined,
                        size: "sm",
                      }}
                      className="justify-start"
                    />
                  ) : (
                    <span className="text-default-400">—</span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <Calendar size={14} className="text-default-500" />
                    <p className="text-default-400 text-xs uppercase font-medium">
                      Tanggal
                    </p>
                  </div>
                  <p className="text-sm">{formatDate(data.tanggal)}</p>
                </div>

                <div className="col-span-2 flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <Notebook size={14} className="text-default-500" />
                    <p className="text-default-400 text-xs uppercase font-medium">
                      Keterangan
                    </p>
                  </div>
                  {data.keterangan ? (
                    <p className="text-sm">{data.keterangan}</p>
                  ) : (
                    <span className="text-default-400 text-sm">
                      Tidak ada keterangan
                    </span>
                  )}
                </div>
              </div>

              <Divider />

              {/* Items Table */}
              <Table
                aria-label="Tabel Koreksi Stok"
                classNames={{
                  wrapper: "border border-default-200 shadow-none rounded-lg",
                  th: "bg-default-50 text-default-500",
                }}
              >
                <TableHeader>
                  <TableColumn>Bahan Baku</TableColumn>
                  <TableColumn>Stok Sistem</TableColumn>
                  <TableColumn>Stok Fisik</TableColumn>
                  <TableColumn>Selisih</TableColumn>
                </TableHeader>
                <TableBody>
                  {data.items.map((item) => {
                    const selisih = Number(item.selisih);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {item.bahanBaku.nama}
                            </p>
                            <p className="text-xs text-default-400">
                              {item.bahanBaku.unit?.nama}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="tabular-nums text-sm">
                            {Number(item.stokSistem).toLocaleString("id-ID")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="tabular-nums text-sm font-medium">
                            {Number(item.stokFisik).toLocaleString("id-ID")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={
                              selisih === 0
                                ? "default"
                                : selisih > 0
                                  ? "success"
                                  : "danger"
                            }
                          >
                            {selisih > 0 ? "+" : ""}
                            {selisih.toLocaleString("id-ID")}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
