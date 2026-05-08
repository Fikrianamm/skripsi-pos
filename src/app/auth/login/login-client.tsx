"use client";

import { Building } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { AuthToast } from "@/components/auth-toast";
import { Suspense } from "react";
import { motion } from "framer-motion";

interface LoginClientProps {
  settings: {
    namaPerusahaan: string;
    logoUrl?: string | null;
  } | null;
}

export default function LoginClient({ settings }: LoginClientProps) {
  const companyName = settings?.namaPerusahaan || "CV. Haqi Koleksi";
  const logoUrl = settings?.logoUrl;

  return (
    <div className="relative min-h-svh w-full flex items-center justify-center bg-[#f8fafc] overflow-hidden p-6">
      {/* Blurred Decorative Shapes */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.35, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute -top-[10%] -right-[5%] w-[500px] h-[500px] bg-blue-200 rounded-full blur-[100px] pointer-events-none"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ duration: 1.8, ease: "easeOut", delay: 0.2 }}
        className="absolute -bottom-[10%] -left-[5%] w-[450px] h-[450px] bg-violet-200 rounded-full blur-[80px] pointer-events-none"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.2, scale: 1 }}
        transition={{ duration: 2.1, ease: "easeOut", delay: 0.4 }}
        className="absolute top-[40%] left-[10%] w-[300px] h-[300px] bg-pink-100 rounded-full blur-[70px] pointer-events-none"
      />

      <Suspense fallback={null}>
        <AuthToast />
      </Suspense>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[400px]"
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className={`${settings?.logoUrl ? "" : "bg-primary text-primary-foreground"} flex size-12 items-center justify-center rounded-2xl shadow-lg shadow-primary/20 overflow-hidden`}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={companyName}
                  className="size-full object-contain"
                />
              ) : (
                <Building className="size-6" />
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
              {companyName}
            </h1>
            <p className="text-sm text-slate-500 font-medium text-center">
              Sistem Manajemen POS & Produksi
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
            <LoginForm />
          </div>

          <p className="text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} {companyName}. All rights
            reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
