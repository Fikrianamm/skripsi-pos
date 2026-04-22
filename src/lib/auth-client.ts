import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import {
  ac,
  adminRole,
  kasirRole,
  designerRole,
  produksiRole,
  gudangRole,
} from "@/lib/permissions";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  plugins: [
    adminClient({
      ac,
      roles: {
        admin: adminRole,
        kasir: kasirRole,
        designer: designerRole,
        produksi: produksiRole,
        gudang: gudangRole,
      },
    }),
  ],
});
