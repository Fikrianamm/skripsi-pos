"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher-client";
import { toast } from "sonner";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

interface UnreadCommentsBadgeProps {
  userRole: string;
}

export function UnreadCommentsBadge({ userRole }: UnreadCommentsBadgeProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial unread count
  useEffect(() => {
    fetch("/api/comments/unread")
      .then((res) => res.json())
      .then((data) => {
        if (data?.count !== undefined) {
          setUnreadCount(data.count);
        }
      })
      .catch(console.error);
  }, []);



  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe("global-comments");

    channel.bind("new-comment", (data: { commentId: string; orderId: string; senderId: string; senderName: string; text: string }) => {
      // Increment unread count, as there's a new comment
      setUnreadCount((prev) => prev + 1);

      // Show toast
      toast.info(`Pesan Baru dari ${data.senderName}`, {
        description: data.text,
        action: {
          label: "Lihat",
          onClick: () => router.push("/production/design-queue"),
        },
      });
    });

    return () => {
      channel.unbind("new-comment");
      pusher.unsubscribe("global-comments");
    };
  }, [router]);

  // Conditions to show/hide
  const allowedRoles = ["admin", "kasir", "designer"];
  if (!allowedRoles.includes(userRole)) return null;

  return (
    <SidebarMenu hidden={unreadCount === 0}>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => router.push("/production/design-queue")}
          className="relative hover:bg-slate-200 text-slate-600"
          tooltip="Notifikasi Antrean"
        >
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">Notifikasi Antrean</span>
          {unreadCount > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-medium text-white group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:right-0.5 group-data-[collapsible=icon]:top-0.5 group-data-[collapsible=icon]:h-3.5 group-data-[collapsible=icon]:min-w-3.5 group-data-[collapsible=icon]:px-0.5 group-data-[collapsible=icon]:text-[8px] group-data-[collapsible=icon]:ml-0">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
