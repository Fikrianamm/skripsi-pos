"use client";

import { Divider } from "@heroui/divider";
import {
  ShieldUser,
  User,
  PencilRuler,
  Factory,
  Warehouse,
  Check,
  X,
} from "lucide-react";
import React from "react";

/**
 * Role metadata for the permission matrix.
 */
const ROLE_DETAILS = [
  {
    key: "admin",
    label: "Administrator",
    icon: <ShieldUser className="size-4" />,
    iconText: "text-red-600 dark:text-red-400",
    permissions: {
      pos: ["create", "view", "delete", "update-status"],
      customer: ["create", "view", "update"],
      payment: ["create", "view", "verify"],
      design: ["view", "upload", "update-status"],
      production: ["view", "update-status"],
      inventory: ["view", "create", "update"],
      finance: ["view", "create", "update", "delete"],
      report: ["view"],
      master: ["create", "view", "update", "delete"],
      user: ["create", "list", "set-role", "ban", "delete", "set-password"],
    },
  },
  {
    key: "admincs",
    label: "Admin CS",
    icon: <User className="size-4" />,
    iconText: "text-blue-600 dark:text-blue-400",
    permissions: {
      pos: ["create", "view", "delete", "update-status"],
      customer: ["create", "view", "update"],
      payment: ["create", "view", "verify"],
      finance: ["view", "create", "update", "delete"],
      report: ["view"],
      production: ["view"],
    },
  },
  {
    key: "designer",
    label: "Designer",
    icon: <PencilRuler className="size-4" />,
    iconText: "text-purple-600 dark:text-purple-400",
    permissions: {
      pos: ["view"],
      design: ["view", "upload", "update-status"],
    },
  },
  {
    key: "produksi",
    label: "Produksi",
    icon: <Factory className="size-4" />,
    iconText: "text-amber-600 dark:text-amber-400",
    permissions: {
      pos: ["view"],
      production: ["view", "update-status"],
    },
  },
  {
    key: "gudang",
    label: "Gudang",
    icon: <Warehouse className="size-4" />,
    iconText: "text-emerald-600 dark:text-emerald-400",
    permissions: {
      pos: ["view"],
      inventory: ["view", "create", "update"],
      master: ["view"],
    },
  },
];

/** All resources in the permission matrix */
const ALL_RESOURCES = [
  { key: "pos", label: "POS", description: "Pesanan & invoice digital" },
  {
    key: "customer",
    label: "Pelanggan",
    description: "Data & riwayat pelanggan",
  },
  { key: "payment", label: "Pembayaran", description: "DP & pelunasan" },
  { key: "design", label: "Desain", description: "Antrian & file desain" },
  { key: "production", label: "Produksi", description: "Tracking produksi" },
  { key: "inventory", label: "Inventori", description: "Bahan baku & stok" },
  { key: "finance", label: "Keuangan", description: "Jurnal & akun" },
  { key: "report", label: "Laporan", description: "Penjualan & arus kas" },
  {
    key: "master",
    label: "Master Data",
    description: "Produk, supplier, pelanggan",
  },
  {
    key: "user",
    label: "User Management",
    description: "Kelola pengguna & role",
  },
];

export default function PermissionsPage() {
  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Role & Permission</h1>
        <p className="text-muted-foreground">
          Daftar role yang tersedia dan hak akses untuk setiap role.
        </p>
      </div>
      <Divider/>

      {/* Permission Matrix Table */}
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap min-w-[180px]">
                  Modul
                </th>
                {ROLE_DETAILS.map((role) => (
                  <th
                    key={role.key}
                    className="text-center px-4 py-3 font-medium whitespace-nowrap"
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <span className={role.iconText}>{role.icon}</span>
                      <span className="text-xs">{role.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_RESOURCES.map((resource, idx) => (
                <tr
                  key={resource.key}
                  className={`${
                    idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                  } hover:bg-muted/40 transition-colors`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <span className="font-medium">{resource.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {resource.description}
                      </p>
                    </div>
                  </td>
                  {ROLE_DETAILS.map((role) => {
                    const perms =
                      role.permissions[
                        resource.key as keyof typeof role.permissions
                      ];
                    return (
                      <td key={role.key} className="text-center px-4 py-3">
                        {perms ? (
                          <div className="flex flex-col items-center gap-1">
                            <Check size={16} className="text-emerald-500" />
                            <div className="flex flex-wrap justify-center gap-1">
                              {perms.map((action) => (
                                <span
                                  key={action}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                >
                                  {action}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <X
                            size={16}
                            className="text-slate-300 dark:text-slate-600 mx-auto"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Check size={14} className="text-emerald-500" />
          <span>Memiliki akses</span>
        </div>
        <div className="flex items-center gap-1.5">
          <X size={14} className="text-slate-400" />
          <span>Tidak memiliki akses</span>
        </div>
      </div>
    </div>
  );
}
