import { Product, StockStatus } from "@/types/types";

export const normalizeName = (name: string) => {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-zA-Z\s'-]/g, "")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const VALID_DOMAINS = () => {
  const domains = ["gmail.com", "yahoo.com", "outlook.com"];

  if (process.env.NODE_ENV === "development") {
    domains.push("example.com");
  }

  return domains;
};

export const getInitialName = (name: string) => {
  const words = name.split(" ");
  return words.map((word) => word.charAt(0).toUpperCase()).join("");
};

export const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const getStockStatus = (product: Product): StockStatus => {
  const stok = Number(product.stok ?? 0);
  const minStok = Number(product.minStok ?? 0);
  if (stok <= 0) return { label: "Habis", color: "danger" };
  if (stok <= minStok) return { label: "Menipis", color: "warning" };
  return { label: "Aman", color: "success" };
};

export const formatRupiah = (value: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/** Convert @internationalized/date DateValue to YYYY-MM-DD string */
export const toISO = (
  d?: { year: number; month: number; day: number } | null,
): string =>
  d
    ? `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`
    : "";

/** Format a date/string to Indonesian locale medium date */
export const formatDate = (d: string | Date) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(d));

/** Parse ribuan-formatted string (e.g. "1.500.000") to number */
export const parseRibuan = (formatted: string): number =>
  Number(formatted.replace(/\./g, "").replace(/,/g, "")) || 0;
