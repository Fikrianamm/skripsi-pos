/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { 
  Card, 
  CardBody, 
  Tabs, 
  Tab, 
  Button, 
  Chip,
  Divider,
} from "@heroui/react";
import { 
  Bell, 
  CheckCheck, 
  ShoppingBag, 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  Wallet, 
  Info,
  Clock,
  ExternalLink,
  Trash2
} from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function NotificationPage() {
  const { data: session } = authClient.useSession();
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
  } = useNotifications(session?.user.id);
  const [selectedTab, setSelectedTab] = useState("all");

  const filteredNotifications = notifications.filter((n) => {
    if (selectedTab === "all") return true;
    if (selectedTab === "unread") return !n.isRead;
    return n.jenis === selectedTab;
  });

  const getIcon = (jenis: string) => {
    switch (jenis) {
      case "ORDER_BARU":
        return <ShoppingBag className="text-primary size-5" />;
      case "STATUS_ORDER_UBAH":
        return <CheckCircle2 className="text-success size-5" />;
      case "STOK_MENIPIS":
      case "DEADLINE_DEKAT":
        return <AlertTriangle className="text-warning size-5" />;
      case "PENERIMAAN_BARU":
        return <Package className="text-secondary size-5" />;
      case "PAYMENT_MASUK":
      case "BIAYA_DICATAT":
        return <Wallet className="text-success size-5" />;
      default:
        return <Info className="text-default-400 size-5" />;
    }
  };

  const getLabel = (jenis: string) => {
    return jenis.replace(/_/g, " ");
  };

  const getColor = (jenis: string) => {
    switch (jenis) {
      case "ORDER_BARU": return "primary";
      case "STATUS_ORDER_UBAH": return "success";
      case "STOK_MENIPIS":
      case "DEADLINE_DEKAT": return "warning";
      case "PENERIMAAN_BARU": return "secondary";
      case "PAYMENT_MASUK":
      case "BIAYA_DICATAT": return "success";
      default: return "default";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-2 md:p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary-50 p-2.5 rounded-2xl">
            <Bell className="text-primary size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifikasi</h1>
            <p className="text-sm text-slate-500 font-medium">Pusat pemberitahuan aktivitas sistem Anda</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="faded" 
            color="primary"
            size="sm"
            startContent={<CheckCheck size={16} />}
            onPress={() => markAllAsRead()}
            className="font-bold rounded-xl"
          >
            Tandai semua terbaca
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem]">
        <CardBody className="p-0">
          <div className="p-4 border-b border-default-100">
            <Tabs 
              variant="underlined" 
              color="primary" 
              selectedKey={selectedTab} 
              onSelectionChange={(key) => setSelectedTab(key.toString())}
              classNames={{
                tabList: "gap-6",
                cursor: "w-full bg-primary",
                tab: "max-w-fit px-0 h-10",
                tabContent: "group-data-[selected=true]:text-primary font-bold text-sm"
              }}
            >
              <Tab key="all" title="Semua" />
              <Tab key="unread" title="Belum Dibaca" />
              <Tab key="ORDER_BARU" title="Pesanan" />
              <Tab key="PAYMENT_MASUK" title="Keuangan" />
              <Tab key="STOK_MENIPIS" title="Stok" />
            </Tabs>
          </div>

          <div className="min-h-[400px]">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="size-16 bg-default-50 rounded-full flex items-center justify-center">
                  <Bell size={32} className="text-default-200" />
                </div>
                <div className="max-w-[200px]">
                  <p className="text-lg font-bold text-slate-900">Tidak ada notifikasi</p>
                  <p className="text-sm text-slate-500 mt-1">Kami akan memberi tahu Anda jika terjadi sesuatu yang baru.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredNotifications.map((notif, index) => (
                  <div key={notif.id} className="relative group">
                    <div 
                      className={`flex flex-col md:flex-row gap-4 p-5 transition-all relative ${
                        !notif.isRead ? "bg-primary-50/30" : "bg-transparent opacity-80"
                      }`}
                    >
                      {/* Read indicator */}
                      {!notif.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                      )}

                      <div className="flex items-start gap-4 flex-1">
                        <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                          !notif.isRead ? "bg-white border-primary-100" : "bg-default-50 border-default-200"
                        }`}>
                          {getIcon(notif.jenis)}
                        </div>
                        
                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`text-base leading-tight ${!notif.isRead ? "font-bold text-slate-900" : "text-slate-700 font-medium"}`}>
                              {notif.title}
                            </p>
                            <Chip 
                              size="sm" 
                              variant="flat" 
                              color={getColor(notif.jenis) as any}
                              className="text-[10px] font-bold uppercase h-5"
                            >
                              {getLabel(notif.jenis)}
                            </Chip>
                          </div>
                          
                          <p className={`text-sm leading-relaxed ${!notif.isRead ? "text-slate-600" : "text-slate-500 line-clamp-1"}`}>
                            {notif.message}
                          </p>

                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1 text-xs text-default-400 font-medium">
                              <Clock size={12} />
                              {format(new Date(notif.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                            </div>
                            
                            {notif.linkUrl && (
                              <Link 
                                href={notif.linkUrl}
                                onClick={() => markAsRead(notif.id)}
                                className="flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                              >
                                <ExternalLink size={12} />
                                Lihat Detail
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        {!notif.isRead && (
                          <Button 
                            size="sm" 
                            variant="light" 
                            onPress={() => markAsRead(notif.id)}
                            className="font-bold text-xs"
                          >
                            Tandai terbaca
                          </Button>
                        )}
                        <Button 
                          isIconOnly 
                          size="sm" 
                          variant="light" 
                          color="danger"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    {index < filteredNotifications.length - 1 && <Divider className="opacity-50" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
