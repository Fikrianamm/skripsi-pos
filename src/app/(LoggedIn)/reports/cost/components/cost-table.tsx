import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  User,
  Skeleton,
} from "@heroui/react";
import { formatRupiah } from "@/lib/func";
import { Landmark } from "lucide-react";

export interface CostData {
  id: string;
  nama: string;
  nominal: number | string;
  keterangan: string | null;
  tanggal: string | Date;
  akun: {
    namaAkun: string;
    kelompok: string;
  };
  user: {
    name: string | null;
    image?: string | null;
  } | null;
  jurnalUmum?: {
    akunKredit: {
      namaAkun: string;
      kelompok: string;
    };
  }[];
}

interface CostTableProps {
  costs: CostData[];
  isLoading: boolean;
}

const SKELETON_ROWS = 5;

export function CostTable({ costs, isLoading }: CostTableProps) {
  return (
    <Table
      aria-label="Tabel Pengeluaran"
      isHeaderSticky
      classNames={{
        base: "max-h-[600px]",
        wrapper: "border border-default-200 shadow-none",
      }}
    >
      <TableHeader>
        <TableColumn>TANGGAL</TableColumn>
        <TableColumn>KATEGORI BEBAN</TableColumn>
        <TableColumn>NAMA</TableColumn>
        <TableColumn>KETERANGAN</TableColumn>
        <TableColumn>NOMINAL</TableColumn>
        <TableColumn>SUMBER DANA</TableColumn>
        <TableColumn>DICATAT OLEH</TableColumn>
      </TableHeader>
      <TableBody
        items={isLoading ? [] : costs}
        isLoading={isLoading}
        emptyContent={
          isLoading ? " " : "Belum ada riwayat pengeluaran."
        }
        loadingContent={
          <div className="w-full">
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-3 border-b border-default-100"
              >
                {/* Tanggal */}
                <div className="flex flex-col gap-1 w-32 shrink-0">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
                {/* Kategori */}
                <div className="w-36 shrink-0">
                  <Skeleton className="h-6 w-32 rounded-full" />
                </div>
                {/* Nama */}
                <div className="w-36 shrink-0">
                  <Skeleton className="h-4 w-32 rounded-md" />
                </div>
                {/* Keterangan */}
                <div className="flex-1">
                  <Skeleton className="h-3 w-48 rounded-md" />
                </div>
                {/* Nominal */}
                <div className="w-28 shrink-0">
                  <Skeleton className="h-5 w-24 rounded-md" />
                </div>
                {/* Sumber Dana */}
                <div className="w-36 shrink-0">
                  <Skeleton className="h-6 w-32 rounded-full" />
                </div>
                {/* Dicatat Oleh */}
                <div className="flex items-center gap-2 w-36 shrink-0">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        {(item) => {
          const sumberDana = item.jurnalUmum?.[0]?.akunKredit?.namaAkun ?? null;

          return (
            <TableRow key={item.id}>
              {/* Tanggal */}
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {new Date(item.tanggal).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-xs text-default-400">
                    {new Date(item.tanggal).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </TableCell>

              {/* Kategori Beban */}
              <TableCell>
                <Chip
                  size="sm"
                  variant="flat"
                  color="warning"
                  className="mt-1 max-w-max px-2"
                >
                  {item.akun.namaAkun}
                </Chip>
              </TableCell>

              {/* Nama */}
              <TableCell>
                <span className="text-sm font-semibold">{item.nama}</span>
              </TableCell>

              {/* Keterangan */}
              <TableCell>
                {item.keterangan ? (
                  <span
                    className="text-sm text-default-500 max-w-xs truncate block"
                    title={item.keterangan}
                  >
                    {item.keterangan}
                  </span>
                ) : (
                  <span className="text-xs text-default-300">—</span>
                )}
              </TableCell>

              {/* Nominal */}
              <TableCell>
                <span className="text-sm font-bold text-danger">
                  - {formatRupiah(Number(item.nominal))}
                </span>
              </TableCell>

              {/* Sumber Dana */}
              <TableCell>
                {sumberDana ? (
                  <Chip
                    size="sm"
                    variant="flat"
                    color="primary"
                    startContent={<Landmark size={12} className="ml-1" />}
                    className="max-w-max px-2"
                  >
                    {sumberDana}
                  </Chip>
                ) : (
                  <span className="text-xs text-default-400">—</span>
                )}
              </TableCell>

              {/* Dicatat Oleh */}
              <TableCell>
                <User
                  name={item.user?.name ?? "Sistem"}
                  avatarProps={{
                    src: item.user?.image ?? undefined,
                    name: item.user?.name ?? "S",
                    size: "sm",
                    showFallback: true,
                  }}
                  classNames={{ name: "text-sm", description: "text-xs" }}
                />
              </TableCell>
            </TableRow>
          );
        }}
      </TableBody>
    </Table>
  );
}
