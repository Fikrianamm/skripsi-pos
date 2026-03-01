"use client";

import { Avatar, Button, Card, CardBody, Chip, Tooltip } from "@heroui/react";
import { Eye, Calendar, CreditCard, Factory } from "lucide-react";
import { formatRupiah } from "@/lib/func";
import {
  getStatusProduksiBadge,
  getStatusBayarBadge,
} from "../../components/order-badges";
import { OrderRow } from "../../components/types";
import { UpdateStatusModal } from "./update-status-modal";

interface OrderCardProps {
  order: OrderRow;
  onNavigate: () => void;
  onStatusUpdated: () => void;
}

export function OrderCard({
  order,
  onNavigate,
  onStatusUpdated,
}: OrderCardProps) {
  const produksiBadge = getStatusProduksiBadge(order.statusProduksi);
  const bayarBadge = getStatusBayarBadge(order.statusPembayaran);

  const deadlineDate = order.deadline
    ? new Date(order.deadline).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const isOverdue =
    order.deadline &&
    new Date(order.deadline) < new Date() &&
    order.statusProduksi !== "SELESAI" &&
    order.statusProduksi !== "BATAL";

  return (
    <Card
      shadow="none"
      className="border border-default-200 hover:border-primary/40 hover:bg-default-50 transition-all cursor-pointer"
    >
      <CardBody className="px-4 py-3" onClick={onNavigate}>
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <Avatar
            src={order.customer.image ?? undefined}
            name={order.customer.nama}
            size="sm"
            isBordered
            color="primary"
            className="shrink-0"
          />

          {/* Customer + Order Number */}
          <div className="min-w-0 w-[170px] shrink-0">
            <p className="text-sm font-semibold text-default-900 truncate">
              {order.customer.nama}
            </p>
            <p className="text-xs text-default-400 font-mono truncate">
              {order.nomorOrder}
            </p>
          </div>

          {/* Status chips */}
          <div className="flex items-center gap-1.5 flex-1 flex-wrap">
            <div className="flex items-center gap-1">
              <Factory size={11} className="text-default-300 shrink-0" />
              <Chip
                size="sm"
                color={produksiBadge.color}
                variant="flat"
                className="text-xs h-6"
              >
                {produksiBadge.label}
              </Chip>
            </div>
            <div className="flex items-center gap-1">
              <CreditCard size={11} className="text-default-300 shrink-0" />
              <Chip
                size="sm"
                color={bayarBadge.color}
                variant="flat"
                className="text-xs h-6"
              >
                {bayarBadge.label}
              </Chip>
            </div>
          </div>

          <div className="w-[155px] shrink-0 hidden sm:flex items-center gap-1">
            {deadlineDate ? (
              <span
                className={`flex items-center gap-1 text-xs ${
                  isOverdue ? "text-danger font-semibold" : "text-default-400"
                }`}
              >
                <Calendar size={11} className="shrink-0" />
                <span className="font-medium">Deadline:</span>
                {isOverdue && " ⚠"}
                {deadlineDate}
              </span>
            ) : (
              <span className="text-xs text-default-200 italic">—</span>
            )}
          </div>

          {/* Grand total */}
          <p className="font-bold text-sm text-primary w-[100px] text-right shrink-0 hidden md:block">
            {formatRupiah(parseFloat(order.grandTotal))}
          </p>

          {/* Actions — stopPropagation */}
          <div
            className="flex items-center gap-1 shrink-0 ml-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <UpdateStatusModal
              orderId={order.id}
              nomorOrder={order.nomorOrder}
              currentStatus={order.statusProduksi}
              currentStatusBayar={order.statusPembayaran}
              onUpdated={onStatusUpdated}
            />
            <Tooltip content="Lihat detail">
              <Button isIconOnly size="sm" variant="light" onPress={onNavigate}>
                <Eye size={14} />
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Mobile total */}
        <div className="flex items-center justify-between mt-1.5 pl-9 md:hidden">
          <span className="text-xs text-default-400">
            {deadlineDate ? `Deadline: ${deadlineDate}` : "—"}
          </span>
          <span className="font-bold text-sm text-primary">
            {formatRupiah(parseFloat(order.grandTotal))}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
