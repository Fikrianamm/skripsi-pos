import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buat Pesanan - POS System",
  description: "Buat pesanan baru dengan cepat.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
