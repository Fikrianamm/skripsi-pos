"use client";
import * as React from "react";
import { CompanyHeader } from "@/components/company-header";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NAV_ITEMS } from "@/config/navigation";
import type { NavGroup, NavItem } from "@/config/navigation";
import { COMPANY } from "@/config/company";
import { User } from "better-auth";

/**
 * Filter navigation items based on the user's role.
 * - Items without `roles` are visible to everyone.
 * - Sub-items are also filtered; if a parent has no visible sub-items left, it's hidden.
 */
function filterNavByRole(groups: NavGroup[], role: string): NavGroup[] {
  return groups
    .map((group) => {
      const filteredItems = group.items
        .map((item): NavItem | null => {
          // If item has role restriction, check it
          if (item.roles && !item.roles.includes(role as never)) {
            return null;
          }

          // If item has sub-items, filter them too
          if (item.items) {
            const filteredSubItems = item.items.filter(
              (sub) => !sub.roles || sub.roles.includes(role as never),
            );
            // If all sub-items are filtered out, hide the parent
            if (filteredSubItems.length === 0) return null;
            return { ...item, items: filteredSubItems };
          }

          return item;
        })
        .filter((item): item is NavItem => item !== null);

      return { ...group, items: filteredItems };
    })
    .filter((group) => group.items.length > 0);
}

export function AppSidebar({
  user,
  ...props
}: { user: User } & React.ComponentProps<typeof Sidebar>) {
  const role = (user as User & { role?: string }).role ?? "kasir";
  const filteredNav = React.useMemo(
    () => filterNavByRole(NAV_ITEMS, role),
    [role],
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <CompanyHeader company={COMPANY} />
      </SidebarHeader>
      <SidebarContent>
        {filteredNav.map((group) => (
          <NavMain
            key={group.label}
            items={group.items}
            groupLabel={group.label}
          />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
