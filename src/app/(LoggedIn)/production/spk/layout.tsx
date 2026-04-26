import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SPK Produksi - POS System",
  description: "SPK Produksi untuk produksi.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
