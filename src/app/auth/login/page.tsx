"use client";

import { GalleryVerticalEnd } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { AuthToast } from "@/components/auth-toast";
import { Suspense } from "react";
import { GoogleOneTap } from "@/components/google-one-tap";

export default function Page() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <Suspense fallback={null}>
        <AuthToast />
      </Suspense>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Haqi Koleksi
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <GoogleOneTap />
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:flex lg:items-center lg:justify-center p-10">
        <div className="w-full max-w-2xl">
          <DotLottieReact src="/assets/login-02.lottie" loop autoplay />
        </div>
      </div>
    </div>
  );
}
