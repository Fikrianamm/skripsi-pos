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
import { InlineAvatarPicker } from "@/components/inline-avatar-picker";
import { getRandomAvatar } from "@/lib/avatars";

const schema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  nomorHp: z.string().min(1, "Nomor HP wajib diisi"),
});

type FormData = z.infer<typeof schema>;

export default function AddCustomerModal({
  onCustomerAdded,
}: {
  onCustomerAdded?: () => void;
}) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [globalError, setGlobalError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string>(getRandomAvatar());

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { nama: "", nomorHp: "" },
  });

  async function onSubmit(data: FormData) {
    setGlobalError("");
    try {
      const res = await fetch("/api/admin/customer", {
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
        description: "Customer berhasil ditambahkan.",
        color: "success",
      });
      setAvatarPreview(getRandomAvatar());
      form.reset();
      setGlobalError("");
      onClose();
      onCustomerAdded?.();
    } catch {
      setGlobalError("Terjadi kesalahan jaringan.");
    }
  }

  return (
    <>
      <Button color="primary" size="sm" onPress={onOpen}>
        + Tambah Customer
      </Button>

      <Modal
        isOpen={isOpen}
        placement="bottom-center"
        onOpenChange={(open) => {
          onOpenChange();
          if (!open) {
            setAvatarPreview(getRandomAvatar());
            form.reset();
            setGlobalError("");
          }
        }}
      >
        <ModalContent>
          {(onClose) => (
            <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
              <ModalHeader>Tambah Customer</ModalHeader>
              <ModalBody>
                {globalError && <Alert color="danger" title={globalError} />}
                <InlineAvatarPicker
                  value={avatarPreview}
                  onChange={setAvatarPreview}
                  fallback="C"
                />
                <div className="grid gap-4 mt-2">
                  <Input
                    label="Nama"
                    isRequired
                    placeholder="Nama customer"
                    {...form.register("nama")}
                    isDisabled={form.formState.isSubmitting}
                    isInvalid={!!form.formState.errors.nama}
                    errorMessage={form.formState.errors.nama?.message}
                  />
                  <Input
                    label="Nomor HP"
                    isRequired
                    placeholder="08xxxxxxxxxx"
                    {...form.register("nomorHp")}
                    isDisabled={form.formState.isSubmitting}
                    isInvalid={!!form.formState.errors.nomorHp}
                    errorMessage={form.formState.errors.nomorHp?.message}
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
