import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stok Opname - POS System",
  description: "Kelola stok opname bahan baku.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
