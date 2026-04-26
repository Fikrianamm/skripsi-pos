import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Akun - POS System",
  description: "Kelola Akun.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
