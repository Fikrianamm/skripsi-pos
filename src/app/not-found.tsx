"use client";
import Link from "next/link";
import { Button } from "@heroui/react";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="w-24 h-24 bg-default-100 text-default-500 rounded-full flex items-center justify-center mb-6 border-4 border-default-200">
        <SearchX size={48} strokeWidth={1.5} />
      </div>
      <h1 className="text-4xl font-extrabold text-default-900 mb-2">404</h1>
      <h2 className="text-2xl font-bold text-default-800 mb-4">
        Halaman Tidak Ditemukan
      </h2>
      <p className="text-default-500 max-w-md mb-8">
        Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan. Periksa
        kembali URL yang Anda tuju.
      </p>
      <div className="flex gap-4">
        <Button
          as={Link}
          href="/dashboard"
          color="primary"
          variant="shadow"
          className="font-semibold"
        >
          Kembali ke Beranda
        </Button>
      </div>
    </div>
  );
}
