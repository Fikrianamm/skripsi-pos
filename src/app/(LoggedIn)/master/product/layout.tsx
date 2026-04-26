import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Produk - POS System",
  description: "Kelola informasi produk.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
