import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roles - POS System",
  description: "Roles system.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
