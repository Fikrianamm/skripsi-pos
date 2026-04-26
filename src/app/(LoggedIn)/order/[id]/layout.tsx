import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail Pesanan - POS System",
  description: "Detail pesanan dan status produksi serta pembayaran.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
