"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { loginSchema, type LoginFormData } from "@/lib/schemas";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signInEmailAction } from "@/actions/sign-in-email.action";
import { useRouter } from "next/navigation";
import { Alert, Button, Divider, Input } from "@heroui/react";
import { authClient } from "@/lib/auth-client";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [globalError, setGlobalError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    setGlobalError("");
    const { error } = await signInEmailAction(data);

    if (error) {
      if (error.toLowerCase().includes("password")) {
        form.setError("password", { message: "Password salah!" });
      } else {
        setGlobalError(error);
      }
      return;
    }
    router.push("/dashboard");
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard", // Redirect ke dashboard setelah login
      });
      if(error){
        setGlobalError(error.message as string)
      }
    } catch (error) {
      setGlobalError(error as string);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-6 ${className}`} {...props}>
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">Masuk ke akun Anda</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Masukkan email Anda untuk masuk ke akun
        </p>
      </div>

      {globalError && <Alert color="danger" title={globalError} />}

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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
          label="Kata Sandi"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
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

        <Button
          type="submit"
          color="primary"
          isDisabled={form.formState.isSubmitting}
          isLoading={form.formState.isSubmitting}
        >
          Masuk
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
        Masuk dengan Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <a
          href="/auth/register"
          className="underline underline-offset-4 hover:text-primary"
        >
          Daftar
        </a>
      </p>
    </div>
  );
}
