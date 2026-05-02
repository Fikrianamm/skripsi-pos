"use client";

import { useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/func";
import { getPusherClient } from "@/lib/pusher-client";

interface LowStockItem {
  id: string;
  nama: string;
  stok: number;
  minStok: number;
  unit?: { nama: string };
  type: "produk" | "bahan";
}

export function LowStockBanner({ userId }: { userId?: string }) {
  const { data: isDismissed } = useSWR("lowStockBannerDismissed", () => {
    const today = new Date().toISOString().split("T")[0];
    const dismissedDate = localStorage.getItem("lowStockBannerDismissed");
    return dismissedDate === today;
  }, { fallbackData: true, revalidateOnFocus: false });

  const { data: items = [], mutate } = useSWR<LowStockItem[]>(
    "/api/admin/inventory/low-stock",
    fetcher
  );

  useEffect(() => {
    if (!userId) return;

    const pusher = getPusherClient();
    const channelName = `private-user-${userId}`;
    const channel = pusher.subscribe(channelName);

    // Listen for notifications
    channel.bind("new-notification", (notif: { jenis: string }) => {
      // If the notification is about low stock or a transaction that might affect stock
      if (notif.jenis === "STOK_MENIPIS" || notif.jenis === "ORDER_BARU" || notif.jenis === "PENERIMAAN_BARU") {
        mutate(); // Re-fetch low stock data
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [userId, mutate]);

  const { mutate: mutateDismiss } = useSWRConfig();

  const handleDismiss = () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem("lowStockBannerDismissed", today);
    mutateDismiss("lowStockBannerDismissed", true, false);
  };

  const isVisible = !isDismissed && items.length > 0;

  if (!isVisible) return null;

  const produkCount = items.filter(i => i.type === "produk").length;
  const bahanCount = items.filter(i => i.type === "bahan").length;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between animate-in fade-in slide-in-from-top duration-500">
      <div className="flex items-center gap-2 overflow-hidden">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
        <div className="text-sm font-medium text-amber-800 truncate">
          <span className="font-bold">Peringatan Stok:</span>{" "}
          {produkCount > 0 && <span>{produkCount} produk</span>}
          {produkCount > 0 && bahanCount > 0 && <span> & </span>}
          {bahanCount > 0 && <span>{bahanCount} bahan baku</span>}
          {" menipis: "}
          <span className="text-xs opacity-80">
            {items.slice(0, 3).map(i => `${i.nama} (${i.stok} ${i.unit?.nama || "pcs"})`).join(", ")}
            {items.length > 3 ? " ..." : ""}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleDismiss}
          className="h-8 w-8 p-0 text-amber-800 hover:bg-amber-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Tutup</span>
        </Button>
      </div>
    </div>
  );
}
