import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { oneTapClient } from "better-auth/client/plugins";
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
    oneTapClient({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
      // Optional client configuration:
      autoSelect: false,
      cancelOnTapOutside: true,
      context: "signin",
      additionalOptions: {
        // Any extra options for the Google initialize method
      },
      // Configure prompt behavior and exponential backoff:
      promptOptions: {
        baseDelay: 1000, // Base delay in ms (default: 1000)
        maxAttempts: 5, // Maximum number of attempts before triggering onPromptNotification (default: 5)
      },
    }),
  ],
});
