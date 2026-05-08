"use client";

import React from "react";
import Link from "next/link";
import {
  Button,
  Chip,
  Divider,
  Skeleton,
  useDisclosure,
} from "@heroui/react";
import {
  AlertCircle,
  Calendar,
  ExternalLink,
  Eye,
  FileText,
  Trash2,
  Upload,
  ArrowRight,
} from "lucide-react";
import { addToast } from "@heroui/toast";
import { DesignOrder, DesignFile } from "./types";
import { UploadModal } from "./upload-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { SpkFormModal } from "@/app/(LoggedIn)/order/[id]/components/spk-form-modal";

// ── Helpers ────────────────────────────────────────────────────────────────────
function isOverdue(deadline: string | null) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
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

function getFileIcon(filePath: string) {
  const ext = filePath.split(".").pop()?.toLowerCase();
  return ext === "pdf"
    ? "📄"
    : ext === "psd" || ext === "ai"
      ? "🎨"
      : ext === "zip"
        ? "📦"
        : "🖼️";
}

interface DesignOrderCardProps {
  order: DesignOrder;
  canEdit: boolean;
  onMutate: () => void;
}

export function DesignOrderCard({
  order,
  canEdit,
  onMutate,
}: DesignOrderCardProps) {
  const overdue = isOverdue(order.deadline);
  const days = daysUntil(order.deadline);

  const uploadDisclosure = useDisclosure();
  const advanceDisclosure = useDisclosure();
  const spkDisclosure = useDisclosure();
  const deleteDisclosure = useDisclosure();

  const [deletingFileId, setDeletingFileId] = React.useState<string | null>(null);
  const [isDeletingFile, setIsDeletingFile] = React.useState(false);
  const [isAdvancing, setIsAdvancing] = React.useState(false);
  const [fileToDelete, setFileToDelete] = React.useState<DesignFile | null>(null);

  async function handleDeleteFile() {
    if (!fileToDelete) return;
    setIsDeletingFile(true);
    setDeletingFileId(fileToDelete.id);
    try {
      const res = await fetch(`/api/order/${order.id}/design-files`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designFileId: fileToDelete.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast({
          title: "Gagal hapus",
          description: json.error,
          color: "danger",
        });
        return;
      }
      addToast({ title: "File berhasil dihapus", color: "success" });
      onMutate();
      deleteDisclosure.onClose();
      setFileToDelete(null);
    } finally {
      setIsDeletingFile(false);
      setDeletingFileId(null);
    }
  }

  async function handleAdvance() {
    setIsAdvancing(true);
    try {
      const res = await fetch(`/api/order/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusProduksi: "PRODUKSI" }),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast({ title: "Gagal", description: json.error, color: "danger" });
        return;
      }
      addToast({
        title: "Order dilanjutkan ke Produksi 🏭",
        color: "success",
      });
      onMutate();
      advanceDisclosure.onClose();
    } finally {
      setIsAdvancing(false);
    }
  }

  return (
    <>
      <div className="rounded-xl border bg-content1 shadow-sm overflow-hidden flex flex-col h-full">
        {/* ── Deadline warning bar ── */}
        {overdue && (
          <div className="bg-danger-50 border-b border-danger-200 px-4 py-1.5 flex items-center gap-1.5 text-danger text-xs font-medium">
            <AlertCircle size={13} />
            Deadline terlewat · {formatDate(order.deadline)}
          </div>
        )}
        {!overdue && days !== null && days <= 2 && (
          <div className="bg-warning-50 border-b border-warning-200 px-4 py-1.5 flex items-center gap-1.5 text-warning-700 text-xs font-medium">
            <AlertCircle size={13} />
            Deadline {days === 0 ? "hari ini" : `${days} hari lagi`} ·{" "}
            {formatDate(order.deadline)}
          </div>
        )}

        <div className="p-4 flex flex-col gap-3">
          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <Link
                href={`/order/${order.id}`}
                className="font-mono font-semibold text-sm text-primary hover:underline flex items-center gap-1"
              >
                {order.nomorOrder}
                <ExternalLink size={11} />
              </Link>
              <span className="text-xs text-default-500">
                {order.customer.nama}
                {order.customer.nomorHp && <> · {order.customer.nomorHp}</>}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-default-400 shrink-0">
              <Calendar
                size={13}
                className={
                  overdue
                    ? "text-danger"
                    : days !== null && days <= 2
                      ? "text-warning-600"
                      : "text-default-400"
                }
              />
              <span
                className={
                  overdue
                    ? "text-danger font-medium"
                    : days !== null && days <= 2
                      ? "text-warning-600 font-medium"
                      : ""
                }
              >
                {order.deadline ? formatDate(order.deadline) : "Tanpa deadline"}
              </span>
            </div>
          </div>

          {/* ── Items ── */}
          {order.items.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {order.items.map((item, i) => (
                <Chip key={i} size="sm" variant="flat" color="default">
                  {item.nama} ×{Number(item.qty)}
                </Chip>
              ))}
            </div>
          )}

          {/* ── Catatan ── */}
          {order.catatan && (
            <p className="text-xs text-default-500 italic bg-default-50 rounded-lg px-3 py-2">
              {order.catatan}
            </p>
          )}

          <Divider className="my-0" />

          {/* ── Design Files ── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-default-600 flex items-center gap-1.5">
                <FileText size={13} />
                File Desain ({order.designFiles.length})
              </span>
              {canEdit && (
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  startContent={<Upload size={13} />}
                  onPress={uploadDisclosure.onOpen}
                  className="h-7 text-xs px-2"
                >
                  Upload
                </Button>
              )}
            </div>

            {order.designFiles.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-warning-600 bg-warning-50 rounded-lg px-3 py-2">
                <AlertCircle size={13} />
                Belum ada file desain diupload
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {order.designFiles.map((df) => (
                  <div
                    key={df.id}
                    className="flex items-center gap-2 p-2 rounded-lg border border-default-100 bg-default-50 hover:border-default-200 transition-colors"
                  >
                    <span className="text-base shrink-0">
                      {getFileIcon(df.filePath)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{df.nama}</p>
                      {df.uploadedBy && (
                        <p className="text-[10px] text-default-400">
                          {df.uploadedBy.name} · {formatDate(df.createdAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        as="a"
                        href={df.filePath}
                        target="_blank"
                        size="sm"
                        variant="flat"
                        isIconOnly
                        className="h-6 w-6 min-w-6"
                      >
                        <Eye size={12} />
                      </Button>
                      {canEdit && (
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          isIconOnly
                          className="h-6 w-6 min-w-6"
                          isDisabled={
                            isDeletingFile && deletingFileId === df.id
                          }
                          isLoading={isDeletingFile && deletingFileId === df.id}
                          onPress={() => {
                            setFileToDelete(df);
                            deleteDisclosure.onOpen();
                          }}
                        >
                          <Trash2 size={11} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Advance button ── */}
          {canEdit && (
            <div className="mt-auto">
              <Divider className="my-3" />
              <Button
                size="sm"
                color="success"
                variant="flat"
                endContent={<ArrowRight size={14} />}
                onPress={() => {
                  if (order.spk) {
                    advanceDisclosure.onOpen();
                  } else {
                    spkDisclosure.onOpen();
                  }
                }}
                className="w-full"
              >
                {order.spk ? "Lanjut ke Produksi" : "Buat SPK & Produksi"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadDisclosure.isOpen}
        onClose={uploadDisclosure.onClose}
        orderId={order.id}
        onSuccess={onMutate}
      />

      {/* Delete File Confirmation */}
      <ConfirmModal
        isOpen={deleteDisclosure.isOpen}
        onClose={deleteDisclosure.onClose}
        title="Hapus File Desain"
        description={`Yakin ingin menghapus file "${fileToDelete?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDeleteFile}
        isLoading={isDeletingFile}
        confirmLabel="Hapus"
        confirmColor="danger"
      />

      {/* Advance Confirmation (If SPK already exists) */}
      <ConfirmModal
        isOpen={advanceDisclosure.isOpen}
        onClose={advanceDisclosure.onClose}
        title="Lanjut ke Produksi"
        description={`Order ${order.nomorOrder} akan dipindahkan ke tahap Produksi. SPK sudah tersedia.`}
        onConfirm={handleAdvance}
        isLoading={isAdvancing}
        confirmLabel="Ya, Lanjutkan"
        confirmColor="primary"
      />

      {/* SPK Form Modal (If NO SPK yet) */}
      <SpkFormModal
        isOpen={spkDisclosure.isOpen}
        onOpenChange={spkDisclosure.onOpenChange}
        orderId={order.id}
        nomorOrder={order.nomorOrder}
        order={order}
        onSuccess={onMutate}
      />
    </>
  );
}

export function DesignCardSkeleton() {
  return (
    <div className="rounded-xl border bg-content1 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-32 rounded-lg" />
        <Skeleton className="h-3 w-20 rounded-lg" />
      </div>
      <Skeleton className="h-3 w-40 rounded-lg" />
      <div className="flex gap-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Divider />
      <Skeleton className="h-12 rounded-lg" />
      <Skeleton className="h-8 w-24 rounded-lg self-end" />
    </div>
  );
}
