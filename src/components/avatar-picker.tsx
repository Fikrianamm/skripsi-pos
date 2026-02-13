"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface AvatarPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (avatarUrl: string) => void;
  currentAvatar?: string | null;
}

const MALE_AVATARS = [
  "/assets/avatar/male/1.png",
  "/assets/avatar/male/4.png",
  "/assets/avatar/male/13.png",
  "/assets/avatar/male/34.png",
  "/assets/avatar/male/36.png",
  "/assets/avatar/male/41.png",
];

const FEMALE_AVATARS = [
  "/assets/avatar/female/69.png",
  "/assets/avatar/female/73.png",
  "/assets/avatar/female/90.png",
  "/assets/avatar/female/91.png",
  "/assets/avatar/female/94.png",
  "/assets/avatar/female/96.png",
];

export function AvatarPicker({
  open,
  onOpenChange,
  onSelect,
  currentAvatar,
}: AvatarPickerProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(
    currentAvatar || null,
  );

  const handleSelect = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
  };

  const handleConfirm = () => {
    if (selectedAvatar) {
      onSelect(selectedAvatar);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Pilih Avatar Anda</DialogTitle>
          <DialogDescription>Pilih avatar dari koleksi kami</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="male" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="male">Pria</TabsTrigger>
            <TabsTrigger value="female">Wanita</TabsTrigger>
          </TabsList>

          <TabsContent value="male" className="mt-4">
            <div className="grid grid-cols-3 gap-4 p-4">
              {MALE_AVATARS.map((avatarUrl) => (
                <div
                  key={avatarUrl}
                  className="relative group cursor-pointer"
                  onClick={() => handleSelect(avatarUrl)}
                >
                  <Avatar
                    className={`size-24 mx-auto ring-2 ring-offset-2 ring-transparent group-hover:ring-primary transition-all ${selectedAvatar === avatarUrl ? "ring-primary" : ""}`}
                  >
                    <AvatarImage src={avatarUrl} alt="Avatar pria" />
                  </Avatar>
                  {selectedAvatar === avatarUrl && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full">
                      <div className="bg-primary/80 rounded-full p-1">
                        <Check className="size-6 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="female" className="mt-4">
            <div className="grid grid-cols-3 gap-4 p-4">
              {FEMALE_AVATARS.map((avatarUrl) => (
                <div
                  key={avatarUrl}
                  className="relative group cursor-pointer"
                  onClick={() => handleSelect(avatarUrl)}
                >
                  <Avatar
                    className={`size-24 mx-auto ring-2 ring-offset-2 ring-transparent group-hover:ring-primary transition-all ${selectedAvatar === avatarUrl ? "ring-primary" : ""}`}
                  >
                    <AvatarImage src={avatarUrl} alt="Avatar wanita" />
                  </Avatar>
                  {selectedAvatar === avatarUrl && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full">
                      <div className="bg-primary/80 rounded-full p-1">
                        <Check className="size-6 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedAvatar}>
            Konfirmasi Pilihan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
