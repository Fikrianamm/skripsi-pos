"use client";

import { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LowStockItem {
  id: string;
  nama: string;
  stok: number;
  minStok: number;
  unit?: { nama: string };
  type: "produk" | "bahan";
}

export function LowStockBanner() {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkVisibility = async () => {
      // 1. Check localStorage for today's dismissal
      const today = new Date().toISOString().split("T")[0];
      const dismissedDate = localStorage.getItem("lowStockBannerDismissed");
      
      if (dismissedDate === today) {
        setIsVisible(false);
        return;
      }

      // 2. Fetch low stock items
      try {
        const res = await fetch("/api/admin/inventory/low-stock");
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setItems(data);
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch low stock items:", error);
      }
    };

    checkVisibility();
  }, []);

  const handleDismiss = () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem("lowStockBannerDismissed", today);
    setIsVisible(false);
  };

  if (!isVisible || items.length === 0) return null;

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
