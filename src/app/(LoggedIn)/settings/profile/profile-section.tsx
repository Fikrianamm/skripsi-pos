"use client";
import { authClient } from "@/lib/auth-client";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/skeleton";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Image as ImageIcon } from "lucide-react";
import { AvatarPicker } from "@/components/avatar-picker";
import { addToast } from "@heroui/toast";

export default function ProfileSection() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with session data
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setAvatarPreview(session.user.image || null);
    }
  }, [session]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setMessage({ type: "error", text: "Pilih file gambar" });
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "Ukuran gambar maksimal 5MB" });
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setAvatarPreview(avatarUrl);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);

    try {
      let finalImageUrl = avatarPreview;

      // Only upload if a new file was actually selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload avatar");
        }

        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.url;
      }

      await authClient.updateUser({
        name: name,
        image: finalImageUrl || undefined,
      });

      addToast({
        title: "Profil diperbarui!",
        description: "Profil berhasil diperbarui!",
        color: "success",
      });
      setAvatarFile(null); // Reset file state
      // Refresh server components (sidebar/navbar) to show updated profile
      router.refresh();
    } catch (error) {
      addToast({
        title: "Gagal memperbarui profil!",
        description: "Gagal memperbarui profil. Silakan coba lagi.",
        color: "danger",
      });
      console.error("Error updating profile:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-0">Profil</h2>
      <p className="text-muted-foreground">
        Perbarui foto, nama tampilan, dan informasi identitas akun Anda.
      </p>
      <Divider />
      <div className="overflow-y-auto max-h-[calc(100vh-300px)] w-full px-1">
        {isPending ? (
          // Loading skeleton
          <div className="space-y-6 py-4 max-w-2xl">
            {/* Avatar skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-12 rounded-md" />
              <div className="flex items-center gap-4">
                <Skeleton className="size-20 rounded-full" />
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-24 rounded-md" />
                    <Skeleton className="h-8 w-36 rounded-md" />
                  </div>
                  <Skeleton className="h-3 w-52 rounded-md" />
                </div>
              </div>
            </div>
            {/* Name input skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-12 rounded-md" />
              <Skeleton className="h-10 w-full max-w-md rounded-md" />
            </div>
            {/* Email input skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-12 rounded-md" />
              <Skeleton className="h-10 w-full max-w-md rounded-md" />
              <Skeleton className="h-3 w-44 rounded-md" />
            </div>
            {/* Button skeleton */}
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        ) : (
          // Loaded content
          <form onSubmit={handleSubmit} className="space-y-6 py-4 max-w-2xl">
            {/* Avatar Input */}
            <div className="space-y-2 flex flex-col">
              <label className="text-sm font-medium">Avatar</label>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar
                    className="size-20 cursor-pointer rounded-full"
                    onClick={handleAvatarClick}
                  >
                    <AvatarImage src={avatarPreview || undefined} alt={name} className="object-cover"/>
                    <AvatarFallback className="text-lg rounded-full">
                      {getInitials(name || session?.user?.email || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    <Camera className="size-6 text-white" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAvatarClick}
                    >
                      <Camera className="size-4 mr-1" />
                      Unggah
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAvatarPickerOpen(true)}
                    >
                      <ImageIcon className="size-4 mr-1" />
                      Pilih dari Koleksi
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unggah gambar atau pilih dari koleksi
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2 flex flex-col">
              <label htmlFor="name" className="text-sm font-medium">
                Nama
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Masukkan nama Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="max-w-md"
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2 flex flex-col">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={session?.user?.email || ""}
                disabled
                className="max-w-md bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email tidak dapat diubah.
              </p>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-3 rounded-md text-sm ${
                  message.type === "success"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </form>
        )}
      </div>

      {/* Avatar Picker Dialog */}
      <AvatarPicker
        open={isAvatarPickerOpen}
        onOpenChange={setIsAvatarPickerOpen}
        onSelect={handleAvatarSelect}
        currentAvatar={avatarPreview}
      />
    </>
  );
}
