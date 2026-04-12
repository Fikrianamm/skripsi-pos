"use client";

import React from "react";
import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/func";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Button,
  Chip,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Skeleton,
  useDisclosure,
  Pagination,
} from "@heroui/react";
import {
  AlertCircle,
  Calendar,
  ExternalLink,
  Eye,
  FileText,
  PackageSearch,
  Trash2,
  Upload,
  ArrowRight,
} from "lucide-react";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import {
  FilterLanjutan,
  FilterSection,
  FilterButtonGroup,
} from "@/components/filter-lanjutan";
import { authClient } from "@/lib/auth-client";

// ── Types ──────────────────────────────────────────────────────────────────────
interface DesignFile {
  id: string;
  nama: string;
  filePath: string;
  createdAt: string;
  uploadedBy: { id: string; name: string } | null;
}

interface DesignOrder {
  id: string;
  nomorOrder: string;
  deadline: string | null;
  statusProduksi: string;
  catatan: string | null;
  createdAt: string;
  customer: { id: string; nama: string; nomorHp: string };
  items: { nama: string; qty: number }[];
  designFiles: DesignFile[];
}

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

// ── Upload Modal ───────────────────────────────────────────────────────────────
function UploadModal({
  isOpen,
  onClose,
  orderId,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: () => void;
}) {
  const [nama, setNama] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleClose() {
    setNama("");
    setFile(null);
    onClose();
  }

  async function handleUpload() {
    if (!file || !nama.trim()) {
      addToast({ title: "Lengkapi nama dan pilih file.", color: "warning" });
      return;
    }
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("nama", nama.trim());
      fd.append("file", file);
      const res = await fetch(`/api/order/${orderId}/design-files`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        addToast({
          title: "Gagal upload",
          description: json.error,
          color: "danger",
        });
        return;
      }
      addToast({ title: "File berhasil diupload", color: "success" });
      onSuccess();
      handleClose();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <ModalContent>
        <ModalHeader className="text-sm">Upload File Desain</ModalHeader>
        <ModalBody className="gap-4">
          <Input
            label="Nama File"
            placeholder="contoh: Desain Kaos Final v2"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            size="sm"
          />
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.ai,.eps,.psd,.zip"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button
              variant="flat"
              size="sm"
              className="w-full"
              onPress={() => fileInputRef.current?.click()}
              startContent={<Upload size={14} />}
            >
              {file ? file.name : "Pilih File"}
            </Button>
            {file && (
              <p className="text-xs text-default-400 mt-1.5 text-center">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
          <p className="text-xs text-default-400">
            Format: JPG, PNG, PDF, AI, PSD, ZIP · Maks 10 MB
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            size="sm"
            variant="flat"
            onPress={handleClose}
            isDisabled={isLoading}
          >
            Batal
          </Button>
          <Button
            size="sm"
            color="primary"
            onPress={handleUpload}
            isLoading={isLoading}
            isDisabled={!file || !nama.trim()}
          >
            Upload
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ── Confirm Modal ──────────────────────────────────────────────────────────────
function ConfirmModal({
  isOpen,
  onClose,
  title,
  description,
  onConfirm,
  isLoading,
  confirmLabel,
  confirmColor,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onConfirm: () => void;
  isLoading: boolean;
  confirmLabel: string;
  confirmColor?: "danger" | "primary" | "warning";
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalContent>
        <ModalHeader className="text-sm">{title}</ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-600">{description}</p>
        </ModalBody>
        <ModalFooter>
          <Button
            size="sm"
            variant="flat"
            onPress={onClose}
            isDisabled={isLoading}
          >
            Batal
          </Button>
          <Button
            size="sm"
            color={confirmColor ?? "primary"}
            onPress={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ── Design Order Card ──────────────────────────────────────────────────────────
function DesignOrderCard({
  order,
  canEdit,
  onMutate,
}: {
  order: DesignOrder;
  canEdit: boolean;
  onMutate: () => void;
}) {
  const overdue = isOverdue(order.deadline);
  const days = daysUntil(order.deadline);

  const uploadDisclosure = useDisclosure();
  const advanceDisclosure = useDisclosure();
  const [deletingFileId, setDeletingFileId] = React.useState<string | null>(
    null,
  );
  const [isDeletingFile, setIsDeletingFile] = React.useState(false);
  const [isAdvancing, setIsAdvancing] = React.useState(false);
  const [fileToDelete, setFileToDelete] = React.useState<DesignFile | null>(
    null,
  );
  const deleteDisclosure = useDisclosure();

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
      <div className="rounded-xl border bg-content1 shadow-sm overflow-hidden">
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
            <>
              <Divider className="my-0" />
              <Button
                size="sm"
                color="success"
                variant="flat"
                endContent={<ArrowRight size={14} />}
                onPress={advanceDisclosure.onOpen}
                className="self-end"
              >
                Lanjut ke Produksi
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={uploadDisclosure.isOpen}
        onClose={uploadDisclosure.onClose}
        orderId={order.id}
        onSuccess={onMutate}
      />

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

      <ConfirmModal
        isOpen={advanceDisclosure.isOpen}
        onClose={advanceDisclosure.onClose}
        title="Lanjut ke Produksi"
        description={`Order ${order.nomorOrder} akan dipindahkan ke tahap Produksi. Pastikan semua file desain sudah lengkap.`}
        onConfirm={handleAdvance}
        isLoading={isAdvancing}
        confirmLabel="Ya, Lanjutkan"
        confirmColor="primary"
      />
    </>
  );
}

// ── Skeleton Card ──────────────────────────────────────────────────────────────
function DesignCardSkeleton() {
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

// ── Filter Options ─────────────────────────────────────────────────────────────
const HAS_FILE_OPTIONS = [
  { key: "all", label: "Semua" },
  { key: "true", label: "Ada File" },
  { key: "false", label: "Belum Ada File" },
];

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Page() {
  const { data: sessionData } = authClient.useSession();
  const role = sessionData?.user?.role ?? "";
  const canEdit = role === "admin" || role === "designer";

  const [search, setSearch] = React.useState("");
  const [hasFileFilter, setHasFileFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const limit = 12;

  const apiUrl = `/api/production/design-queue?page=${page}&limit=${limit}&search=${debouncedSearch}&hasFile=${hasFileFilter}`;

  const { data, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    keepPreviousData: true,
    refreshInterval: 30_000,
  });

  const orders: DesignOrder[] = data?.results ?? [];
  const totalPages = data?.count ? Math.ceil(data.count / limit) : 0;

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, hasFileFilter]);

  const activeFilters = hasFileFilter !== "all" || search !== "";

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-5 mb-6">
      <PageHeader
        title="Antrian Desain"
        description="Kelola file desain untuk pesanan yang sedang di tahap Desain."
      />

      {/* ── Filter Bar ── */}
      <div className="flex flex-col md:flex-row gap-2">
        <SearchInput
          value={search}
          placeholder="Cari nomor order atau customer..."
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="w-full"
        />
        <div className="flex flex-row gap-2 items-center justify-start">
          <FilterLanjutan
            activeCount={hasFileFilter !== "all" ? 1 : 0}
            onReset={() => {
              setSearch("");
              setHasFileFilter("all");
            }}
          >
            <FilterSection label="File Desain">
              <FilterButtonGroup
                options={HAS_FILE_OPTIONS}
                value={hasFileFilter}
                onChange={setHasFileFilter}
              />
            </FilterSection>
          </FilterLanjutan>
        </div>
      </div>
      {data?.count !== undefined && (
        <div className="flex gap-2 items-center">
          <span className="text-xs text-default-400 tabular-nums">
            {data.count} order ditemukan
          </span>
          <Divider className="flex-1" />
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 text-xs text-default-400 flex-wrap pb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-danger" />
          <span>Deadline terlewat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-warning" />
          <span>Deadline ≤ 2 hari</span>
        </div>
        {!canEdit && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="italic">Mode view-only</span>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <DesignCardSkeleton key={i} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-default-400">
          <PackageSearch size={56} strokeWidth={1.1} />
          <div className="text-center">
            <p className="text-base font-medium">
              Tidak ada order di antrian desain
            </p>
            <p className="text-sm mt-1">
              {activeFilters
                ? "Coba ubah atau reset filter di atas."
                : "Order akan muncul di sini ketika statusnya berubah ke Desain."}
            </p>
          </div>
          {activeFilters && (
            <Button
              size="sm"
              variant="flat"
              onPress={() => {
                setSearch("");
                setHasFileFilter("all");
              }}
            >
              Reset Filter
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((order) => (
            <DesignOrderCard
              key={order.id}
              order={order}
              canEdit={canEdit}
              onMutate={mutate}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center pt-2">
          <Pagination
            total={totalPages}
            page={page}
            onChange={setPage}
            showControls
            size="sm"
            color="primary"
            variant="flat"
          />
        </div>
      )}
    </div>
  );
}
