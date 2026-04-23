"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import { addToast } from "@heroui/toast";

export interface Notification {
  id: string;
  title: string;
  message: string;
  jenis: string;
  isRead: boolean;
  linkUrl: string | null;
  createdAt: string;
}

export function useNotifications(userId: string | undefined, limit: number = 50) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/notifications?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!userId) return;

    const pusher = getPusherClient();
    const channelName = `private-user-${userId}`;
    const channel = pusher.subscribe(channelName);

    // Bind to real-time events
    channel.bind("new-notification", (newNotif: Notification) => {
      setNotifications((prev) => [newNotif, ...prev]);
      addToast({
        title: newNotif.title,
        description: newNotif.message,
        color: "primary",
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [userId]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await fetch("/api/notifications", { method: "PATCH" });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteAllNotification = async () => {
    // Optimistic update
    setNotifications([]);

    try {
      await fetch("/api/notifications", { method: "DELETE" });
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteAllNotification,
    refresh: fetchNotifications,
  };
}
