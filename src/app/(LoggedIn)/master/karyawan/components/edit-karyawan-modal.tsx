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
import { Karyawan } from "@/types/types";
import { z } from "zod";

const editKaryawanSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  nomorHp: z.string().optional(),
  posisi: z.string().optional(),
  isActive: z.boolean(),
});

type EditKaryawanFormData = z.infer<typeof editKaryawanSchema>;

export default function EditKaryawanModal({
  karyawan,
  onKaryawanEdited,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  karyawan: Karyawan;
  onKaryawanEdited?: () => void;
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

  const form = useForm<EditKaryawanFormData>({
    resolver: zodResolver(editKaryawanSchema),
    mode: "onBlur",
    defaultValues: {
      nama: karyawan.nama,
      nomorHp: karyawan.nomorHp ?? "",
      posisi: karyawan.posisi ?? "",
      isActive: karyawan.isActive,
    },
  });

  async function onSubmit(data: EditKaryawanFormData, onClose: () => void) {
    setGlobalError("");
    try {
      const res = await fetch(`/api/admin/karyawan/${karyawan.id}`, {
        method: "PUT",
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
        description: "Data karyawan berhasil diperbarui.",
        color: "success",
      });
      form.reset();
      onClose();
      onKaryawanEdited?.();
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
              nama: karyawan.nama,
              nomorHp: karyawan.nomorHp ?? "",
              posisi: karyawan.posisi ?? "",
              isActive: karyawan.isActive,
            });
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
                Edit Karyawan
                <span className="block font-normal text-base text-slate-500">
                  {karyawan.nama}
                </span>
              </ModalHeader>
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
