"use client";

import { Spinner } from "@heroui/react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-md transition-opacity">
      <div className="relative flex flex-col items-center gap-6 p-8 rounded-3xl bg-white/40 dark:bg-default-100/20 border border-white/20 shadow-2xl backdrop-blur-xl">
        {/* Decorative background element */}
        <div className="absolute -z-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        
        <div className="relative">
          <Spinner 
            size="lg" 
            color="primary" 
            labelColor="primary" 
            classNames={{
              circle1: "border-b-primary border-3",
              circle2: "border-b-primary border-3",
              label: "text-primary font-bold tracking-wider mt-4"
            }}
          />
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <p className="text-default-900 font-bold text-lg">Mohon Tunggu</p>
          <p className="text-default-500 text-sm animate-pulse">Menyiapkan data terbaik untuk Anda...</p>
        </div>
      </div>
    </div>
  );
}
