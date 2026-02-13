import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { hashPassword, verifyPassword } from "./argon2";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { normalizeName, VALID_DOMAINS } from "./func";
import { prisma } from "./prisma";
import { admin } from "better-auth/plugins/admin";
import { getRandomAvatar } from "./avatar-helper";
import { oneTap } from "better-auth/plugins";
import {
  ac,
  adminRole,
  kasirRole,
  designerRole,
  produksiRole,
  gudangRole,
} from "./permissions";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const email = String(ctx.body.email);
        const domain = email.split("@")[1];

        if (!VALID_DOMAINS().includes(domain)) {
          throw new APIError("BAD_REQUEST", {
            message: "Invalid domain. Please use a valid email.",
          });
        }

        const name = normalizeName(ctx.body.name);

        return {
          context: {
            ...ctx,
            body: {
              ...ctx.body,
              name,
            },
          },
        };
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Cek apakah user sudah membawa image (misal dari Google/GitHub Login)
          // Jika sudah ada, jangan ditimpa.
          if (user.image) {
            return;
          }

          // Jika tidak ada image (misal register email biasa), assign random avatar
          return {
            data: {
              ...user,
              image: getRandomAvatar(), // Masukkan path avatar random
            },
          };
        },
      },
    },
  },
  session: {
    expiresIn: 30 * 24 * 60 * 60,
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    autoSignIn: false,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
  },
  plugins: [
    nextCookies(),
    admin({
      ac,
      roles: {
        admin: adminRole,
        kasir: kasirRole,
        designer: designerRole,
        produksi: produksiRole,
        gudang: gudangRole,
      },
      defaultRole: "kasir",
    }),
    oneTap(),
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      accessType: "offline",
      prompt: "select_account consent",
    },
  },
});

export type ErrorCode = keyof typeof auth.$ERROR_CODES | "UNKNOWN";
