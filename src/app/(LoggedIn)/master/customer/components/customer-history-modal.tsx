"use client";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShoppingBag, ExternalLink, Calendar, CreditCard } from "lucide-react";
import useSWR from "swr";
import { fetcher, formatRupiah, getInitialName } from "@/lib/func";
import { Customer } from "@/types/types";
import Link from "next/link";

interface OrderRow {
  id: string;
  nomorOrder: string;
  grandTotal: number;
  createdAt: string;
  statusPembayaran: "BELUM_BAYAR" | "DP" | "LUNAS";
  statusProduksi: string;
}

function paymentColor(
  s: string,
): "default" | "warning" | "success" {
  if (s === "LUNAS") return "success";
  if (s === "DP") return "warning";
  return "default";
}

function paymentLabel(s: string) {
  const map: Record<string, string> = {
    BELUM_BAYAR: "Belum Bayar",
    DP: "DP",
    LUNAS: "Lunas",
  };
  return map[s] ?? s;
}

export default function CustomerHistoryModal({
  customer,
  isOpen,
  onOpenChange,
}: {
  customer: Customer;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = useSWR(
    isOpen
      ? `/api/admin/customer/${customer.id}/orders?limit=100`
      : null,
    fetcher,
  );

  const orders: OrderRow[] = data?.results ?? [];

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      scrollBehavior="inside"
      placement="center"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={customer.image || ""} alt={customer.nama} />
                <AvatarFallback>{getInitialName(customer.nama)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{customer.nama}</p>
                <p className="text-sm font-normal text-default-400">
                  {customer.nomorHp}
                </p>
              </div>
            </ModalHeader>

            <ModalBody className="gap-4 pb-6">
              {/* Stats Row */}
              {isLoading ? (
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-default-50 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-xs text-default-400 flex items-center gap-1">
                      <ShoppingBag size={12} /> Total Pesanan
                    </span>
                    <span className="text-2xl font-bold">
                      {data?.totalOrder ?? 0}
                    </span>
                  </div>
                  <div className="bg-default-50 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-xs text-default-400 flex items-center gap-1">
                      <CreditCard size={12} /> Total Belanja
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {formatRupiah(data?.totalSpend ?? 0)}
                    </span>
                  </div>
                  <div className="bg-default-50 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-xs text-default-400 flex items-center gap-1">
                      <Calendar size={12} /> Pesanan Pertama
                    </span>
                    <span className="text-sm font-semibold">
                      {data?.firstOrder
                        ? new Date(
                            data.firstOrder.createdAt,
                          ).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </span>
                  </div>
                </div>
              )}

              {/* Orders List */}
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-default-500 uppercase tracking-wide">
                  Riwayat Pesanan
                </h3>
                {isLoading ? (
                  <div className="flex flex-col gap-2">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-14 rounded-lg" />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-default-400 text-sm">
                    Belum ada riwayat pesanan
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-default-100 bg-default-50 hover:bg-default-100 transition-colors"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-sm">
                            {order.nomorOrder}
                          </span>
                          <span className="text-xs text-default-400">
                            {new Date(order.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {formatRupiah(Number(order.grandTotal))}
                          </span>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={paymentColor(order.statusPembayaran)}
                          >
                            {paymentLabel(order.statusPembayaran)}
                          </Chip>
                          <Link href={`/order`} onClick={onClose}>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              title="Lihat Order"
                            >
                              <ExternalLink size={13} />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ModalBody>

            <ModalFooter>
              <Button variant="bordered" onPress={onClose}>
                Tutup
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
