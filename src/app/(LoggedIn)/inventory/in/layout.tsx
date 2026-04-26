import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Barang Masuk - POS System",
  description: "Kelola penerimaan barang.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
