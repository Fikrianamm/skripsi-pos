"use client";
import Link from "next/link";
import { Button } from "@heroui/react";
import { LockKeyhole } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="w-24 h-24 bg-warning-50 text-warning-500 rounded-full flex items-center justify-center mb-6 border-4 border-warning-100">
        <LockKeyhole size={48} strokeWidth={1.5} />
      </div>
      <h1 className="text-4xl font-extrabold text-default-900 mb-2">401</h1>
      <h2 className="text-2xl font-bold text-default-800 mb-4">Akses Ditolak (Unauthorized)</h2>
      <p className="text-default-500 max-w-md mb-8">
        Anda harus login terlebih dahulu untuk mengakses halaman ini.
        Silakan masuk menggunakan akun Anda yang terdaftar.
      </p>
      <div className="flex gap-4">
        <Button
          as={Link}
          href="/auth/login"
          color="primary"
          variant="shadow"
          className="font-semibold"
        >
          Masuk Sekarang
        </Button>
      </div>
    </div>
  );
}
