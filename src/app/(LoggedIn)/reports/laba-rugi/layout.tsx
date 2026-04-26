import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Laba Rugi - POS System",
  description: "Laporan laba rugi perusahaan.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
