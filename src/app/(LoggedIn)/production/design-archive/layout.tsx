import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bank Desain - POS System",
  description: "Desain yang telah selesai diproduksi.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
