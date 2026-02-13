"use client";

import {
  ShieldUser,
  User,
  PencilRuler,
  Factory,
  Warehouse,
  Check,
} from "lucide-react";

/**
 * Role metadata — descriptions, icons, colors, and permissions per resource.
 */
const ROLE_DETAILS = [
  {
    key: "admin",
    label: "Administrator",
    description:
      "CEO / Manager Operasional. Pengawasan menyeluruh dan pengaturan parameter sistem.",
    icon: <ShieldUser className="size-5" />,
    color: {
      bg: "bg-red-50 dark:bg-red-950/40",
      border: "border-red-200 dark:border-red-800",
      badge: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400",
      iconBg: "bg-red-100 dark:bg-red-900/50",
      iconText: "text-red-600 dark:text-red-400",
    },
    permissions: {
      pos: ["create", "view"],
      customer: ["create", "view", "update"],
      payment: ["create", "view", "verify"],
      design: ["view", "upload", "update-status"],
      production: ["view", "update-status"],
      inventory: ["view", "create", "update"],
      report: ["view"],
      master: ["create", "view", "update", "delete"],
      user: ["create", "list", "set-role", "ban", "delete", "set-password"],
    },
  },
  {
    key: "kasir",
    label: "Admin CS / Kasir",
    description:
      "Melayani transaksi di depan (front office), menangani pembayaran, dan memberikan informasi status pesanan.",
    icon: <User className="size-5" />,
    color: {
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-200 dark:border-blue-800",
      badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      iconText: "text-blue-600 dark:text-blue-400",
    },
    permissions: {
      pos: ["create", "view"],
      customer: ["create", "view", "update"],
      payment: ["create", "view", "verify"],
      production: ["view"],
    },
  },
  {
    key: "designer",
    label: "Designer",
    description:
      "Mengelola aset visual pesanan — melihat antrian desain, mengunggah file, dan mengubah status desain.",
    icon: <PencilRuler className="size-5" />,
    color: {
      bg: "bg-purple-50 dark:bg-purple-950/40",
      border: "border-purple-200 dark:border-purple-800",
      badge:
        "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
      iconText: "text-purple-600 dark:text-purple-400",
    },
    permissions: {
      design: ["view", "upload", "update-status"],
    },
  },
  {
    key: "produksi",
    label: "Produksi",
    description:
      "SPV Produksi / Leader. Memantau pengerjaan fisik di lantai produksi dan update progres secara bertahap.",
    icon: <Factory className="size-5" />,
    color: {
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200 dark:border-amber-800",
      badge:
        "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
      iconText: "text-amber-600 dark:text-amber-400",
    },
    permissions: {
      production: ["view", "update-status"],
    },
  },
  {
    key: "gudang",
    label: "Gudang",
    description:
      "Mengelola bahan baku (kain, benang, tinta), mencatat pembelian dari supplier, dan memantau stok minimum.",
    icon: <Warehouse className="size-5" />,
    color: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-200 dark:border-emerald-800",
      badge:
        "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
      iconText: "text-emerald-600 dark:text-emerald-400",
    },
    permissions: {
      inventory: ["view", "create", "update"],
    },
  },
];

/** All resources — used for badge label lookup */
const ALL_RESOURCES: Record<string, string> = {
  pos: "POS",
  customer: "Pelanggan",
  payment: "Pembayaran",
  design: "Desain",
  production: "Produksi",
  inventory: "Inventori",
  report: "Laporan",
  master: "Master Data",
  user: "User Mgmt",
};

export default function RolesPage() {
  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Roles</h1>
        <p className="text-muted-foreground">Daftar role dan deskripsi tugas</p>
      </div>

      {/* Role Cards */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {ROLE_DETAILS.map((role) => (
          <div
            key={role.key}
            className={`rounded-xl border ${role.color.border} ${role.color.bg} p-5 flex flex-col gap-3 transition-shadow hover:shadow-md`}
          >
            {/* Card Header */}
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-lg ${role.color.iconBg} ${role.color.iconText}`}
              >
                {role.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base">{role.label}</h3>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                  {role.description}
                </p>
              </div>
            </div>

            {/* Permissions */}
            <div className="mt-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Hak Akses
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(role.permissions).map(([resource, actions]) => (
                  <span
                    key={resource}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${role.color.badge}`}
                    title={`${ALL_RESOURCES[resource] ?? resource}: ${actions.join(", ")}`}
                  >
                    <Check size={12} />
                    {ALL_RESOURCES[resource] ?? resource}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
