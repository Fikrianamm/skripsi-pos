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
import { PenLine } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { editUserSchema, type EditUserFormData } from "@/lib/schemas";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Alert } from "@heroui/alert";
import { Checkbox, Select, SelectItem, Tooltip } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { authClient } from "@/lib/auth-client";
import { User } from "@/types/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitialName } from "@/lib/func";
import { ROLES, type RoleKey } from "@/config/roles";

export default function EditUserModal({
  onUserEdited,
  user,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  onUserEdited?: () => void;
  user: User;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const {
    isOpen: internalIsOpen,
    onOpen,
    onOpenChange: internalOnOpenChange,
  } = useDisclosure();
  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const onOpenChange = controlledOnOpenChange ?? internalOnOpenChange;

  const [globalError, setGlobalError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetPass, setShowResetPass] = useState(false);

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    mode: "onBlur",
    defaultValues: {
      password: "",
      confirmPassword: "",
      role: user.role as RoleKey,
    },
  });

  async function onSubmit(data: EditUserFormData, onClose: () => void) {
    setGlobalError("");

    try {
      const { error } = await authClient.admin.updateUser({
        userId: user.id,
        data: {
          role: data.role,
        },
      });

      if (error) {
        setGlobalError(error.message || "Terjadi kesalahan.");
        return;
      }

      if (data.password) {
        const { error } = await authClient.admin.setUserPassword({
          userId: user.id,
          newPassword: data.password as string,
        });

        if (error) {
          setGlobalError(error.message || "Terjadi kesalahan.");
          return;
        }

        const { error: revokeError } =
          await authClient.admin.revokeUserSessions({
            userId: user.id,
          });

        if (revokeError) {
          setGlobalError(revokeError.message || "Terjadi kesalahan.");
          return;
        }
      }

      addToast({
        title: "Berhasil",
        description: "Pengguna berhasil diupdate.",
        color: "success",
      });
      form.reset();
      onClose();
      onUserEdited?.();
    } catch {
      setGlobalError("Terjadi kesalahan jaringan.");
    }
  }

  return (
    <>
      {controlledIsOpen === undefined && (
        <Tooltip content="Edit User">
          <Button variant="light" size="sm" onPress={onOpen} isIconOnly>
            <PenLine size={16} />
          </Button>
        </Tooltip>
      )}
      <Modal
        isOpen={isOpen}
        placement="bottom-center"
        onOpenChange={(open) => {
          onOpenChange(open);
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
              <ModalHeader className="flex flex-col gap-2">
                Edit Pengguna
                <span className="flex items-center gap-2 font-medium text-base text-slate-500">
                  <Avatar className="size-6">
                    <AvatarImage src={user.image || ""} alt={user.name} />
                    <AvatarFallback>{getInitialName(user.name)}</AvatarFallback>
                  </Avatar>
                  {user.name}
                </span>
              </ModalHeader>
              <ModalBody>
                {globalError && <Alert color="danger" title={globalError} />}

                <div className="grid gap-4">
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

                  <Checkbox
                    isSelected={showResetPass}
                    onValueChange={() => setShowResetPass(!showResetPass)}
                  >
                    Reset Password
                  </Checkbox>
                  {showResetPass &&
                    user?.accounts.some(
                      (provider) => provider.providerId === "credential",
                    ) && (
                      <>
                        {/* Password Field */}
                        <Input
                          type={showPassword ? "text" : "password"}
                          label="Kata Sandi Baru"
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
                      </>
                    )}
                  {showResetPass &&
                    user?.accounts.some(
                      (provider) => provider.providerId !== "credential",
                    ) && (
                      <Alert
                        color="default"
                        title="Perhatian"
                        description="Pengguna tidak dapat reset password karena tidak memiliki akun credential"
                      />
                    )}
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
                  Simpan
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
