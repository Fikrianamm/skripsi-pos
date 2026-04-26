import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jurnal Umum - POS System",
  description: "Kelola jurnal umum.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
