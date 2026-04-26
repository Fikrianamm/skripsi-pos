import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Antrian Desain - POS System",
  description: "Antrian desain untuk produksi.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
