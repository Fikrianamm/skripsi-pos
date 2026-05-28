// Shared types and constants for all order-related pages

export interface OrderRow {
  id: string;
  nomorOrder: string;
  channel: string;
  statusProduksi: string;
  statusPembayaran: string;
  metodePembayaran: string;
  deadline: string | null;
  subtotal: string;
  diskon: string;
  ongkir: string | null;
  grandTotal: string;
  createdAt: string;
  customer: { id: string; nama: string; nomorHp: string; image: string | null };
  _count: { items: number; designFiles: number };
  spk: { id: string } | null;
  items: { nama: string; qty: number }[];
}

export type StatusProduksiKey =
  | "PENDING"
  | "DESAIN"
  | "PRODUKSI"
  | "PACKING"
  | "SELESAI"
  | "BATAL";

export type StatusPembayaranKey = "BELUM_BAYAR" | "DP" | "LUNAS";
export type OrderChannelKey =
  | "LANGSUNG"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "MARKETPLACE"
  | "WEBSITE"
  | "LAINNYA";

export const STATUS_PRODUKSI_OPTIONS: {
  key: StatusProduksiKey | "";
  label: string;
}[] = [
  { key: "", label: "Semua Status Produksi" },
  { key: "PENDING", label: "Pending" },
  { key: "DESAIN", label: "Desain" },
  { key: "PRODUKSI", label: "Produksi" },
  { key: "PACKING", label: "Packing" },
  { key: "SELESAI", label: "Selesai" },
  { key: "BATAL", label: "Batal" },
];

export const STATUS_PRODUKSI_STEPS: {
  key: StatusProduksiKey;
  label: string;
}[] = [
  { key: "PENDING", label: "Pending" },
  { key: "DESAIN", label: "Desain" },
  { key: "PRODUKSI", label: "Produksi" },
  { key: "PACKING", label: "Packing" },
  { key: "SELESAI", label: "Selesai" },
  { key: "BATAL", label: "Batal" },
];

export const STATUS_BAYAR_OPTIONS: {
  key: StatusPembayaranKey | "";
  label: string;
}[] = [
  { key: "", label: "Semua Status Bayar" },
  { key: "BELUM_BAYAR", label: "Belum Bayar" },
  { key: "DP", label: "DP" },
  { key: "LUNAS", label: "Lunas" },
];
