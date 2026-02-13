import { z } from "zod";
import { ROLE_KEYS } from "@/config/roles";

/**
 * Schema for admin create/edit user form validation
 */
export const createUserSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nama wajib diisi")
      .min(2, "Nama minimal 2 karakter")
      .max(50, "Nama maksimal 50 karakter"),
    email: z
      .string()
      .min(1, "Email wajib diisi")
      .email("Masukkan alamat email yang valid"),
    password: z
      .string()
      .min(1, "Password wajib diisi")
      .min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
    role: z.enum(ROLE_KEYS, {
      message: "Role wajib dipilih",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak sama",
    path: ["confirmPassword"],
  });

export const editUserSchema = z
  .object({
    password: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 6, {
        message: "Password minimal 6 karakter",
      }),
    confirmPassword: z.string().optional(),
    role: z.enum(ROLE_KEYS, {
      message: "Role wajib dipilih",
    }),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Password tidak sama",
    path: ["confirmPassword"],
  });

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type EditUserFormData = z.infer<typeof editUserSchema>;
