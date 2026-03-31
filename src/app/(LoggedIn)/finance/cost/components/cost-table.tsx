import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  User,
} from "@heroui/react";
import { formatRupiah } from "@/lib/func";

export interface CostData {
  id: string;
  nama: string;
  nominal: number | string;
  keterangan: string | null;
  tanggal: string | Date;
  costCategory: {
    nama: string;
    jenisBeban: string;
  };
  user: {
    name: string | null;
  } | null;
}

interface CostTableProps {
  costs: CostData[];
  isLoading: boolean;
}

export function CostTable({ costs, isLoading }: CostTableProps) {
  return (
    <Table
      aria-label="Tabel Pengeluaran"
      isHeaderSticky
      classNames={{
        base: "max-h-[600px] overflow-scroll",
        wrapper: "border border-default-200 shadow-none",
      }}
    >
      <TableHeader>
        <TableColumn>TANGGAL</TableColumn>
        <TableColumn>KATEGORI BEBAN</TableColumn>
        <TableColumn>KETERANGAN & NAMA</TableColumn>
        <TableColumn>NOMINAL</TableColumn>
        <TableColumn>DIBAYAR OLEH</TableColumn>
      </TableHeader>
      <TableBody
        items={costs}
        isLoading={isLoading}
        emptyContent={isLoading ? "Memuat data..." : "Belum ada riwayat pengeluaran."}
      >
        {(item) => (
          <TableRow key={item.id}>
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
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{item.costCategory.nama}</span>
                <Chip size="sm" variant="flat" color="warning" className="mt-1 max-w-max px-2">
                  {item.costCategory.jenisBeban}
                </Chip>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{item.nama}</span>
                {item.keterangan && (
                  <span className="text-xs text-default-500 max-w-xs truncate" title={item.keterangan}>
                    {item.keterangan}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm font-bold text-danger">
                - {formatRupiah(Number(item.nominal))}
              </span>
            </TableCell>
            <TableCell>
              <User
                name={item.user?.name ?? "Sistem"}
                classNames={{ name: "text-sm", description: "text-xs" }}
              />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
