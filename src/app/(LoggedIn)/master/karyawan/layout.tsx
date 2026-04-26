import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Karyawan - POS System",
  description: "Kelola informasi karyawan.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
