import {
  LayoutDashboard,
  Factory,
  Warehouse,
  Database,
  FileText,
  Shield,
  Settings,
  ShoppingBag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { RoleKey } from "@/config/roles";

export type NavSubItem = {
  title: string;
  url: string;
  roles?: RoleKey[];
};

export type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  roles?: RoleKey[];
  items?: NavSubItem[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_ITEMS: NavGroup[] = [
  {
    label: "Menu Utama",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        // semua role bisa akses
      },
      {
        title: "Pesanan",
        url: "#",
        icon: ShoppingBag,
        roles: ["admin", "kasir"],
        items: [
          {
            title: "Input Pesanan",
            url: "/order/pos",
          },
          {
            title: "Daftar Pesanan",
            url: "/order/list",
          },
        ],
      },
      {
        title: "Manajemen Produksi",
        url: "#",
        icon: Factory,
        roles: ["admin", "designer", "produksi"],
        items: [
          {
            title: "Antrian Desain",
            url: "/production/design-queue",
            roles: ["admin", "designer"],
          },
          {
            title: "Antrian Produksi (SPK)",
            url: "/production/spk",
            roles: ["admin", "produksi"],
          },
          {
            title: "Bank Desain",
            url: "/production/design-archive",
            roles: ["admin", "designer", "produksi", "kasir"],
          },
        ],
      },
      {
        title: "Inventori",
        url: "#",
        icon: Warehouse,
        roles: ["admin", "gudang"],
        items: [
          {
            title: "Stok Bahan Baku",
            url: "/inventory/stock",
          },
          {
            title: "Barang Masuk",
            url: "/inventory/in",
          },
          {
            title: "Stok Opname",
            url: "/inventory/opname",
          },
        ],
      },

      {
        title: "Laporan",
        url: "#",
        icon: FileText,
        roles: ["admin"],
        items: [
          {
            title: "Laporan Penjualan",
            url: "/reports/sales",
          },
          {
            title: "Laporan Produksi",
            url: "/reports/production",
          },
        ],
      },
    ],
  },
  {
    label: "Lainnya",
    items: [
      {
        title: "Master Data",
        url: "#",
        icon: Database,
        roles: ["admin", "kasir", "gudang"],
        items: [
          {
            title: "Produk & Jasa",
            url: "/master/product",
            roles: ["admin", "kasir"],
          },
          {
            title: "Data Pelanggan",
            url: "/master/customer",
            roles: ["admin", "kasir"],
          },
          {
            title: "Data Supplier",
            url: "/master/supplier",
            roles: ["admin", "gudang"],
          },
          {
            title: "Data Karyawan",
            url: "/master/karyawan",
            roles: ["admin"],
          },
          {
            title: "Manajemen Pengguna",
            url: "/master/user",
            roles: ["admin"],
          },
        ],
      },
      {
        title: "RBAC",
        url: "#",
        icon: Shield,
        roles: ["admin"],
        items: [
          {
            title: "Roles",
            url: "/rbac/roles",
          },
          {
            title: "Permissions",
            url: "/rbac/permissions",
          },
        ],
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
        // semua role bisa akses
      },
    ],
  },
];
