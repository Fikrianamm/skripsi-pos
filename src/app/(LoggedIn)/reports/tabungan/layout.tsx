import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Tabungan - POS System",
  description: "Laporan tabungan perusahaan.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
