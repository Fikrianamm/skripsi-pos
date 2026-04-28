"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginFormData } from "@/lib/schemas";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { signInEmailAction } from "@/actions/sign-in-email.action";
import { useRouter } from "next/navigation";
import { Alert, Button, Input } from "@heroui/react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [globalError, setGlobalError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
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

  return (
    <div className={`flex flex-col gap-6 ${className}`} {...props}>
      {globalError && (
        <Alert 
          color="danger" 
          variant="flat"
          title={globalError} 
          className="rounded-xl border border-danger-100"
        />
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
        <Input
          type="email"
          label="Email"
          variant="bordered"
          placeholder="m@example.com"
          labelPlacement="outside"
          startContent={<Mail className="size-4 text-default-400 shrink-0" />}
          {...form.register("email")}
          isDisabled={form.formState.isSubmitting}
          isInvalid={!!form.formState.errors.email}
          errorMessage={form.formState.errors.email?.message}
          classNames={{
            inputWrapper: "h-12 rounded-xl border-slate-200 group-data-[focus=true]:border-primary",
            label: "text-slate-700 font-semibold",
          }}
        />

        <div className="flex flex-col gap-1">
          <Input
            label="Kata Sandi"
            variant="bordered"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            labelPlacement="outside"
            startContent={<Lock className="size-4 text-default-400 shrink-0" />}
            {...form.register("password")}
            isDisabled={form.formState.isSubmitting}
            isInvalid={!!form.formState.errors.password}
            errorMessage={form.formState.errors.password?.message}
            endContent={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={form.formState.isSubmitting}
                className="focus:outline-none p-1 rounded-md hover:bg-default-100 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-default-400" />
                ) : (
                  <Eye className="h-4 w-4 text-default-400" />
                )}
              </button>
            }
            classNames={{
              inputWrapper: "h-12 rounded-xl border-slate-200 group-data-[focus=true]:border-primary",
              label: "text-slate-700 font-semibold",
            }}
          />
        </div>

        <Button
          type="submit"
          color="primary"
          className="h-12 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 mt-2"
          isDisabled={form.formState.isSubmitting}
          isLoading={form.formState.isSubmitting}
        >
          Masuk Sekarang
        </Button>
      </form>
    </div>
  );
}
