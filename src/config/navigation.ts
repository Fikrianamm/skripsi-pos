import {
  LayoutDashboard,
  Factory,
  Warehouse,
  Database,
  FileText,
  Shield,
  Settings,
  ShoppingBag,
  TrendingUp,
  Trash2,
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
        roles: ["admin", "kasir", "designer", "produksi", "gudang"],
        items: [
          {
            title: "Input Pesanan",
            url: "/order/pos",
            roles: ["admin", "kasir"],
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
        roles: ["admin", "designer", "produksi", "kasir"],
        items: [
          {
            title: "Antrean Desain",
            url: "/production/design-queue",
            roles: ["admin", "designer", "kasir", "produksi"],
          },
          {
            title: "Antrean Produksi (SPK)",
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
        title: "Inventori Bahan Baku",
        url: "#",
        icon: Warehouse,
        roles: ["admin", "gudang"],
        items: [
          {
            title: "Stok",
            url: "/inventory/stock",
          },
          {
            title: "Barang Masuk",
            url: "/inventory/in",
          },
          {
            title: "Barang Keluar",
            url: "/inventory/out",
          }
        ],
      },
    ],
  },
  {
    label: "Keuangan",
    items: [
      {
        title: "Keuangan",
        url: "#",
        icon: TrendingUp,
        roles: ["admin", "kasir"],
        items: [
          {
            title: "Dashboard Keuangan",
            url: "/finance/dashboard",
            roles: ["admin"],
          },
          {
            title: "Jurnal Umum",
            url: "/finance/jurnal",
          },
          {
            title: "Akun",
            url: "/finance/akun",
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
            title: "Laporan Laba Rugi",
            url: "/reports/laba-rugi",
          },
          {
            title: "Laporan Neraca",
            url: "/reports/neraca",
          },
          {
            title: "Laporan Tabungan",
            url: "/reports/tabungan",
          },
          {
            title: "Laporan Pengeluaran",
            url: "/reports/cost",
          },
          {
            title: "Laporan Piutang",
            url: "/reports/piutang",
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
            roles: ["admin", "kasir", "gudang"],
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
        title: "Role & Permission",
        url: "/rbac",
        icon: Shield,
        roles: ["admin"],
      },
      {
        title: "Sampah",
        url: "/trash",
        icon: Trash2,
        roles: ["admin"],
      },
      {
        title: "Pengaturan",
        url: "/settings",
        icon: Settings,
      },
    ],
  },
];
