import { prisma } from "@/lib/prisma";
import LoginClient from "./login-client";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.appSetting.findUnique({ where: { id: 1 } });
  const companyName = settings?.namaPerusahaan || "CV. Haqi Koleksi";
  
  return {
    title: `Masuk | ${companyName}`,
    description: `Halaman masuk sistem POS & Produksi ${companyName}`,
  };
}

export default async function Page() {
  const settings = await prisma.appSetting.findUnique({ where: { id: 1 } });

  return <LoginClient settings={settings} />;
}
