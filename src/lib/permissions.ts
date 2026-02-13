import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

/**
 * Resource statements for CV. Haqi Koleksi
 * Merge with defaultStatements to keep built-in user/session permissions.
 */
const statement = {
  ...defaultStatements,
  pos: ["create", "view"],
  customer: ["create", "view", "update"],
  payment: ["create", "view", "verify"],
  design: ["view", "upload", "update-status"],
  production: ["view", "update-status"],
  inventory: ["view", "create", "update"],
  report: ["view"],
  master: ["create", "view", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

// ---- Roles ------------------------------------------------

/** Administrator — full access to everything */
export const adminRole = ac.newRole({
  pos: ["create", "view"],
  customer: ["create", "view", "update"],
  payment: ["create", "view", "verify"],
  design: ["view", "upload", "update-status"],
  production: ["view", "update-status"],
  inventory: ["view", "create", "update"],
  report: ["view"],
  master: ["create", "view", "update", "delete"],
  ...adminAc.statements, // built-in user/session admin perms
});

/** Admin CS / Kasir — POS, customer, payment, view production */
export const kasirRole = ac.newRole({
  pos: ["create", "view"],
  customer: ["create", "view", "update"],
  payment: ["create", "view", "verify"],
  production: ["view"],
});

/** Designer — design queue, upload files, update design status */
export const designerRole = ac.newRole({
  design: ["view", "upload", "update-status"],
});

/** Produksi — track & update production status */
export const produksiRole = ac.newRole({
  production: ["view", "update-status"],
});

/** Gudang — manage raw material inventory */
export const gudangRole = ac.newRole({
  inventory: ["view", "create", "update"],
});
