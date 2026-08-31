export interface SPKDetail {
  id: string;
  orderId: string;
  karyawanId: string;
  tahapProduksi: string;
  model: string | null;
  tali: string | null;
  ukuran: string | null;
  jumlah: number;
  catatan: string | null;
  tanggalSetor: string | null;
  accCetak: boolean;
  accCetakAt: string | null;
  accCetakOleh: string | null;
  statusSPK: string;
  createdAt: string;
  karyawan: { id: string; nama: string; posisi: string | null };
}

// Types for order detail page

export interface OrderDetail {
  id: string;
  nomorOrder: string;
  channel: string;
  statusProduksi: string;
  statusPembayaran: string;
  metodePembayaran: string;
  deadline: string | null;
  catatan: string | null;
  subtotal: string;
  diskon: string;
  ongkir: string | null;
  grandTotal: string;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; nama: string; nomorHp: string; image: string | null };
  items: OrderItem[];
  designFiles: DesignFile[];
  payments: Payment[];
  spk: SPKDetail | null;
}

export interface Payment {
  id: string;
  nominal: string;
  metodePembayaran: string;
  tanggal: string;
  user?: { name: string };
}

export interface KebutuhanBahanCustomItem {
  id: string;
  bahanBakuId: string;
  jumlahDibutuhkan: string | number;
  satuan: string;
  createdAt: string;
  bahanBaku?: {
    id: string;
    nama: string;
    stok: string | number;
    unit?: { nama: string };
  };
  dicatatOleh?: { id: string; name: string };
}

export interface OrderItem {
  id: string;
  productId: string;
  nama: string;
  harga: string;
  qty: number;
  subtotal: string;
  statusHarga?: "NA" | "MENUNGGU_DESAIN" | "MENUNGGU_NEGOSIASI" | "DISEPAKATI";
  product: { id: string; sku: string; nama: string; isService?: boolean } | null;
  kebutuhanBahanCustom?: KebutuhanBahanCustomItem[];
}

export interface DesignFile {
  id: string;
  nama: string;
  filePath: string;
  createdAt: string;
  uploadedBy: { id: string; name: string } | null;
}

export function formatMetodePembayaran(m: string): string {
  const map: Record<string, string> = {
    CASH: "Cash",
    TRANSFER: "Transfer",
    QRIS: "QRIS",
    KREDIT: "Kredit",
    LAINNYA: "Lainnya",
  };
  return map[m] ?? m;
}
