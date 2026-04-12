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
import { UserPlus } from "lucide-react";

const addKaryawanSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  nomorHp: z.string().optional(),
  posisi: z.string().optional(),
});

type AddKaryawanFormData = z.infer<typeof addKaryawanSchema>;

export default function AddKaryawanModal({
  onKaryawanAdded,
}: {
  onKaryawanAdded?: () => void;
}) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [globalError, setGlobalError] = useState("");

  const form = useForm<AddKaryawanFormData>({
    resolver: zodResolver(addKaryawanSchema),
    mode: "onBlur",
    defaultValues: { nama: "", nomorHp: "", posisi: "" },
  });

  async function onSubmit(data: AddKaryawanFormData) {
    setGlobalError("");
    try {
      const res = await fetch("/api/admin/karyawan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        setGlobalError(json.error || "Terjadi kesalahan.");
        return;
      }

      addToast({
        title: "Berhasil",
        description: "Karyawan berhasil ditambahkan.",
        color: "success",
      });

      form.reset();
      setGlobalError("");
      onClose();
      onKaryawanAdded?.();
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
        Tambah Karyawan
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
            <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
              <ModalHeader>Tambah Karyawan</ModalHeader>
              <ModalBody>
                {globalError && <Alert color="danger" title={globalError} />}

                <div className="grid gap-4">
                  <Input
                    label="Nama"
                    placeholder="Nama karyawan"
                    isRequired
                    {...form.register("nama")}
                    isDisabled={form.formState.isSubmitting}
                    isInvalid={!!form.formState.errors.nama}
                    errorMessage={form.formState.errors.nama?.message}
                  />
                  <Input
                    label="Posisi"
                    placeholder="Pekerja Produksi, Desainer, Admin..."
                    {...form.register("posisi")}
                    isDisabled={form.formState.isSubmitting}
                  />
                  <Input
                    label="Nomor HP"
                    placeholder="08xxxxxxxxxx"
                    {...form.register("nomorHp")}
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
