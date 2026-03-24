/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { authClient } from "@/lib/auth-client";
import { addToast } from "@heroui/toast";

export function GoogleOneTap() {
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi callback saat user mengklik One Tap
  const handleCredentialResponse = async (response: any) => {
    if (!response.credential) return;

    setIsLoading(true);
    try {
      // API Login
      const { error } = await authClient.signIn.social({
        provider: "google",
        idToken: {
          token: response.credential,
          accessToken: response.accessToken,
        },
        callbackURL: "/dashboard",
      });

      // Cek apakah ada error dari Backend Better-Auth
      if (error) {
        console.error("Server menolak login:", error);
        addToast({
          title: "Login Gagal",
          description:
            error.message ||
            error.statusText ||
            "Akun anda tidak terdaftar. Hubungi Administrator.",
          color: "danger",
        });
        return; // Jangan redirect kalau error
      }

      console.log("Login Sukses, mengalihkan...");
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Terjadi kesalahan sistem:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Inisialisasi Google One Tap setelah script dimuat
    const initializeGoogleOneTap = () => {
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false,
      });

      // Tampilkan Popup
      // window.google.accounts.id.prompt((notification: any) => {
      //   if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      //     console.log(
      //       "One Tap skipped/not displayed:",
      //       notification.getNotDisplayedReason(),
      //     );
      //   }
      // });
    };

    // Cek apakah script sudah ada
    if (window.google) {
      initializeGoogleOneTap();
    }

    // Expose fungsi ke window agar bisa dipanggil saat Script onLoad
    (window as any).initializeGoogleOneTap = initializeGoogleOneTap;
  }, []);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => (window as any).initializeGoogleOneTap?.()}
      />
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-primary z-50 animate-pulse" />
      )}
    </>
  );
}

export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (
            callback?: ((notification: any) => void) | undefined,
          ) => void;
        };
      };
    };
    initializeGoogleOneTap?: () => void;
  }
}
