"use client";

import { Avatar, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { Calendar, FileText, Phone, Zap } from "lucide-react";
import { formatChannel } from "../../components/order-badges";
import { OrderDetail } from "./types";

interface OrderInfoCardProps {
  order: OrderDetail;
}

export function OrderInfoCard({ order }: OrderInfoCardProps) {
  const deadlineDate = order.deadline
    ? new Date(order.deadline).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const isOverdue =
    order.deadline &&
    new Date(order.deadline) < new Date() &&
    order.statusProduksi !== "SELESAI" &&
    order.statusProduksi !== "BATAL";

  return (
    <Card shadow="sm" className="border border-default-200">
      <CardHeader className="pb-1 pt-4 px-4">
        <span className="text-sm font-semibold text-default-700">
          Informasi Pesanan
        </span>
      </CardHeader>
      <Divider />
      <CardBody className="p-4 gap-4">
        {/* Customer row */}
        <div className="flex items-center gap-3">
          <Avatar
            src={order.customer.image ?? undefined}
            name={order.customer.nama}
            size="md"
            isBordered
            color="primary"
            className="shrink-0"
          />
          <div>
            <p className="text-sm font-semibold text-default-900">
              {order.customer.nama}
            </p>
            <p className="text-xs text-default-400 flex items-center gap-1 mt-0.5">
              <Phone size={11} />
              {order.customer.nomorHp}
            </p>
          </div>
        </div>

        <Divider />

        {/* Meta grid: 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <Zap size={14} className="text-default-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-default-400">Channel</p>
              <p className="text-sm font-medium">
                {formatChannel(order.channel)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Calendar
              size={14}
              className={`mt-0.5 shrink-0 ${isOverdue ? "text-danger" : "text-default-400"}`}
            />
            <div>
              <p className="text-xs text-default-400">Deadline</p>
              {deadlineDate ? (
                <p
                  className={`text-sm font-medium ${isOverdue ? "text-danger" : ""}`}
                >
                  {isOverdue && "⚠ "}
                  {deadlineDate}
                </p>
              ) : (
                <p className="text-sm text-default-300 italic">
                  Tidak ada deadline
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Catatan */}
        {order.catatan && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-default-50 border border-default-200">
            <FileText size={14} className="text-default-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-default-400 mb-0.5">Catatan</p>
              <p className="text-sm text-default-700 whitespace-pre-line">
                {order.catatan}
              </p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
