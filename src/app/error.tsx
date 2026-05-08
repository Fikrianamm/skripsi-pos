"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { AlertOctagon, RefreshCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="w-24 h-24 bg-danger-50 text-danger-500 rounded-full flex items-center justify-center mb-6 border-4 border-danger-100">
        <AlertOctagon size={48} strokeWidth={1.5} />
      </div>
      <h1 className="text-4xl font-extrabold text-default-900 mb-2">Oops!</h1>
      <h2 className="text-2xl font-bold text-default-800 mb-4">Terjadi Kesalahan Internal</h2>
      <p className="text-default-500 max-w-md mb-8">
        Sistem kami mendeteksi adanya masalah yang tidak terduga.
        Silakan coba muat ulang halaman ini atau kembali ke beranda.
      </p>
      <div className="flex gap-4">
        <Button
          color="primary"
          variant="shadow"
          className="font-semibold"
          startContent={<RefreshCcw size={16} />}
          onPress={() => reset()}
        >
          Coba Lagi
        </Button>
        <Button
          as={Link}
          href="/dashboard"
          color="default"
          variant="bordered"
          className="font-semibold"
        >
          Ke Beranda
        </Button>
      </div>
    </div>
  );
}
