// Types
export interface CartItem {
  productId: string;
  nama: string;
  harga: number;
  qty: number;
  unit: string;
}

export type OrderChannel =
  | "LANGSUNG"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "MARKETPLACE"
  | "WEBSITE"
  | "LAINNYA";

export type StatusPembayaran = "BELUM_BAYAR" | "DP" | "LUNAS";
export type MetodePembayaran =
  | "TUNAI"
  | "TRANSFER"
  | "QRIS"
  | "KREDIT"
  | "LAINNYA";

// Constants
export const CHANNELS: { key: OrderChannel; label: string }[] = [
  { key: "LANGSUNG", label: "Langsung (Offline)" },
  { key: "WHATSAPP", label: "WhatsApp" },
  { key: "INSTAGRAM", label: "Instagram" },
  { key: "MARKETPLACE", label: "Marketplace" },
  { key: "WEBSITE", label: "Website" },
  { key: "LAINNYA", label: "Lainnya" },
];

export const PAYMENT_STATUS: {
  key: StatusPembayaran;
  label: string;
  color: "default" | "warning" | "success";
}[] = [
  { key: "BELUM_BAYAR", label: "Belum Bayar", color: "default" },
  { key: "DP", label: "DP (Uang Muka)", color: "warning" },
  { key: "LUNAS", label: "Lunas", color: "success" },
];

export const PAYMENT_METHODS: { key: MetodePembayaran; label: string }[] = [
  { key: "TUNAI", label: "Tunai" },
  { key: "TRANSFER", label: "Transfer Bank" },
  { key: "QRIS", label: "QRIS" },
  { key: "KREDIT", label: "Kredit / Tempo" },
  { key: "LAINNYA", label: "Lainnya" },
];
