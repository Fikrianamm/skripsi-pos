import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Neraca - POS System",
  description: "Laporan neraca perusahaan.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
