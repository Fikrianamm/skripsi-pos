/* eslint-disable @typescript-eslint/no-explicit-any */
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

interface TabunganTableProps {
  tabungans: any[];
  isLoading: boolean;
}

const BULAN_MAP: Record<number, string> = {
  1: "Januari", 2: "Februari", 3: "Maret", 4: "April",
  5: "Mei", 6: "Juni", 7: "Juli", 8: "Agustus",
  9: "September", 10: "Oktober", 11: "November", 12: "Desember"
};

export function TabunganTable({ tabungans, isLoading }: TabunganTableProps) {
  return (
    <Table
      aria-label="Tabel Riwayat Tabungan"
      isHeaderSticky
      classNames={{
        base: "max-h-[600px] overflow-scroll",
        wrapper: "border border-default-200 shadow-none",
      }}
    >
      <TableHeader>
        <TableColumn>PERIODE ALOKASI</TableColumn>
        <TableColumn>KATEGORI TUJUAN</TableColumn>
        <TableColumn>KETERANGAN TRANSAKSI</TableColumn>
        <TableColumn>NILAI ALOKASI (Rp)</TableColumn>
        <TableColumn>PENCATAT</TableColumn>
      </TableHeader>
      <TableBody
        items={tabungans}
        isLoading={isLoading}
        emptyContent={isLoading ? "Memuat riwayat tabungan..." : "Belum ada alokasi tabungan tercatat."}
      >
        {(item: any) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-primary-600">
                  {BULAN_MAP[item.bulan]} {item.tahun}
                </span>
                <span className="text-[10px] text-default-400">
                  {new Date(item.createdAt).toLocaleDateString("id-ID")}
                </span>
              </div>
            </TableCell>

            <TableCell>
              <Chip size="sm" variant="flat" color="warning" className="font-medium">
                {item.jenisTabungan.nama}
              </Chip>
            </TableCell>

            <TableCell>
              <span className="text-sm text-default-600 truncate max-w-xs block" title={item.keterangan || "-"}>
                {item.keterangan || "-"}
              </span>
            </TableCell>

            <TableCell>
              <span className="font-bold tracking-tight text-success-600">
                + {formatRupiah(Number(item.nominal))}
              </span>
            </TableCell>

            <TableCell>
              <User
                name={item.user?.name ?? "Admin"}
                classNames={{ name: "text-sm", description: "text-xs" }}
              />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
