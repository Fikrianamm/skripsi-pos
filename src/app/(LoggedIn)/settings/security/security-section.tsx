"use client";
import { authClient } from "@/lib/auth-client";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/skeleton";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff, KeyRound, Link } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
import GoogleIcon from "@/components/google-icon";

export default function SecuritySection() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  // Account detection
  const { data, isLoading } = useSWR(`/api/check-account`, fetcher, {
    keepPreviousData: true,
  });

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const validateForm = (): string | null => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return "Semua field harus diisi";
    }
    if (newPassword.length < 6) {
      return "Password baru minimal 6 karakter";
    }
    if (newPassword !== confirmPassword) {
      return "Konfirmasi password tidak cocok";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    setIsUpdating(true);

    try {
      const result = await authClient.changePassword({
        currentPassword: currentPassword,
        newPassword: newPassword,
        revokeOtherSessions: true,
      });

      if (result.error) {
        setMessage({
          type: "error",
          text: result.error.message || "Gagal mengganti password",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "Password berhasil diganti! Anda akan logout...",
      });

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Wait 2 seconds then logout
      setTimeout(async () => {
        await authClient.signOut();
        router.push("/auth/login");
      }, 2000);
    } catch (error) {
      setMessage({
        type: "error",
        text: "Terjadi kesalahan. Silakan coba lagi.",
      });
      console.error("Error changing password:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-0">Keamanan</h2>
      <p className="text-muted-foreground">
        Perbarui kata sandi dan pantau metode login yang terhubung ke akun Anda.
      </p>
      <Divider />
      <div className="overflow-y-auto max-h-[calc(100vh-300px)] w-full px-1">
        {isLoading ? (
          <div className="space-y-6 py-4 max-w-2xl">
            {/* Linked account skeleton */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="size-5 rounded-md" />
                <Skeleton className="h-5 w-36 rounded-md" />
              </div>
              <Skeleton className="h-9 w-60 rounded-md" />
            </div>
            <Skeleton className="h-px w-full" />
            {/* Section header skeleton */}
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className="h-5 w-32 rounded-md" />
            </div>
            {/* Password inputs skeleton */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-10 w-full max-w-md rounded-md" />
              </div>
            ))}
            {/* Button skeleton */}
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        ) : (
          <div className="space-y-6 py-4 max-w-2xl">
            {/* Linked Accounts Info */}
            {data?.providerId.includes("google") && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Link className="size-5 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Akun Terhubung</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-800 text-sm text-slate-600">
                    {/* Google Icon */}
                    <GoogleIcon />
                    {session?.user.email}
                  </div>
                </div>
                <Divider />
              </>
            )}

            {/* Conditional Form */}
            {data?.providerId.includes("credential") && (
              /* ============================================ */
              /* Form: Ganti Password (user sudah punya password) */
              /* ============================================ */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <KeyRound className="size-5 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Ganti Password</h3>
                </div>

                {/* Current Password */}
                <div className="space-y-2 flex flex-col">
                  <label
                    htmlFor="currentPassword"
                    className="text-sm font-medium"
                  >
                    Password Lama
                  </label>
                  <div className="relative max-w-md">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Masukkan password lama"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2 flex flex-col">
                  <label htmlFor="newPassword" className="text-sm font-medium">
                    Password Baru
                  </label>
                  <div className="relative max-w-md">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Masukkan password baru (min. 6 karakter)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-2 flex flex-col">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium"
                  >
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative max-w-md">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Masukkan ulang password baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
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

                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Ganti Password"
                  )}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </>
  );
}
