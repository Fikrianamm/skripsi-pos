import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Finance - POS System",
  description: "Dashboard keuangan.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
