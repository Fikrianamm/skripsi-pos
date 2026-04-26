import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifikasi - POS System",
  description: "Notifikasi yang diterima.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
