"use client";

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Badge,
  Button,
  ScrollShadow,
} from "@heroui/react";
import {
  Bell,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  Package,
  Wallet,
  Info,
  Clock,
} from "lucide-react";
import { useNotifications, Notification } from "@/hooks/use-notifications";
import { formatRelative } from "date-fns";
import { id } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(userId, 10);
  const router = useRouter();

  const getIcon = (jenis: string) => {
    switch (jenis) {
      case "ORDER_BARU":
        return <ShoppingBag className="text-primary size-4" />;
      case "STATUS_ORDER_UBAH":
        return <CheckCircle2 className="text-success size-4" />;
      case "STOK_MENIPIS":
      case "DEADLINE_DEKAT":
        return <AlertTriangle className="text-warning size-4" />;
      case "PENERIMAAN_BARU":
        return <Package className="text-primary size-4" />;
      case "PAYMENT_MASUK":
      case "BIAYA_DICATAT":
        return <Wallet className="text-success size-4" />;
      default:
        return <Info className="text-default-400 size-4" />;
    }
  };

  const handleItemPress = (notif: Notification) => {
    markAsRead(notif.id);
    if (notif.linkUrl) {
      router.push(notif.linkUrl);
    }
  };

  return (
    <Dropdown
      placement="bottom-end"
      className="p-0 border shadow-2xl min-w-[320px]"
    >
      <Badge
        content={unreadCount}
        color="danger"
        shape="circle"
        isInvisible={unreadCount === 0}
        size="sm"
        className="text-[9px] font-bold h-4 min-w-4 p-0"
      >
        <DropdownTrigger>
          <Button
            isIconOnly
            variant="light"
            radius="full"
            className="text-default-500 data-[hover=true]:bg-default-100"
          >
            <Bell className="size-5" />
          </Button>
        </DropdownTrigger>
      </Badge>

      <DropdownMenu
        aria-label="Notifikasi"
        className="w-full p-0 overflow-hidden"
        itemClasses={{
          base: "px-4 py-3 gap-3 data-[hover=true]:bg-default-50 transition-colors",
        }}
        disabledKeys={["header"]}
      >
        <DropdownItem
          key="header"
          className="cursor-default opacity-100 py-3"
          isReadOnly
          closeOnSelect={false}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-2">
              <Bell className="text-primary size-4" />
              Notifikasi
            </span>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="light"
                color="primary"
                className="text-xs h-7 px-2 pointer-events-auto z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  markAllAsRead();
                }}
              >
                Tandai semua terbaca
              </Button>
            )}
              <Button
                size="sm"
                variant="light"
                color="primary"
                className="text-xs h-7 px-2 pointer-events-auto z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  markAllAsRead();
                }}
              >
                
              </Button>
          </div>
        </DropdownItem>

        {notifications.length === 0 ? (
          <DropdownItem
            key="empty"
            className="py-10 text-center opacity-100 cursor-default"
            isReadOnly
          >
            <div className="flex flex-col items-center gap-2 text-default-400">
              <Bell size={24} className="opacity-20" />
              <p className="text-xs">Belum ada notifikasi</p>
            </div>
          </DropdownItem>
        ) : (
          <DropdownItem key="list" className="p-0 scrollbar-hide" isReadOnly>
            <ScrollShadow className="max-h-[350px]">
              {notifications.slice(0, 5).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemPress(notif)}
                  className={`flex gap-3 px-4 py-4 cursor-pointer hover:bg-default-50 transition-colors ${
                    !notif.isRead ? "bg-primary-50/50" : ""
                  }`}
                >
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                      !notif.isRead
                        ? "bg-white shadow-sm border border-primary-100"
                        : "bg-default-100 opacity-60"
                    }`}
                  >
                    {getIcon(notif.jenis)}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <p
                      className={`text-sm leading-tight line-clamp-1 ${!notif.isRead ? "font-bold text-slate-900" : "text-slate-600"}`}
                    >
                      {notif.title}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-normal">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-default-400">
                      <Clock size={10} />
                      {formatRelative(new Date(notif.createdAt), new Date(), {
                        locale: id,
                      })}
                    </div>
                  </div>
                  {!notif.isRead && (
                    <div className="size-2 bg-primary rounded-full shrink-0 ml-auto mt-1.5" />
                  )}
                </div>
              ))}
            </ScrollShadow>
          </DropdownItem>
        )}
        <DropdownItem
          key="footer"
          className="text-center border-t border-default-100 opacity-100 rounded-t-none rounded-b-xl"
          onPress={() => router.push("/notifikasi")}
        >
          <span className="text-xs font-bold text-primary">
            Lihat Semua Notifikasi
          </span>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
