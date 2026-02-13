"use server";

import { auth } from "@/lib/auth";
import { APIError } from "better-auth";

interface FormData {
  name: string;
  email: string;
  password: string;
}

export async function signUpEmailAction(formData: FormData) {
  const { name, email, password } = formData;

  // Validation
  if (!name) return { error: "Please enter your name" };
  if (!email) return { error: "Please enter your email" };
  if (!password) return { error: "Please enter your password" };

  try {
    // Better-Auth automatically handles cookies via nextCookies() plugin
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    return { error: null };
  } catch (err) {
    // Log error for debugging
    console.error("Sign Up Error:", err);

    if (err instanceof APIError) {
      const errorMessage = err.message?.toLowerCase() || "";
      const errorBody = err.body as
        | { code?: string; message?: string }
        | undefined;
      const errorCode = errorBody?.code;

      // Handle specific error cases
      if (
        errorCode === "USER_ALREADY_EXISTS" ||
        errorMessage.includes("already exists") ||
        errorMessage.includes("already registered")
      ) {
        return {
          error:
            "Email sudah terdaftar. Silakan login atau gunakan email lain.",
        };
      }

      if (
        errorCode === "INVALID_EMAIL" ||
        (errorMessage.includes("email") && errorMessage.includes("invalid"))
      ) {
        return { error: "Format email tidak valid." };
      }

      if (
        errorMessage.includes("password") &&
        (errorMessage.includes("weak") || errorMessage.includes("short"))
      ) {
        return { error: "Password terlalu lemah. Gunakan minimal 6 karakter." };
      }

      if (errorCode === "INVALID_DOMAIN" || errorMessage.includes("domain")) {
        return {
          error:
            "Domain email tidak diizinkan. Gunakan email dengan domain yang valid.",
        };
      }

      // Return the actual error message from Better-Auth
      return {
        error: err.message || "Gagal membuat akun. Silakan coba lagi.",
      };
    }

    // Unexpected errors
    return { error: "Terjadi kesalahan server. Silakan coba lagi nanti." };
  }
}
