import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Piutang - POS System",
  description: "Laporan piutang perusahaan.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
