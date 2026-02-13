import { z } from "zod";

/**
 * Schema for user registration form validation
 */
export const registerSchema = z
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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak sama",
    path: ["confirmPassword"],
  });

/**
 * Schema for user login form validation
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Masukkan alamat email yang valid"),
  password: z
    .string()
    .min(1, "Password wajib diisi")
    .min(6, "Password minimal 6 karakter"),
});

// Type exports
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
