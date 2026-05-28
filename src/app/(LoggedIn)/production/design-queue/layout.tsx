import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Antrean Desain - POS System",
  description: "Antrean desain untuk produksi.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
