import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Permissions - POS System",
  description: "Permissions system.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
