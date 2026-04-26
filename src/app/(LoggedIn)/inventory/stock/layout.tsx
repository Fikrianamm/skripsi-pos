import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stok Bahan Baku - POS System",
  description: "Kelola stok bahan baku.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
