"use client";

import React from "react";
import Link from "next/link";
import { Button, Chip, Skeleton } from "@heroui/react";
import { Eye } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface DesignFileItem {
  id: string;
  nama: string;
  filePath: string;
  createdAt: string;
  uploadedBy: { id: string; name: string } | null;
  order: {
    id: string;
    nomorOrder: string;
    statusProduksi: string;
    deadline: string | null;
    customer: { id: string; nama: string; nomorHp: string };
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getFileIcon(filePath: string) {
  const ext = filePath.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "📄";
  if (ext === "psd" || ext === "ai" || ext === "eps") return "🎨";
  if (ext === "zip") return "📦";
  return "🖼️";
}

function statusColor(
  s: string,
): "success" | "warning" | "danger" | "default" | "primary" | "secondary" {
  const map: Record<
    string,
    "success" | "warning" | "danger" | "default" | "primary" | "secondary"
  > = {
    DESAIN: "secondary",
    PRODUKSI: "primary",
    PACKING: "warning",
    SELESAI: "success",
    BATAL: "danger",
    PENDING: "default",
  };
  return map[s] ?? "default";
}

// ── File Card ──────────────────────────────────────────────────────────────────
export function FileCard({ file }: { file: DesignFileItem }) {
  // Preview: tampilkan langsung jika format gambar
  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(file.filePath);
  const previewSrc = isImage ? file.filePath : null;

  return (
    <div className="rounded-xl border bg-content1 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
      {/* Preview area */}
      <div className="relative bg-default-100 h-36 flex items-center justify-center overflow-hidden">
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewSrc}
            alt={file.nama}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-5xl select-none">
            {getFileIcon(file.filePath)}
          </span>
        )}
        {/* Overlay tombol lihat */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Button
            as="a"
            href={file.filePath}
            target="_blank"
            size="sm"
            color="primary"
            variant="solid"
            startContent={<Eye size={13} />}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Lihat
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5">
        {/* Nama file */}
        <p className="text-sm font-medium truncate" title={file.nama}>
          {file.nama}
        </p>

        {/* Order */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link
            href={`/order/${file.order.id}`}
            className="text-xs font-mono text-primary hover:underline"
          >
            {file.order.nomorOrder}
          </Link>
          <Chip
            size="sm"
            color={statusColor(file.order.statusProduksi)}
            variant="flat"
            className="h-4 text-[10px]"
          >
            {file.order.statusProduksi}
          </Chip>
        </div>

        {/* Customer */}
        <p className="text-xs text-default-500 truncate">
          {file.order.customer.nama}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span className="text-[10px] text-default-400">
            {file.uploadedBy?.name ?? "—"} · {formatDate(file.createdAt)}
          </span>
          <Button
            as="a"
            href={file.filePath}
            target="_blank"
            size="sm"
            variant="flat"
            isIconOnly
            className="h-6 w-6 min-w-6 shrink-0"
          >
            <Eye size={12} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
export function FileCardSkeleton() {
  return (
    <div className="rounded-xl border bg-content1 shadow-sm overflow-hidden">
      <Skeleton className="h-36 w-full" />
      <div className="p-3 flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4 rounded-lg" />
        <Skeleton className="h-3 w-24 rounded-lg" />
        <Skeleton className="h-3 w-32 rounded-lg" />
        <Skeleton className="h-3 w-20 rounded-lg" />
      </div>
    </div>
  );
}
