"use client";

import React from "react";
import Link from "next/link";
import {
  Button,
  Chip,
  Divider,
  Skeleton,
  Switch,
} from "@heroui/react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ExternalLink,
  User,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface SpkItem {
  id: string;
  orderId: string;
  nomorSpk: string;
  tahapProduksi: string;
  model: string | null;
  ukuran: string | null;
  tali: string | null;
  jumlah: number;
  catatan: string | null;
  tanggalSetor: string | null;
  accCetak: boolean;
  accCetakAt: string | null;
  accCetakOleh: string | null;
  statusSPK: string;
  createdAt: string;
  karyawan: { id: string; nama: string; posisi: string | null };
  order: {
    id: string;
    nomorOrder: string;
    deadline: string | null;
    statusProduksi: string;
    customer: { id: string; nama: string; nomorHp: string };
    items: { nama: string; qty: number }[];
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function statusSPKBadge(s: string) {
  const map: Record<
    string,
    {
      color: "success" | "warning" | "danger" | "default" | "primary";
      label: string;
    }
  > = {
    AKTIF: { color: "success", label: "Aktif" },
    SELESAI: { color: "primary", label: "Selesai" },
    BATAL: { color: "danger", label: "Batal" },
  };
  return map[s] ?? { color: "default" as const, label: s };
}

function isOverdue(tanggalSetor: string | null) {
  if (!tanggalSetor) return false;
  return new Date(tanggalSetor) < new Date();
}

function formatDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(d: string | null): number | null {
  if (!d) return null;
  const diff = new Date(d).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

interface SpkQueueCardProps {
  spk: SpkItem;
  onToggleAcc: (spk: SpkItem, val: boolean) => void;
  onAdvance: (spk: SpkItem) => void;
  isTogglingId: string | null;
}

export function SpkQueueCard({
  spk,
  onToggleAcc,
  onAdvance,
  isTogglingId,
}: SpkQueueCardProps) {
  const badge = statusSPKBadge(spk.statusSPK);
  const overdue = isOverdue(spk.tanggalSetor);
  const days = daysUntil(spk.tanggalSetor);
  const isSelesai = spk.statusSPK === "SELESAI";

  return (
    <div
      className={`rounded-xl border bg-content1 shadow-sm overflow-hidden transition-opacity ${
        isSelesai ? "opacity-60" : ""
      }`}
    >
      {/* ── Top bar: deadline warning ── */}
      {overdue && !isSelesai && (
        <div className="bg-danger-50 border-b border-danger-200 px-4 py-1.5 flex items-center gap-1.5 text-danger text-xs font-medium">
          <AlertCircle size={13} />
          Deadline terlewat · {formatDate(spk.tanggalSetor)}
        </div>
      )}
      {!overdue && days !== null && days <= 2 && !isSelesai && (
        <div className="bg-warning-50 border-b border-warning-200 px-4 py-1.5 flex items-center gap-1.5 text-warning-700 text-xs font-medium">
          <AlertCircle size={13} />
          Deadline {days === 0 ? "hari ini" : `${days} hari lagi`} ·{" "}
          {formatDate(spk.tanggalSetor)}
        </div>
      )}

      <div className="p-4 flex flex-col gap-3">
        {/* ── Header row ── */}
        <div className="flex justify-between items-center">
          <p className="text-xs text-default-400">No. SPK</p>
          <p className="font-mono font-semibold text-sm text-primary hover:underline flex items-center gap-1">
            {spk.nomorSpk}
          </p>
        </div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/order/${spk.orderId}`}
              className="font-mono font-semibold text-sm text-primary hover:underline flex items-center gap-1"
            >
              {spk.order.nomorOrder}
              <ExternalLink size={11} />
            </Link>
            <span className="text-xs text-default-500">
              {spk.order.customer.nama}
              {spk.order.customer.nomorHp && (
                <> · {spk.order.customer.nomorHp}</>
              )}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Chip size="sm" color={badge.color} variant="flat">
              {badge.label}
            </Chip>
          </div>
        </div>

        <Divider className="my-0" />

        {/* ── Detail grid ── */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {/* Karyawan */}
          <div className="flex items-center gap-2 col-span-2">
            <User size={14} className="text-default-400 shrink-0" />
            <div>
              <p className="font-medium text-sm">{spk.karyawan.nama}</p>
              {spk.karyawan.posisi && (
                <p className="text-xs text-default-400">
                  {spk.karyawan.posisi}
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-default-400">Model</p>
            <p className="font-medium">{spk.model || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-default-400">Ukuran</p>
            <p className="font-medium">{spk.ukuran || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-default-400">Tali</p>
            <p>{spk.tali || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-default-400">Jumlah</p>
            <p className="font-semibold text-base">{Number(spk.jumlah)} pcs</p>
          </div>
        </div>

        {/* Items pesanan */}
        {spk.order.items.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {spk.order.items.map((item, i) => (
              <Chip key={i} size="sm" variant="flat" color="default">
                {item.nama} ×{item.qty}
              </Chip>
            ))}
          </div>
        )}

        {/* Catatan */}
        {spk.catatan && (
          <p className="text-xs text-default-500 italic bg-default-50 rounded-lg px-3 py-2">
            {spk.catatan}
          </p>
        )}

        <Divider className="my-0" />

        {/* ── Footer: Deadline + ACC Cetak ── */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar
              size={13}
              className={
                overdue && !isSelesai
                  ? "text-danger"
                  : days !== null && days <= 2 && !isSelesai
                    ? "text-warning-600"
                    : "text-default-400"
              }
            />
            <span
              className={
                overdue && !isSelesai
                  ? "text-danger font-medium"
                  : days !== null && days <= 2 && !isSelesai
                    ? "text-warning-600 font-medium"
                    : "text-default-500"
              }
            >
              {spk.tanggalSetor
                ? formatDate(spk.tanggalSetor)
                : "Tanpa deadline"}
            </span>
          </div>

          {/* ACC Cetak */}
          <div className="flex items-center gap-1.5">
            <CheckCircle2
              size={14}
              className={spk.accCetak ? "text-success" : "text-default-300"}
            />
            <span className="text-xs text-default-500">ACC Cetak</span>
            <Switch
              size="sm"
              color="success"
              isSelected={spk.accCetak}
              onValueChange={(val) => onToggleAcc(spk, val)}
              isDisabled={isTogglingId === spk.id}
            />
          </div>
        </div>

        {/* ── Advance button ── */}
        {!isSelesai && badge.color !== "danger" && (
          <>
            <Divider className="my-0" />
            <Button
              size="sm"
              color="primary"
              variant="flat"
              className="w-full"
              onPress={() => onAdvance(spk)}
              isDisabled={!spk.accCetak}
            >
              {spk.accCetak
                ? "Selesai Produksi (Lanjut Packing)"
                : "Belum ACC Cetak"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function SpkCardSkeleton() {
  return (
    <div className="rounded-xl border bg-content1 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-36 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-lg" />
      </div>
      <Skeleton className="h-3 w-48 rounded-lg" />
      <Divider />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-24 rounded-lg" />
        <Skeleton className="h-5 w-20 rounded-lg" />
      </div>
    </div>
  );
}
