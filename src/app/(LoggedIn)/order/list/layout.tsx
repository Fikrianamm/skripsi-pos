import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar Pesanan - POS System",
  description: "Pantau status produksi dan pembayaran pesanan.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
