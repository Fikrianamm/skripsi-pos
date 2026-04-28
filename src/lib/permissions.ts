import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

/**
 * Resource statements for CV. Haqi Koleksi
 * Merge with defaultStatements to keep built-in user/session permissions.
 */
const statement = {
  ...defaultStatements,
  pos: ["create", "view", "delete", "update-status"],
  customer: ["create", "view", "update"],
  payment: ["create", "view", "verify"],
  design: ["view", "upload", "update-status"],
  production: ["view", "update-status"],
  inventory: ["view", "create", "update"],
  finance: ["view", "create", "update", "delete"],
  report: ["view"],
  master: ["create", "view", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

// ---- Roles ------------------------------------------------

/** Administrator — full access to everything */
export const adminRole = ac.newRole({
  pos: ["create", "view", "delete", "update-status"],
  customer: ["create", "view", "update"],
  payment: ["create", "view", "verify"],
  design: ["view", "upload", "update-status"],
  production: ["view", "update-status"],
  inventory: ["view", "create", "update"],
  finance: ["view", "create", "update", "delete"],
  report: ["view"],
  master: ["create", "view", "update", "delete"],
  ...adminAc.statements, // built-in user/session admin perms
});

/** Admin CS / Kasir — POS, customer, payment, full finance & reports */
export const kasirRole = ac.newRole({
  pos: ["create", "view", "delete", "update-status"],
  customer: ["create", "view", "update"],
  payment: ["create", "view", "verify"],
  finance: ["view", "create", "update", "delete"],
  report: ["view"],
  production: ["view"], // can view production status
});

/** Designer — design queue, bank desain, and view orders */
export const designerRole = ac.newRole({
  pos: ["view"],
  design: ["view", "upload", "update-status"],
});

/** Produksi — SPK and view orders */
export const produksiRole = ac.newRole({
  pos: ["view"],
  production: ["view", "update-status"],
});

/** Gudang — manage inventory and view suppliers/orders */
export const gudangRole = ac.newRole({
  pos: ["view"],
  inventory: ["view", "create", "update"],
  master: ["view"], // view only (for supplier)
});
