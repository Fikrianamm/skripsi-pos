"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, formatRupiah, formatDate } from "@/lib/func";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Chip,
  User,
  Tooltip,
  Skeleton,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Textarea,
  Divider,
} from "@heroui/react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import {
  MessageCircle,
  AlertTriangle,
  Banknote,
  Clock,
  TrendingDown,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { addToast } from "@heroui/toast";
import {
  FilterLanjutan,
  FilterSection,
  FilterButtonGroup,
} from "@/components/filter-lanjutan";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { DatePicker } from "@heroui/date-picker";
import { getLocalTimeZone, today, CalendarDate } from "@internationalized/date";

type PiutangItem = {
  id: string;
  nomorOrder: string;
  grandTotal: number;
  sudahDibayar: number;
  sisaTagihan: number;
  statusPembayaran: string;
  deadline: string | null;
  createdAt: string;
  customer: {
    id: string;
    nama: string;
    nomorHp: string;
    image?: string | null;
  };
};

type StatusFilter = "all" | "BELUM_BAYAR" | "DP" | "overdue";

function buildWALink(
  nomorOrder: string,
  customer: PiutangItem["customer"],
  sisaTagihan: number,
) {
  const phone = customer.nomorHp.replace(/\D/g, "").replace(/^0/, "62");
  const text = encodeURIComponent(
    `Halo ${customer.nama},\n\nKami ingin mengingatkan bahwa Order *#${nomorOrder}* Anda masih memiliki sisa tagihan sebesar *${formatRupiah(sisaTagihan)}*.\n\nMohon segera lakukan pembayaran. Terima kasih 🙏`,
  );
  return `https://wa.me/${phone}?text=${text}`;
}

