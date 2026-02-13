"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@heroui/button";
import Link from "next/link";

export const GetStartedButton = () => {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <Button size="lg" className="opacity-50">
        <span>Get Started</span>
      </Button>
    );
  }

  const href = session ? "/dashboard" : "/auth/login";

  return (
    <div className="flex flex-col items-center gap-4">
      <Button size="lg">
        <Link href={href}>Get Started</Link>
      </Button>

      {session && <p>Welcome back, {session.user.name}! 👋</p>}
    </div>
  );
};