import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Barang Keluar - POS System",
  description: "Kelola barang yang keluar.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