// ─── Input Pembayaran Modal ────────────────────────────────────────────────────
interface InputPaymentModalProps {
  isOpen: boolean;
  item: PiutangItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

function InputPaymentModal({
  isOpen,
  item,
  onClose,
  onSuccess,
}: InputPaymentModalProps) {
  const [nominal, setNominal] = useState<number>(0);
  const [nominalError, setNominalError] = useState("");
  const [metode, setMetode] = useState("TUNAI");
  const [keterangan, setKeterangan] = useState("");
  const [kasBankId, setKasBankId] = useState("");
  const [tanggal, setTanggal] = useState<CalendarDate | null>(
    today(getLocalTimeZone()),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: kasBankData } = useSWR("/api/finance/kas-bank", fetcher);
  const kasBanks: {
    id: string;
    namaRekening: string;
    jenisRekening: string;
  }[] = kasBankData?.kasBanks ?? [];

  function reset() {
    setNominal(0);
    setNominalError("");
    setMetode("TUNAI");
    setKeterangan("");
    setKasBankId("");
    setTanggal(today(getLocalTimeZone()));
  }

  async function handleSubmit() {
    if (!item) return;
    if (nominal <= 0) {
      addToast({
        title: "Validasi",
        description: "Nominal harus lebih dari 0.",
        color: "warning",
      });
      return;
    }
    if (nominal > item.sisaTagihan) {
      setNominalError(
        `Nominal tidak boleh melebihi sisa tagihan (${formatRupiah(item.sisaTagihan)})`,
      );
      return;
    }
    if (!kasBankId) {
      addToast({
        title: "Validasi",
        description: "Pilih rekening tujuan pembayaran.",
        color: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/order/${item.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nominal,
          metodePembayaran: metode,
          keterangan: keterangan || null,
          kasBankId,
          tanggal: tanggal?.toString() ?? new Date().toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast({ title: "Gagal", description: json.error, color: "danger" });
        return;
      }
      addToast({
        title: "Sukses",
        description: "Pembayaran berhasil dicatat.",
        color: "success",
      });
      reset();
      onSuccess();
      onClose();
    } catch {
      addToast({
        title: "Error",
        description: "Gagal terhubung ke server.",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const sisaBefore = item?.sisaTagihan ?? 0;
  const sisaAfter = Math.max(0, sisaBefore - nominal);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
      size="lg"
    >
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span>Input Pembayaran</span>
              {item && (
                <span className="text-sm font-normal text-default-500">
                  Order #{item.nomorOrder} — {item.customer.nama}
                </span>
              )}
            </ModalHeader>
            <ModalBody className="gap-4">
              {/* Tagihan info */}
              {item && (
                <div className="grid grid-cols-3 gap-3 p-3 bg-default-50 rounded-xl text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-default-400">
                      Total Tagihan
                    </span>
                    <span className="font-semibold">
                      {formatRupiah(item.grandTotal)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-default-400">
                      Sudah Dibayar
                    </span>
                    <span className="font-semibold text-success">
                      {formatRupiah(item.sudahDibayar)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-default-400">
                      Sisa Tagihan
                    </span>
                    <span className="font-semibold text-danger">
                      {formatRupiah(sisaBefore)}
                    </span>
                  </div>
                </div>
              )}

              {/* Nominal */}
              <FormattedNumberInput
                label="Nominal Pembayaran"
                value={nominal}
                onChange={(v) => {
                  const val = Number(v);
                  setNominal(val);
                  if (item && val > item.sisaTagihan) {
                    setNominalError(
                      `Maksimal ${formatRupiah(item.sisaTagihan)}`,
                    );
                  } else {
                    setNominalError("");
                  }
                }}
                isRequired
                isInvalid={!!nominalError}
                errorMessage={nominalError}
                startContent={
                  <span className="text-default-400 text-xs">Rp</span>
                }
              />

              {/* Sisa setelah bayar preview */}
              {nominal > 0 && item && (
                <div
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    sisaAfter === 0
                      ? "bg-success-50 text-success-700 border border-success-200"
                      : "bg-warning-50 text-warning-700 border border-warning-200"
                  }`}
                >
                  {sisaAfter === 0
                    ? "✓ Pembayaran ini akan melunasi tagihan"
                    : `Sisa tagihan setelah bayar: ${formatRupiah(sisaAfter)}`}
                </div>
              )}

              {/* Rekening & Metode */}
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Rekening Tujuan"
                  placeholder="Pilih Kas/Bank"
                  selectedKeys={kasBankId ? [kasBankId] : []}
                  onSelectionChange={(k) =>
                    setKasBankId(Array.from(k)[0] as string)
                  }
                  isRequired
                >
                  {kasBanks.map((kb) => (
                    <SelectItem key={kb.id} textValue={kb.namaRekening}>
                      {kb.namaRekening} ({kb.jenisRekening})
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="Metode Pembayaran"
                  selectedKeys={[metode]}
                  onSelectionChange={(k) =>
                    setMetode(Array.from(k)[0] as string)
                  }
                >
                  {(["TUNAI", "TRANSFER", "QRIS", "KREDIT"] as const).map(
                    (m) => (
                      <SelectItem key={m} textValue={m}>
                        {m}
                      </SelectItem>
                    ),
                  )}
                </Select>
              </div>

              <DatePicker
                label="Tanggal Pembayaran"
                value={tanggal}
                onChange={setTanggal}
              />

              <Textarea
                label="Keterangan (opsional)"
                placeholder="Mis. Pelunasan DP, Transfer BCA..."
                value={keterangan}
                onValueChange={setKeterangan}
                minRows={2}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" color="danger" onPress={close}>
                Batal
              </Button>
              <Button
                color="primary"
                startContent={<CreditCard size={16} />}
                onPress={handleSubmit}
                isLoading={isSubmitting}
              >
                Catat Pembayaran
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PiutangPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [paymentTarget, setPaymentTarget] = useState<PiutangItem | null>(null);

  const limit = 20;
  const today = new Date();

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== "all" && statusFilter !== "overdue"
      ? { status: statusFilter }
      : {}),
  });

  const { data, isLoading, mutate } = useSWR<{
    results: PiutangItem[];
    pagination: {
      total: number;
      totalPages: number;
      page: number;
      limit: number;
    };
  }>(`/api/finance/piutang?${params}`, fetcher);

  const allResults: PiutangItem[] = data?.results ?? [];

  // Client-side overdue filter (API gives all non-lunas, we filter overdue locally)
  const results =
    statusFilter === "overdue"
      ? allResults.filter((o) => o.deadline && new Date(o.deadline) < today)
      : allResults;

  // Summary stats from current page data
  const totalSisa = allResults.reduce((s, o) => s + o.sisaTagihan, 0);
  const totalBelumBayar = allResults.filter(
    (o) => o.statusPembayaran === "BELUM_BAYAR",
  ).length;
  const totalDP = allResults.filter((o) => o.statusPembayaran === "DP").length;
  const totalOverdue = allResults.filter(
    (o) => o.deadline && new Date(o.deadline) < today,
  ).length;

  const statusOptions = [
    { key: "all", label: "Semua" },
    { key: "BELUM_BAYAR", label: "Belum Bayar" },
    { key: "DP", label: "DP" },
    { key: "overdue", label: "Jatuh Tempo" },
  ];

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) + (debouncedSearch ? 1 : 0);

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-6 mb-4">
      <PageHeader
        title="Laporan Piutang"
        description="Monitor tagihan pelanggan yang belum lunas dan kelola pembayaran masuk."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Piutang */}
        <div className="flex flex-col gap-3 p-5 bg-danger-50 dark:bg-danger-950/30 text-danger-800 dark:text-danger-300 rounded-2xl border border-danger-200 dark:border-danger-800 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-danger-100 dark:bg-danger-900/50">
              <Banknote size={16} className="text-danger-600" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
              Total Piutang
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-40 rounded-lg" />
          ) : (
            <span className="text-2xl font-bold tabular-nums">
              {formatRupiah(totalSisa)}
            </span>
          )}
          <span className="text-xs opacity-60">
            {isLoading ? (
              <Skeleton className="h-3 w-24 rounded-md inline-block" />
            ) : (
              `${data?.pagination?.total ?? 0} order belum lunas`
            )}
          </span>
        </div>

        {/* Belum Bayar */}
        <div className="flex flex-col gap-3 p-5 rounded-2xl border border-default-200 bg-default-50 dark:bg-default-100/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-default-100 dark:bg-default-200/10">
              <TrendingDown size={16} className="text-default-600" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground-500">
              Belum Bayar
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16 rounded-lg" />
          ) : (
            <span className="text-2xl font-bold">{totalBelumBayar}</span>
          )}
          <span className="text-xs text-foreground-400">order</span>
        </div>

        {/* DP */}
        <div className="flex flex-col gap-3 p-5 rounded-2xl border border-warning-200 bg-warning-50 dark:bg-warning-950/30 text-warning-800 dark:text-warning-300">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-warning-100 dark:bg-warning-900/50">
              <CreditCard size={16} className="text-warning-600" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
              Bayar DP
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16 rounded-lg" />
          ) : (
            <span className="text-2xl font-bold">{totalDP}</span>
          )}
          <span className="text-xs opacity-60">order</span>
        </div>

        {/* Jatuh Tempo */}
        <div className="flex flex-col gap-3 p-5 rounded-2xl border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950/30 text-danger-800 dark:text-danger-300">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-danger-100 dark:bg-danger-900/50">
              <Clock size={16} className="text-danger-600" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
              Jatuh Tempo
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16 rounded-lg" />
          ) : (
            <span className="text-2xl font-bold">{totalOverdue}</span>
          )}
          <span className="text-xs opacity-60">order sudah lewat</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-2 items-center">
        <SearchInput
          value={search}
          placeholder="Cari nomor order atau nama pelanggan..."
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onClear={() => {
            setSearch("");
            setPage(1);
          }}
          className="w-full"
        />
        <FilterLanjutan
          activeCount={activeFilterCount}
          onReset={() => {
            setStatusFilter("all");
            setSearch("");
            setPage(1);
          }}
        >
          <FilterSection label="Status Pembayaran">
            <FilterButtonGroup
              options={statusOptions}
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v as StatusFilter);
                setPage(1);
              }}
            />
          </FilterSection>
        </FilterLanjutan>
      </div>

      {/* Warning strip for overdue */}
      {!isLoading && totalOverdue > 0 && (
        <div className="flex items-center gap-3 bg-danger-50 border border-danger-200 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-danger shrink-0" />
          <span className="text-sm text-danger-700 font-medium">
            {totalOverdue} order sudah melewati jatuh tempo — segera tindak
            lanjuti!
          </span>
        </div>
      )}

      <div className="flex gap-2 items-center">
        <span className="text-xs text-default-400 tabular-nums">
          Menampilkan {results.length} dari {data?.pagination?.total} data
        </span>
        <Divider className="flex-1" />
      </div>

      {/* Table */}
      <Table
        aria-label="Laporan Piutang"
        isHeaderSticky
        classNames={{
          base: "max-h-[600px]",
          wrapper: "flex-1 overflow-auto border border-default-200 shadow-none",
          th: "bg-default-50 text-default-500",
        }}
        bottomContent={
          (data?.pagination?.totalPages ?? 0) > 1 ? (
            <div className="flex w-full justify-center mt-2">
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={page}
                total={data!.pagination.totalPages}
                onChange={setPage}
              />
            </div>
          ) : null
        }
      >
        <TableHeader>
          <TableColumn>NO. ORDER</TableColumn>
          <TableColumn>PELANGGAN</TableColumn>
          <TableColumn>TOTAL TAGIHAN</TableColumn>
          <TableColumn>SUDAH DIBAYAR</TableColumn>
          <TableColumn>SISA TAGIHAN</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>JATUH TEMPO</TableColumn>
          <TableColumn>AKSI</TableColumn>
        </TableHeader>
        <TableBody
          items={results}
          isLoading={isLoading}
          emptyContent={
            isLoading
              ? " "
              : "Tidak ada piutang beredar. Semua pesanan sudah lunas! 🎉"
          }
          loadingContent={
            <div className="w-full">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-4 py-3 border-b border-default-100"
                >
                  <Skeleton className="h-4 w-28 rounded-md shrink-0" />
                  <div className="flex items-center gap-2 flex-1">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <Skeleton className="h-4 w-32 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-24 rounded-md shrink-0" />
                  <Skeleton className="h-4 w-20 rounded-md shrink-0" />
                  <Skeleton className="h-4 w-24 rounded-md shrink-0" />
                  <Skeleton className="h-6 w-20 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-20 rounded-md shrink-0" />
                  <Skeleton className="h-8 w-28 rounded-lg shrink-0" />
                </div>
              ))}
            </div>
          }
        >
          {(item) => {
            const isOverdue = item.deadline
              ? new Date(item.deadline) < today
              : false;

            return (
              <TableRow
                key={item.id}
                className="hover:bg-default-50 transition-colors"
              >
                {/* No. Order — link ke detail */}
                <TableCell>
                  <Tooltip content="Buka detail order" placement="top">
                    <a
                      href={`/order/${item.id}`}
                      className="inline-flex items-center gap-1 text-sm font-mono font-medium text-primary hover:underline"
                    >
                      {item.nomorOrder}
                      <ExternalLink size={12} className="opacity-60" />
                    </a>
                  </Tooltip>
                </TableCell>

                {/* Pelanggan */}
                <TableCell>
                  <User
                    name={item.customer.nama}
                    description={item.customer.nomorHp}
                    avatarProps={{
                      src: item.customer.image ?? undefined,
                      size: "sm",
                      showFallback: true,
                      name: item.customer.nama,
                    }}
                  />
                </TableCell>

                {/* Total Tagihan */}
                <TableCell>
                  <span className="text-sm tabular-nums font-medium">
                    {formatRupiah(item.grandTotal)}
                  </span>
                </TableCell>

                {/* Sudah Dibayar */}
                <TableCell>
                  <span className="text-sm tabular-nums text-success font-medium">
                    {formatRupiah(item.sudahDibayar)}
                  </span>
                </TableCell>

                {/* Sisa Tagihan */}
                <TableCell>
                  <span className="text-sm tabular-nums font-bold text-danger">
                    {formatRupiah(item.sisaTagihan)}
                  </span>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Chip
                    size="sm"
                    color={
                      item.statusPembayaran === "DP" ? "warning" : "danger"
                    }
                    variant="flat"
                  >
                    {item.statusPembayaran === "DP" ? "DP" : "Belum Bayar"}
                  </Chip>
                </TableCell>

                {/* Jatuh Tempo */}
                <TableCell>
                  {item.deadline ? (
                    <Tooltip
                      content={
                        isOverdue
                          ? "Jatuh tempo sudah lewat!"
                          : "Belum jatuh tempo"
                      }
                      color={isOverdue ? "danger" : "default"}
                    >
                      <span
                        className={`text-sm font-medium ${
                          isOverdue
                            ? "text-danger font-semibold"
                            : "text-default-600"
                        }`}
                      >
                        {isOverdue && "⚠ "}
                        {formatDate(item.deadline)}
                      </span>
                    </Tooltip>
                  ) : (
                    <span className="text-xs text-default-400">—</span>
                  )}
                </TableCell>

                {/* Aksi */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      startContent={<CreditCard size={13} />}
                      onPress={() => setPaymentTarget(item)}
                    >
                      Bayar
                    </Button>
                    <Tooltip content="Kirim pengingat via WhatsApp">
                      <Button
                        size="sm"
                        color="success"
                        variant="flat"
                        isIconOnly
                        as="a"
                        href={buildWALink(
                          item.nomorOrder,
                          item.customer,
                          item.sisaTagihan,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle size={14} />
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            );
          }}
        </TableBody>
      </Table>

      {/* Input Payment Modal */}
      <InputPaymentModal
        isOpen={!!paymentTarget}
        item={paymentTarget}
        onClose={() => setPaymentTarget(null)}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
