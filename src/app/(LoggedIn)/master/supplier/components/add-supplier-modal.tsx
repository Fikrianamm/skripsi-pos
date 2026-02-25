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
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Alert } from "@heroui/alert";
import { addToast } from "@heroui/toast";
import { z } from "zod";
import { PackagePlus } from "lucide-react";
import { InlineAvatarPicker } from "@/components/inline-avatar-picker";
import { getRandomAvatar } from "@/lib/avatars";

const addSupplierSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  nomorHp: z.string().min(1, "Nomor HP wajib diisi"),
  email: z.string().email("Email tidak valid").or(z.literal("")).optional(),
  alamat: z.string().optional(),
  keterangan: z.string().optional(),
  image: z.string().optional(),
});

type AddSupplierFormData = z.infer<typeof addSupplierSchema>;

export default function AddSupplierModal({
  onSupplierAdded,
}: {
  onSupplierAdded?: () => void;
}) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [globalError, setGlobalError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string>(getRandomAvatar());

  const form = useForm<AddSupplierFormData>({
    resolver: zodResolver(addSupplierSchema),
    mode: "onBlur",
    defaultValues: {
      nama: "",
      nomorHp: "",
      email: "",
      alamat: "",
      keterangan: "",
      image: avatarPreview,
    },
  });

  async function onSubmit(data: AddSupplierFormData) {
    setGlobalError("");
    try {
      const res = await fetch("/api/admin/supplier", {
        method: "POST",
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
        description: "Supplier berhasil ditambahkan.",
        color: "success",
      });

      const newAvatar = getRandomAvatar();
      setAvatarPreview(newAvatar);
      form.reset({
        nama: "",
        nomorHp: "",
        email: "",
        alamat: "",
        keterangan: "",
        image: newAvatar,
      });
      setGlobalError("");
      onClose();
      onSupplierAdded?.();
    } catch {
      setGlobalError("Terjadi kesalahan jaringan.");
    }
  }

  return (
    <>
      <Button
        color="primary"
        startContent={<PackagePlus size={16} />}
        onPress={onOpen}
      >
        Tambah Supplier
      </Button>

      <Modal
        isOpen={isOpen}
        placement="bottom-center"
        onOpenChange={(open) => {
          onOpenChange();
          if (!open) {
            const newAvatar = getRandomAvatar();
            setAvatarPreview(newAvatar);
            form.reset({
              nama: "",
              nomorHp: "",
              email: "",
              alamat: "",
              keterangan: "",
              image: newAvatar,
            });
            setGlobalError("");
          }
        }}
      >
        <ModalContent>
          {(onClose) => (
            <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
              <ModalHeader>Tambah Supplier</ModalHeader>
              <ModalBody>
                {globalError && <Alert color="danger" title={globalError} />}

                <InlineAvatarPicker
                  value={avatarPreview}
                  onChange={setAvatarPreview}
                  fallback="S"
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
