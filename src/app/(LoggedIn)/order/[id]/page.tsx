"use client";

import { useState } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { fetcher } from "@/lib/func";
import { Button, Card, CardBody, Spinner, Tooltip } from "@heroui/react";
import { ArrowLeft, Package, RefreshCw, Trash2 } from "lucide-react";
import { addToast } from "@heroui/toast";
import { UpdateStatusModal } from "../list/components/update-status-modal";
import { OrderDetail } from "./components/types";
import { ProduksiProgress } from "./components/produksi-progress";
import { OrderInfoCard } from "./components/order-info-card";
import { OrderItemsTable } from "./components/order-items-table";
import { DesignFilesCard } from "./components/design-files-card";
import { PaymentSummary } from "./components/payment-summary";

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading, mutate } = useSWR(`/api/order/${orderId}`, fetcher);
  const order: OrderDetail | null = data?.order ?? null;

  async function handleDelete() {
    if (
      !confirm(
        `Hapus pesanan ${order?.nomorOrder}? Tindakan ini tidak dapat dibatalkan.`,
      )
    )
      return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/order/${orderId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        addToast({
          title: "Gagal menghapus",
          description: json.error,
          color: "danger",
        });
        return;
      }
      addToast({ title: "Pesanan dihapus", color: "success" });
      router.push("/order/list");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-default-400">
        <Package size={48} strokeWidth={1.2} />
        <p className="text-base font-medium">Pesanan tidak ditemukan</p>
        <Button
          size="sm"
          variant="flat"
          startContent={<ArrowLeft size={14} />}
          onPress={() => router.push("/order/list")}
        >
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-5 mb-6">
      {/* ── Header ── */}
      <div className="pb-2 border-b border-default-200 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {order.nomorOrder}
          </h1>
          <p className="text-sm text-default-400 mt-0.5">
            Dibuat pada{" "}
            {new Date(order.createdAt).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            {" · "}Diperbarui{" "}
            {new Date(order.updatedAt).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <Button
            size="sm"
            variant="flat"
            startContent={<ArrowLeft size={14} />}
            onPress={() => router.push("/order/list")}
          >
            Kembali
          </Button>
          <Tooltip content="Refresh">
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onPress={() => mutate()}
            >
              <RefreshCw size={14} />
            </Button>
          </Tooltip>
          <UpdateStatusModal
            orderId={order.id}
            nomorOrder={order.nomorOrder}
            currentStatus={order.statusProduksi}
            currentStatusBayar={order.statusPembayaran}
            onUpdated={() => mutate()}
          />
          <Tooltip content="Hapus pesanan (admin only)">
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              color="danger"
              onPress={handleDelete}
              isLoading={isDeleting}
            >
              <Trash2 size={14} />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* ── Progress produksi ── */}
      <Card shadow="sm" className="border border-default-200">
        <CardBody className="py-3 px-4">
          <ProduksiProgress current={order.statusProduksi} />
        </CardBody>
      </Card>

      {/* ── Grid: left content + right sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* Left */}
        <div className="flex flex-col gap-5">
          <OrderInfoCard order={order} />
          <OrderItemsTable items={order.items} />
          <DesignFilesCard files={order.designFiles} />
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-5">
          <PaymentSummary order={order} />
        </div>
      </div>
    </div>
  );
}
