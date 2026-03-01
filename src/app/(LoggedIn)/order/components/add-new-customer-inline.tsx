"use client";

import { useState } from "react";
import { Button, Input } from "@heroui/react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Alert } from "@heroui/alert";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { UserPlus } from "lucide-react";
import { addToast } from "@heroui/toast";
import { InlineAvatarPicker } from "@/components/inline-avatar-picker";
import { getRandomAvatar } from "@/lib/avatars";

const schema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  nomorHp: z.string().min(1, "Nomor HP wajib diisi"),
});
type FormData = z.infer<typeof schema>;

interface AddNewCustomerInlineProps {
  /** Dipanggil setelah customer baru berhasil disimpan */
  onCustomerAdded: (customer: { id: string; nama: string }) => void;
  /** Override label tombol, default: "Tambah Pelanggan Baru" */
  label?: string;
}

/**
 * Komponen tombol + modal untuk menambah customer baru secara cepat.
 * Setelah disimpan, memanggil `onCustomerAdded` dengan `{ id, nama }` customer baru.
 *
 * Bisa dipakai di halaman POS, form pesanan, maupun tempat lain yang butuh
 * membuat customer on-the-fly tanpa navigasi ke halaman manajemen customer.
 */
export function AddNewCustomerInline({
  onCustomerAdded,
  label = "Tambah Pelanggan Baru",
}: AddNewCustomerInlineProps) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [globalError, setGlobalError] = useState("");
  const [avatar, setAvatar] = useState<string>(getRandomAvatar());

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { nama: "", nomorHp: "" },
  });

  function handleClose() {
    form.reset();
    setGlobalError("");
    setAvatar(getRandomAvatar());
    onClose();
  }

  async function onSubmit(data: FormData) {
    setGlobalError("");
    try {
      const res = await fetch("/api/admin/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, image: avatar }),
      });
      const json = await res.json();
      if (!res.ok) {
        setGlobalError(json.error || "Terjadi kesalahan.");
        return;
      }
      addToast({
        title: "Berhasil",
        description: `Customer "${data.nama}" telah ditambahkan.`,
        color: "success",
      });
      onCustomerAdded({ id: json.id, nama: data.nama });
      handleClose();
    } catch {
      setGlobalError("Terjadi kesalahan jaringan.");
    }
  }

  return (
    <>
      <Button
        variant="flat"
        color="success"
        size="sm"
        className="w-full"
        startContent={<UserPlus size={14} />}
        onPress={onOpen}
      >
        {label}
      </Button>

      <Modal
        isOpen={isOpen}
        placement="bottom-center"
        onOpenChange={(open) => {
          onOpenChange();
          if (!open) handleClose();
        }}
      >
        <ModalContent>
          {() => (
            <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
              <ModalHeader className="flex flex-col">
                Pelanggan Baru
                <span className="block font-normal text-sm text-default-500">
                  Data ini akan langsung dipilih sebagai pemesan
                </span>
              </ModalHeader>
              <ModalBody>
                {globalError && <Alert color="danger" title={globalError} />}
                <InlineAvatarPicker
                  value={avatar}
                  onChange={setAvatar}
                  fallback="C"
                />
                <div className="grid gap-3 mt-2">
                  <Input
                    label="Nama"
                    isRequired
                    placeholder="Nama pelanggan"
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
                <Button color="danger" variant="flat" onPress={handleClose}>
                  Batal
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={form.formState.isSubmitting}
                  isDisabled={form.formState.isSubmitting}
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
