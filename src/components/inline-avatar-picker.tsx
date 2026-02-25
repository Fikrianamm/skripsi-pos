"use client";

import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@heroui/button";
import { Check, ChevronDown, ChevronUp, ImageIcon } from "lucide-react";
import { ALL_AVATARS } from "@/lib/avatars";

interface InlineAvatarPickerProps {
  value: string;
  onChange: (url: string) => void;
  fallback?: string;
}

export function InlineAvatarPicker({
  value,
  onChange,
  fallback = "?",
}: InlineAvatarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {/* Preview + toggle button */}
      <div className="flex items-center gap-3">
        <Avatar className="size-14 rounded-full shrink-0">
          <AvatarImage src={value} alt="Avatar" />
          <AvatarFallback className="text-base font-semibold">
            {fallback}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Foto Profil</span>
          <Button
            type="button"
            variant="bordered"
            size="sm"
            startContent={<ImageIcon size={14} />}
            endContent={
              isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />
            }
            onPress={() => setIsOpen((prev) => !prev)}
          >
            {isOpen ? "Tutup Pilihan" : "Pilih Avatar"}
          </Button>
        </div>
      </div>

      {/* Collapsible avatar grid */}
      {isOpen && (
        <div className="grid grid-cols-6 gap-2 p-3 rounded-lg border bg-muted/30">
          {ALL_AVATARS.map((url) => (
            <button
              key={url}
              type="button"
              className="relative group"
              onClick={() => {
                onChange(url);
                setIsOpen(false);
              }}
            >
              <Avatar
                className={`size-10 mx-auto ring-2 ring-offset-1 transition-all ${
                  value === url
                    ? "ring-primary"
                    : "ring-transparent group-hover:ring-primary/50"
                }`}
              >
                <AvatarImage src={url} alt="avatar" />
              </Avatar>
              {value === url && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-primary/80 rounded-full p-0.5">
                    <Check className="size-3 text-white" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
