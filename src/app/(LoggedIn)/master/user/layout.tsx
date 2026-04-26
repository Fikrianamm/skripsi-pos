import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kelola Pengguna - POS System",
  description: "Kelola informasi pengguna.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
