import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NavUserSimple } from "@/components/nav-user";
import { NotificationBell } from "@/components/notification-bell";
import SearchFeature from "@/components/search-feature";
import { LowStockBanner } from "@/components/low-stock-banner";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";

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

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Jika tidak ada session, redirect ke route handler yang akan clear cookie
  // lalu redirect ke halaman login (cookie tidak bisa dihapus di Server Component)
  if (!session) {
    redirect("/api/auth/clear-session");
  }

  // Fetch system settings
  const settings = await prisma.appSetting.findUnique({ where: { id: 1 } });

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} settings={settings} />
      <SidebarInset>
        <LowStockBanner userId={session.user.id} />
        <header className="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sticky top-0 bg-white/20 backdrop-blur-lg border-b z-50">
          <div className="flex justify-between w-full">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <SearchFeature />
            </div>
            <div className="flex items-center gap-2 px-4">
              <NotificationBell userId={session.user.id} />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <NavUserSimple user={session.user} />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
