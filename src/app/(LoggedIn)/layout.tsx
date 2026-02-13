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
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchFeature from "@/components/search-feature";

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

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sticky top-0 bg-white/20 backdrop-blur-lg border-b">
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
              <Button size="icon" variant={"ghost"}>
                <Bell />
              </Button>
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
