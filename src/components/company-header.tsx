"use client";

import * as React from "react";
import { GalleryVerticalEnd } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function CompanyHeader({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string | null;
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="cursor-default hover:bg-transparent"
        >
          <div className={`${logoUrl ? "bg-transparent" : "bg-sidebar-primary"} text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden`}>
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={name} 
                className="size-full object-cover" 
              />
            ) : (
              <GalleryVerticalEnd className="size-4" />
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{name}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
