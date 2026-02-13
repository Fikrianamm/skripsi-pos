"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

export function NavMain({
  items,
  groupLabel,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  groupLabel?: string;
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      {groupLabel && <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          // Jika item memiliki children, render sebagai collapsible
          if (item.items && item.items.length > 0) {
            // Check if any child item matches the current pathname
            const hasActiveChild = item.items.some(
              (subItem) => subItem.url === pathname
            );

            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={hasActiveChild}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger
                    className="hover:bg-slate-200 text-slate-600"
                    asChild
                  >
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => {
                        const isSubItemActive = subItem.url === pathname;
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              className="hover:bg-slate-200 text-slate-600"
                              isActive={isSubItemActive}
                              asChild
                            >
                              <a href={subItem.url}>
                                <span>{subItem.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          // Jika tidak ada children, render sebagai button biasa
          const isItemActive = item.url === pathname;
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                className={`hover:bg-slate-200 text-slate-600 data-[active=true]:bg-slate-200 data-[active=true]:font-normal`}
                isActive={isItemActive}
                asChild
                tooltip={item.title}
              >
                <a href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
