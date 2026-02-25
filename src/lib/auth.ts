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
          // Bedakan antara social login (Google/OneTap) dengan admin createUser:
          // - Google OAuth/OneTap: emailVerified = true (Google selalu memverifikasi email)
          // - Admin createUser: emailVerified = false (default, belum diverifikasi)
          if (user.emailVerified) {
            // Ini adalah social login (Google/OneTap)
            // Cek apakah email sudah terdaftar oleh admin di database
            const existingUser = await prisma.user.findUnique({
              where: { email: user.email },
            });
            if (!existingUser) {
              throw new APIError("FORBIDDEN", {
                message: "Akun anda tidak terdaftar. Hubungi Administrator.",
              });
            }
          }

          // Assign random avatar jika tidak punya image
          if (user.image) return;
          return {
            data: {
              ...user,
              image: getRandomAvatar(),
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
