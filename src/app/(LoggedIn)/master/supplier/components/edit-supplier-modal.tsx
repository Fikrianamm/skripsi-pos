"use client";

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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { useState } from "react";
import { Alert } from "@heroui/alert";
import { Switch } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { Supplier } from "@/types/types";
import { z } from "zod";
import { InlineAvatarPicker } from "@/components/inline-avatar-picker";

const editSupplierSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  nomorHp: z.string().min(1, "Nomor HP wajib diisi"),
  email: z.string().email("Email tidak valid").or(z.literal("")).optional(),
  alamat: z.string().optional(),
  keterangan: z.string().optional(),
  isActive: z.boolean(),
});

type EditSupplierFormData = z.infer<typeof editSupplierSchema>;

export default function EditSupplierModal({
  supplier,
  onSupplierEdited,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  supplier: Supplier;
  onSupplierEdited?: () => void;
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

  const [globalError, setGlobalError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string>(
    supplier.image || "/assets/avatar/male/1.png",
  );

  const form = useForm<EditSupplierFormData>({
    resolver: zodResolver(editSupplierSchema),
    mode: "onBlur",
    defaultValues: {
      nama: supplier.nama,
      nomorHp: supplier.nomorHp ?? "",
      email: supplier.email ?? "",
      alamat: supplier.alamat ?? "",
      keterangan: supplier.keterangan ?? "",
      isActive: supplier.isActive,
    },
  });

  async function onSubmit(data: EditSupplierFormData, onClose: () => void) {
    setGlobalError("");
    try {
      const res = await fetch(`/api/admin/supplier/${supplier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, image: avatarPreview }),
      });

      const json = await res.json();
      if (!res.ok) {
        setGlobalError(json.error || "Terjadi kesalahan.");
        return;
      }

      addToast({
        title: "Berhasil",
        description: "Supplier berhasil diupdate.",
        color: "success",
      });
      form.reset();
      onClose();
      onSupplierEdited?.();
    } catch {
      setGlobalError("Terjadi kesalahan jaringan.");
    }
  }

  return (
    <>
      {controlledIsOpen === undefined && (
        <Button variant="light" size="sm" onPress={onOpen} isIconOnly>
          Edit
        </Button>
      )}

      <Modal
        isOpen={isOpen}
        placement="bottom-center"
        onOpenChange={(open) => {
          onOpenChange(open);
          if (!open) {
            form.reset({
              nama: supplier.nama,
              nomorHp: supplier.nomorHp ?? "",
              email: supplier.email ?? "",
              alamat: supplier.alamat ?? "",
              keterangan: supplier.keterangan ?? "",
              isActive: supplier.isActive,
            });
            setAvatarPreview(supplier.image || "/assets/avatar/male/1.png");
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
                Edit Supplier
                <span className="block font-normal text-base text-slate-500">
                  {supplier.nama}
                </span>
              </ModalHeader>
              <ModalBody>
                {globalError && <Alert color="danger" title={globalError} />}

                <InlineAvatarPicker
                  value={avatarPreview}
                  onChange={setAvatarPreview}
                  fallback={supplier.nama.charAt(0).toUpperCase()}
                />

                <div className="grid gap-4 mt-2">
                  <Input
                    label="Nama"
                    placeholder="Nama supplier"
                    isRequired
                    {...form.register("nama")}
                    isDisabled={form.formState.isSubmitting}
                    isInvalid={!!form.formState.errors.nama}
                    errorMessage={form.formState.errors.nama?.message}
                  />
                  <Input
                    label="Nomor HP"
                    placeholder="08xxxxxxxxxx"
                    isRequired
                    {...form.register("nomorHp")}
                    isDisabled={form.formState.isSubmitting}
                    isInvalid={!!form.formState.errors.nomorHp}
                    errorMessage={form.formState.errors.nomorHp?.message}
                  />
                  <Input
                    type="email"
                    label="Email"
                    placeholder="supplier@example.com"
                    {...form.register("email")}
                    isDisabled={form.formState.isSubmitting}
                    isInvalid={!!form.formState.errors.email}
                    errorMessage={form.formState.errors.email?.message}
                  />
                  <Input
                    label="Alamat"
                    placeholder="Alamat supplier"
                    {...form.register("alamat")}
                    isDisabled={form.formState.isSubmitting}
                  />
                  <Input
                    label="Keterangan"
                    placeholder="Keterangan tambahan"
                    {...form.register("keterangan")}
                    isDisabled={form.formState.isSubmitting}
                  />
                  <Controller
                    name="isActive"
                    control={form.control}
                    render={({ field }) => (
                      <div className="flex items-center justify-between px-1">
                        <span className="text-sm">Status Aktif</span>
                        <Switch
                          isSelected={field.value}
                          onValueChange={field.onChange}
                          isDisabled={form.formState.isSubmitting}
                          color="success"
                        />
                      </div>
                    )}
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
