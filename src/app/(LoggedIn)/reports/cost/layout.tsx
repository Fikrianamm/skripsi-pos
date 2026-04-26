import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Biaya - POS System",
  description: "Laporan biaya yang dikeluarkan perusahaan.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
