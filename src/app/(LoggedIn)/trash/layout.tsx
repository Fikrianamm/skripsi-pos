import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sampah - POS System",
  description: "Pulihkan data yang telah dihapus.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
