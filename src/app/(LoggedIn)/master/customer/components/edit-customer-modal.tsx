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
import { Customer } from "@/types/types";
import { z } from "zod";
import { InlineAvatarPicker } from "@/components/inline-avatar-picker";

const schema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  nomorHp: z.string().min(1, "Nomor HP wajib diisi"),
});
type FormData = z.infer<typeof schema>;

export default function EditCustomerModal({
  customer,
  onCustomerEdited,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  customer: Customer;
  onCustomerEdited?: () => void;
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
    customer.image || "/assets/avatar/male/1.png",
  );

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { nama: customer.nama, nomorHp: customer.nomorHp },
  });

  async function onSubmit(data: FormData, onClose: () => void) {
    setGlobalError("");
    try {
      const res = await fetch(`/api/admin/customer/${customer.id}`, {
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
        description: "Customer berhasil diupdate.",
        color: "success",
      });
      onClose();
      onCustomerEdited?.();
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
            form.reset({ nama: customer.nama, nomorHp: customer.nomorHp });
            setAvatarPreview(customer.image || "/assets/avatar/male/1.png");
            setGlobalError("");
          }
        }}
      >
        <ModalContent>
          {(onClose) => (
            <form
              noValidate
              onSubmit={form.handleSubmit((d) => onSubmit(d, onClose))}
            >
              <ModalHeader className="flex flex-col">
                Edit Customer
                <span className="block font-normal text-base text-slate-500">
                  {customer.nama}
                </span>
              </ModalHeader>
              <ModalBody>
                {globalError && <Alert color="danger" title={globalError} />}
                <InlineAvatarPicker
                  value={avatarPreview}
                  onChange={setAvatarPreview}
                  fallback={customer.nama.charAt(0).toUpperCase()}
                />
                <div className="grid gap-4 mt-2">
                  <Input
                    label="Nama"
                    placeholder="Nama customer"
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
