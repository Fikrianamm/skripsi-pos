"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APIError } from "better-auth";
import { headers } from "next/headers";

interface FormData {
  email: string;
  password: string;
}

export async function signInEmailAction(formData: FormData) {
  const { email, password } = formData;

  // Validation
  if (!email) return { error: "Masukkan email Anda" };
  if (!password) return { error: "Masukkan password Anda" };

  try {
    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    // If user not found, return immediately
    if (!existingUser) {
      return {
        error: "Email belum terdaftar. Silakan daftar terlebih dahulu.",
      };
    }

    // User exists, proceed with authentication
    await auth.api.signInEmail({
      headers: await headers(),
      body: {
        email,
        password,
      },
    });

    return { error: null };
  } catch (err) {
    // Log error for debugging
    console.error("Sign In Error:", err);

    if (err instanceof APIError) {
      const errorMessage = err.message?.toLowerCase() || "";
      const errorCode = err.body?.code;

      // Since we already checked user exists, password must be wrong
      if (
        errorMessage.includes("password") ||
        errorMessage.includes("invalid") ||
        errorMessage.includes("incorrect") ||
        errorMessage.includes("wrong") ||
        errorMessage.includes("credential")
      ) {
        return { error: "Password salah. Silakan coba lagi." };
      }

      if (errorCode === "INVALID_EMAIL" || errorMessage.includes("email")) {
        return { error: "Format email tidak valid." };
      }

      if (
        errorCode === "TOO_MANY_REQUESTS" ||
        errorMessage.includes("too many")
      ) {
        return {
          error: "Terlalu banyak percobaan login. Silakan coba lagi nanti.",
        };
      }

      // Return the actual error message from Better-Auth
      return {
        error: err.message || "Gagal login. Silakan coba lagi.",
      };
    }

    // Database or unexpected errors
    return { error: "Terjadi kesalahan server. Silakan coba lagi nanti." };
  }
}
