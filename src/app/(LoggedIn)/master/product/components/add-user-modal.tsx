import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { UserPlus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { createUserSchema, type CreateUserFormData } from "@/lib/schemas";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Alert } from "@heroui/alert";
import { Select, SelectItem } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { authClient } from "@/lib/auth-client";
import { ROLES } from "@/config/roles";

export default function AddUserModal({
  onUserCreated,
}: {
  onUserCreated?: () => void;
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [globalError, setGlobalError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "kasir",
    },
  });

  async function onSubmit(data: CreateUserFormData, onClose: () => void) {
    setGlobalError("");

    try {
      const { error } = await authClient.admin.createUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });

      if (error) {
        if (error.message?.toLowerCase().includes("email")) {
          form.setError("email", { message: error.message });
        } else {
          setGlobalError(error.message || "Terjadi kesalahan.");
        }
        return;
      }

      addToast({
        title: "Berhasil",
        description: "Pengguna berhasil ditambahkan.",
        color: "success",
      });

      form.reset();
      onClose();
      onUserCreated?.();
    } catch {
      setGlobalError("Terjadi kesalahan jaringan.");
    }
  }

  return (
    <>
      <Button
        color="primary"
        startContent={<UserPlus size={16} />}
        onPress={onOpen}
      >
        Tambah Pengguna
      </Button>
      <Modal
        isOpen={isOpen}
        placement="bottom-center"
        onOpenChange={(open) => {
          onOpenChange();
          if (!open) {
            form.reset();
            setGlobalError("");
          }
        }}
      >
        <ModalContent>
          {(onClose) => (
            <form
              noValidate
              onSubmit={form.handleSubmit((data) => onSubmit(data, onClose))}
            >
              <ModalHeader className="flex flex-col">
                Tambah Pengguna
                <span className="block font-normal text-base text-slate-500">
                  Tambahkan pengguna baru ke dalam sistem
                </span>
              </ModalHeader>
              <ModalBody>
                {globalError && <Alert color="danger" title={globalError} />}

                <div className="grid gap-4">
                  {/* Name Field */}
                  <Input
                    label="Nama"
                    placeholder="Nama Lengkap"
                    isRequired
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
                    isRequired
                    {...form.register("email")}
                    isDisabled={form.formState.isSubmitting}
                    isInvalid={!!form.formState.errors.email}
                    errorMessage={form.formState.errors.email?.message}
                  />

                  {/* Role Field */}
                  <Controller
                    name="role"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        label="Role"
                        placeholder="Pilih role"
                        isRequired
                        selectedKeys={field.value ? [field.value] : []}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;
                          field.onChange(selected);
                        }}
                        isDisabled={form.formState.isSubmitting}
                        isInvalid={!!form.formState.errors.role}
                        errorMessage={form.formState.errors.role?.message}
                      >
                        {ROLES.map((role) => (
                          <SelectItem key={role.key}>{role.label}</SelectItem>
                        ))}
                      </Select>
                    )}
                  />

                  {/* Password Field */}
                  <Input
                    type={showPassword ? "text" : "password"}
                    label="Kata Sandi"
                    placeholder="••••••••"
                    isRequired
                    description="Minimal 6 karakter"
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
                    isRequired
                    {...form.register("confirmPassword")}
                    isDisabled={form.formState.isSubmitting}
                    isInvalid={!!form.formState.errors.confirmPassword}
                    errorMessage={
                      form.formState.errors.confirmPassword?.message
                    }
                    endContent={
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
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
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Batal
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isDisabled={form.formState.isSubmitting}
                  isLoading={form.formState.isSubmitting}
                >
                  Tambah
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
