import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import NextTopLoader from "nextjs-toploader";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  let companyName = "CV. Haqi Koleksi";
  try {
    const settings = await prisma.appSetting.findUnique({ where: { id: 1 } });
    if (settings?.namaPerusahaan) {
      companyName = settings.namaPerusahaan;
    }
  } catch (error) {
    console.error("Failed to fetch settings for metadata:", error);
  }

  return {
    title: {
      template: `%s | ${companyName}`,
      default: `${companyName} - Dashboard POS & Produksi`,
    },
    description: `Sistem Manajemen POS & Produksi terintegrasi untuk ${companyName}`,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} antialiased`}
        suppressHydrationWarning
      >
        <NextTopLoader
          color="oklch(44.4% 0.011 73.639)"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={true}
          easing="ease"
          speed={200}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
