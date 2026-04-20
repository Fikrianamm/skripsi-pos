import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pengaturan",
  description: "Pengaturan",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}