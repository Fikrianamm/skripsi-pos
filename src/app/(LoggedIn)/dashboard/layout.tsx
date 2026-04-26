import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - POS System",
  description: "Ringkasan bisnis dan statistik harian.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
