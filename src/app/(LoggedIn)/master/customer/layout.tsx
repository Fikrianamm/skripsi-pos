import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Pelanggan - POS System",
  description: "Kelola informasi dan riwayat pelanggan.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
