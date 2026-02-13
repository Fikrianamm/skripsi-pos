/**
 * Centralized roles configuration for CV. Haqi Koleksi
 * Single source of truth — used by schemas, UI, and API routes.
 */
export const ROLES = [
  { key: "admin", label: "Administrator" },
  { key: "kasir", label: "Admin CS / Kasir" },
  { key: "designer", label: "Designer" },
  { key: "produksi", label: "Produksi" },
  { key: "gudang", label: "Gudang" },
] as const;

export type RoleKey = (typeof ROLES)[number]["key"];
export const ROLE_KEYS = ROLES.map((r) => r.key) as unknown as [
  RoleKey,
  ...RoleKey[],
];
