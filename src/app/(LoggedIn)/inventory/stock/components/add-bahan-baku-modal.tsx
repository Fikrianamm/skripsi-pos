"use client";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
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
import { Select, SelectItem } from "@heroui/react";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
import { Unit } from "@/types/types";
import { Controller } from "react-hook-form";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";

const schema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  unitId: z.string().min(1, "Satuan wajib diisi"),
  stok: z.string().optional(),
  minStok: z.string().optional(),
  keterangan: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const defaultValues: FormData = {
  nama: "",
  unitId: "",
  stok: "0",
  minStok: "",
  keterangan: "",
};

export default function AddBahanBakuModal({
  onAdded,
}: {
  onAdded?: () => void;
}) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [globalError, setGlobalError] = useState("");
  const [displayStok, setDisplayStok] = useState<number>(0);
  const [displayMinStok, setDisplayMinStok] = useState<number>(0);

  const { data: unitData } = useSWR(`/api/unit?limit=100`, fetcher);
  const units = unitData?.results ?? [];

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues,
  });

  async function onSubmit(data: FormData) {
    setGlobalError("");
    try {
      const res = await fetch("/api/admin/bahan-baku", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: data.nama,
          unitId: data.unitId,
          stok: data.stok ? Number(data.stok) : 0,
          minStok: data.minStok ? Number(data.minStok) : null,
          keterangan: data.keterangan || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setGlobalError(json.error || "Terjadi kesalahan.");
        return;
      }
      addToast({
        title: "Berhasil",
        description: "Bahan baku berhasil ditambahkan.",
        color: "success",
      });
      form.reset(defaultValues);
      setDisplayStok(0);
      setDisplayMinStok(0);
      setGlobalError("");
      onClose();
      onAdded?.();
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
        Tambah Bahan Baku
      </Button>

      <Modal
        isOpen={isOpen}
        placement="bottom-center"
        onOpenChange={(open) => {
          onOpenChange();
          if (!open) {
            form.reset(defaultValues);
            setDisplayStok(0);
            setDisplayMinStok(0);
            setGlobalError("");
          }
        }}
      >
        <ModalContent>
          {(onClose) => (
            <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
              <ModalHeader>Tambah Bahan Baku</ModalHeader>
              <ModalBody>
                {globalError && <Alert color="danger" title={globalError} />}
                <div className="grid gap-4 mt-2">
                  <Input
                    label="Nama Bahan Baku"
                    placeholder="Contoh: Kain Cotton, Tinta Plastisol"
                    isRequired
                    {...form.register("nama")}
                    isDisabled={form.formState.isSubmitting}
                    isInvalid={!!form.formState.errors.nama}
                    errorMessage={form.formState.errors.nama?.message}
                  />
                  <Controller
                    name="unitId"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        label="Satuan"
                        placeholder="Pilih satuan"
                        isRequired
                        selectedKeys={field.value ? [field.value] : []}
                        onSelectionChange={(keys) =>
                          field.onChange(Array.from(keys)[0] as string)
                        }
                        isDisabled={form.formState.isSubmitting}
                        isInvalid={!!form.formState.errors.unitId}
                        errorMessage={form.formState.errors.unitId?.message}
                      >
                        {units.map((u: Unit) => (
                          <SelectItem key={u.id!}>{u.nama}</SelectItem>
                        ))}
                      </Select>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <FormattedNumberInput
                      label="Stok Awal"
                      placeholder="0"
                      value={displayStok}
                      onChange={(v) => {
                        setDisplayStok(Number(v));
                        form.setValue("stok", String(Number(v)));
                      }}
                      isDisabled={form.formState.isSubmitting}
                    />
                    <FormattedNumberInput
                      label="Minimum Stok"
                      placeholder="Opsional"
                      value={displayMinStok}
                      onChange={(v) => {
                        setDisplayMinStok(Number(v));
                        form.setValue("minStok", String(Number(v)));
                      }}
                      description="Indikator stok menipis"
                      isDisabled={form.formState.isSubmitting}
                    />
                  </div>
                  <Textarea
                    label="Keterangan"
                    placeholder="Keterangan tambahan (opsional)"
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
