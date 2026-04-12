// Shared badge helpers for order status — reusable across all order pages

type BadgeColor =
  | "default"
  | "primary"
  | "secondary"
  | "warning"
  | "success"
  | "danger";

export function getStatusProduksiBadge(status: string): {
  label: string;
  color: BadgeColor;
} {
  const map: Record<string, { label: string; color: BadgeColor }> = {
    PENDING: { label: "Pending", color: "default" },
    DESAIN: { label: "Desain", color: "secondary" },
    PRODUKSI: { label: "Produksi", color: "primary" },
    PACKING: { label: "Packing", color: "warning" },
    SELESAI: { label: "Selesai", color: "success" },
    BATAL: { label: "Batal", color: "danger" },
  };
  return map[status] ?? { label: status, color: "default" };
}

export function getStatusBayarBadge(status: string): {
  label: string;
  color: "default" | "warning" | "success" | "danger";
} {
  const map: Record<
    string,
    { label: string; color: "default" | "warning" | "success" | "danger" }
  > = {
    BELUM_BAYAR: { label: "Belum Bayar", color: "default" },
    DP: { label: "DP", color: "warning" },
    LUNAS: { label: "Lunas", color: "success" },
    REFUND: { label: "Refund", color: "danger" },
  };
  return map[status] ?? { label: status, color: "default" };
}

export function formatChannel(channel: string): string {
  const map: Record<string, string> = {
    LANGSUNG: "Langsung",
    WHATSAPP: "WhatsApp",
    INSTAGRAM: "Instagram",
    MARKETPLACE: "Marketplace",
    WEBSITE: "Website",
    LAINNYA: "Lainnya",
  };
  return map[channel] ?? channel;
}
