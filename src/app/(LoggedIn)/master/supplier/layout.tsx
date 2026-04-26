import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Suppier - POS System",
  description: "Kelola informasi supplier.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
