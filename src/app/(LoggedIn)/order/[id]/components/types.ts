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
}

export interface OrderItem {
  id: string;
  productId: string;
  nama: string;
  harga: string;
  qty: number;
  subtotal: string;
  catatan: string | null;
  product: { id: string; sku: string; nama: string } | null;
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
