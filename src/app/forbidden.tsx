"use client";
import Link from "next/link";
import { Button } from "@heroui/react";
import { ShieldAlert } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="w-24 h-24 bg-danger-50 text-danger-500 rounded-full flex items-center justify-center mb-6 border-4 border-danger-100">
        <ShieldAlert size={48} strokeWidth={1.5} />
      </div>
      <h1 className="text-4xl font-extrabold text-default-900 mb-2">403</h1>
      <h2 className="text-2xl font-bold text-default-800 mb-4">
        Akses Ditolak (Forbidden)
      </h2>
      <p className="text-default-500 max-w-md mb-8">
        Maaf, Anda tidak memiliki izin yang cukup untuk mengakses halaman ini.
        Silakan hubungi administrator jika Anda merasa ini adalah sebuah
        kesalahan.
      </p>
      <div className="flex gap-4">
        <Button
          as={Link}
          href="/dashboard"
          color="primary"
          variant="shadow"
          className="font-semibold"
        >
          Kembali ke Dashboard
        </Button>
      </div>
    </div>
  );
}
