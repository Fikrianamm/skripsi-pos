"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { registerSchema, type RegisterFormData } from "@/lib/schemas";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signUpEmailAction } from "@/actions/sign-up-email.action";
import { useRouter } from "next/navigation";
import { Alert, Button, Divider, Input } from "@heroui/react";
import { authClient } from "@/lib/auth-client";

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [globalError, setGlobalError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: RegisterFormData) {
    setGlobalError("");
    const { error } = await signUpEmailAction(data);

    if (error) {
      if (error.toLowerCase().includes("email")) {
        form.setError("email", { message: error });
      } else {
        setGlobalError(error);
      }
    } else {
      router.push("/auth/login");
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard", // Redirect ke dashboard setelah login
      });
    } catch (error) {
      setGlobalError(error as string);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-6 ${className}`} {...props}>
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">Buat akun baru</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Masukkan informasi Anda untuk membuat akun
        </p>
      </div>

      {globalError && <Alert color="danger" title={globalError} />}

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        {/* Name Field */}
        <Input
          label="Nama"
          placeholder="Nama Lengkap"
          {...form.register("name")}
          isDisabled={form.formState.isSubmitting}
          isInvalid={!!form.formState.errors.name}
          errorMessage={form.formState.errors.name?.message}
        />

        {/* Email Field */}
        <Input
          type="email"
          label="Email"
          placeholder="m@example.com"
          {...form.register("email")}
          isDisabled={form.formState.isSubmitting}
          isInvalid={!!form.formState.errors.email}
          errorMessage={form.formState.errors.email?.message}
        />

        {/* Password Field */}
        <Input
          type={showPassword ? "text" : "password"}
          label="Kata Sandi"
          placeholder="••••••••"
          description="Minimal 8 karakter"
          {...form.register("password")}
          isDisabled={form.formState.isSubmitting}
          isInvalid={!!form.formState.errors.password}
          errorMessage={form.formState.errors.password?.message}
          endContent={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={form.formState.isSubmitting}
              className="focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-default-400" />
              ) : (
                <Eye className="h-4 w-4 text-default-400" />
              )}
            </button>
          }
        />

        {/* Confirm Password Field */}
        <Input
          type={showConfirmPassword ? "text" : "password"}
          label="Konfirmasi Kata Sandi"
          placeholder="••••••••"
          {...form.register("confirmPassword")}
          isDisabled={form.formState.isSubmitting}
          isInvalid={!!form.formState.errors.confirmPassword}
          errorMessage={form.formState.errors.confirmPassword?.message}
          endContent={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={form.formState.isSubmitting}
              className="focus:outline-none"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-default-400" />
              ) : (
                <Eye className="h-4 w-4 text-default-400" />
              )}
            </button>
          }
        />

        <Button
          type="submit"
          color="primary"
          isDisabled={form.formState.isSubmitting}
          isLoading={form.formState.isSubmitting}
        >
          Buat Akun
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Divider />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Atau lanjutkan dengan
          </span>
        </div>
      </div>

      <Button
        type="button"
        disabled={form.formState.isSubmitting || isGoogleLoading}
        isLoading={isGoogleLoading}
        onClick={handleGoogleLogin}
      >
        <FcGoogle />
        Daftar dengan Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <a
          href="/auth/login"
          className="underline underline-offset-4 hover:text-primary"
        >
          Masuk
        </a>
      </p>
    </div>
  );
}
