"use client";

import useSWR from "swr";
import { fetcher, formatRupiah, formatDate } from "@/lib/func";
import { Eye, Receipt } from "lucide-react";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Divider,
  Skeleton,
} from "@heroui/react";
import type { PenerimaanDetail } from "@/types/types";

function InfoField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-default-400 uppercase tracking-wide">
        {label}
      </span>
      {children}
    </div>
  );
}

interface Props {
  id: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export function PenerimaanDetailModal({
  id,
  isOpen,
  onClose,
}: Props) {
  const { data, isLoading } = useSWR<PenerimaanDetail>(
    id ? `/api/admin/inventory/in/${id}` : null,
    fetcher,
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-primary" />
              <span>Detail Penerimaan Barang</span>
            </div>
            {!isLoading && data && (
              <p className="text-sm font-normal text-default-500">
                {data.nomorFaktur || "—"} · {formatDate(data.tanggal)}
              </p>
            )}
          </ModalHeader>

          <ModalBody className="pb-2 gap-4">
            {isLoading || !data ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoField label="Supplier">
                    <span className="font-medium">
                      {data.supplier?.nama || "—"}
                    </span>
                  </InfoField>
                  <InfoField label="Dicatat oleh">
                    <span className="font-medium">
                      {data.addedBy?.name || "—"}
                    </span>
                  </InfoField>
                  <InfoField label="Total Tagihan">
                    <span className="font-semibold text-primary">
                      {formatRupiah(data.totalTagihan)}
                    </span>
                  </InfoField>
                  <InfoField label="Bukti Nota">
                    {data.buktiNota ? (
                      <Button
                        as="a"
                        href={data.buktiNota}
                        target="_blank"
                        rel="noreferrer"
                        variant="flat"
                        size="sm"
                        startContent={<Eye size={14} />}
                        className="self-start"
                      >
                        Lihat Nota
                      </Button>
                    ) : (
                      <span className="text-default-400">—</span>
                    )}
                  </InfoField>
                  {data.keterangan && (
                    <div className="col-span-2">
                      <InfoField label="Keterangan">
                        <span>{data.keterangan}</span>
                      </InfoField>
                    </div>
                  )}
                </div>

                <Divider />

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-default-400 mb-2">
                    Daftar Bahan Baku ({data.items.length} item)
                  </p>
                  <div className="flex flex-col divide-y divide-divider rounded-xl border border-default-200 overflow-hidden">
                    {data.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-4 py-3 bg-content1"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {item.bahanBaku.nama}
                          </p>
                          <p className="text-xs text-default-400">
                            {item.jumlah} {item.bahanBaku.unit?.nama || ""}
                            {item.hargaBeli > 0 &&
                              ` · ${formatRupiah(item.hargaBeli)}/unit`}
                          </p>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatRupiah(item.totalHargaItem)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </ModalBody>

        </ModalContent>
      </Modal>
    </>
  );
}
