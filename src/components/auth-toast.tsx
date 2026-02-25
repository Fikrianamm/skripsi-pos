"use client";

import { addToast } from "@heroui/toast";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function AuthToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasShownToast = useRef(false);

  useEffect(() => {
    const unauthorized = searchParams.get("unauthorized");
    const authError = searchParams.get("authError");

    if (unauthorized === "true" && !hasShownToast.current) {
      hasShownToast.current = true;

      addToast({
        title: "Login Diperlukan",
        description:
          "Silakan login terlebih dahulu untuk mengakses halaman tersebut.",
        color: "warning",
      });

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("unauthorized");
      router.replace(newUrl.pathname + newUrl.search, { scroll: false });
    }

    if (authError && !hasShownToast.current) {
      hasShownToast.current = true;

      addToast({
        title: "Login Gagal",
        description: authError,
        color: "danger",
      });

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("authError");
      router.replace(newUrl.pathname + newUrl.search, { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}
