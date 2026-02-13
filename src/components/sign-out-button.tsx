"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const SignOutButton = () => {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleClick() {
    await authClient.signOut({
      fetchOptions: {
        onRequest: () => {
          setIsPending(true);
        },
        onResponse: () => {
          setIsPending(false);
        },
        onError: (ctx) => {
          addToast({
            title: "Gagal",
            description: ctx.error.message,
            color: "danger",
          });
        },
        onSuccess: () => {
          addToast({
            title: "Berhasil",
            description: "Anda telah keluar. Sampai jumpa!",
            color: "success",
          });
          router.push("/auth/login");
        },
      },
    });
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      {isPending ? "Keluar..." : "Keluar"}
    </Button>
  );
};
