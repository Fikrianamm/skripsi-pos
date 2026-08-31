/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { Plus } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
import { addToast } from "@heroui/toast";
import { Product } from "@/types/types";

const schema = z.object({
  nama: z.string().min(1, "Nama jasa wajib diisi"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  unitId: z.string().min(1, "Satuan wajib dipilih"),
});

type FormValues = z.infer<typeof schema>;

interface AddNewServiceModalProps {
  onServiceAdded?: (product: Product) => void;
}

export function AddNewServiceModal({
  onServiceAdded,
}: AddNewServiceModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: catData, isLoading: catLoading } = useSWR(
    "/api/category?limit=100",
    fetcher,
  );
  const { data: unitData, isLoading: unitLoading } = useSWR(
    "/api/unit?limit=100",
    fetcher,
  );
  const categories = catData?.results ?? [];
  const units = unitData?.results ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nama: "",
      categoryId: "",
      unitId: "",
    },
  });

  const handleOpen = () => {
    form.reset();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const sku = `JASA-${Date.now()}`;

      const payload = {
        sku,
        nama: data.nama,
        hpp: 0,
        isService: true,
        categoryId: data.categoryId,
        unitId: data.unitId,
        stok: null,
        minStok: null,
      };

      const res = await fetch("/api/admin/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Gagal menambahkan jasa");
      }

      addToast({
        title: "Berhasil",
        description: "Jasa berhasil ditambahkan",
        color: "success",
      });

      if (onServiceAdded) {
        onServiceAdded(json.product);
      }

      handleClose();
    } catch (error: any) {
      addToast({
        title: "Error",
        description: error.message || "Terjadi kesalahan",
        color: "danger",
      });
    }
  };

  return (
    <>
      <Button
        size="sm"
        color="primary"
        variant="flat"
        onPress={handleOpen}
        startContent={<Plus size={14} />}
      >
        Tambah Jasa
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} placement="center">
        <ModalContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ModalHeader className="flex flex-col gap-1">
              Tambah Produk Jasa
            </ModalHeader>
            <ModalBody>
              <Controller
                name="nama"
                control={form.control}
                render={({ field }) => (
                  <Input
                    label="Nama Produk Custom"
                    placeholder="Contoh: Desain Banner"
                    isRequired
                    {...field}
                    isInvalid={!!form.formState.errors.nama}
                    errorMessage={form.formState.errors.nama?.message}
                  />
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <Controller
                  name="categoryId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      label="Kategori"
                      placeholder="Pilih kategori"
                      isRequired
                      isLoading={catLoading}
                      selectedKeys={field.value ? [field.value] : []}
                      onSelectionChange={(keys) =>
                        field.onChange(Array.from(keys)[0] as string)
                      }
                      isInvalid={!!form.formState.errors.categoryId}
                      errorMessage={form.formState.errors.categoryId?.message}
                    >
                      {categories.map((c: any) => (
                        <SelectItem key={c.id} textValue={c.nama}>
                          {c.nama}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                />

                <Controller
                  name="unitId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      label="Satuan"
                      placeholder="Pilih satuan"
                      isRequired
                      isLoading={unitLoading}
                      selectedKeys={field.value ? [field.value] : []}
                      onSelectionChange={(keys) =>
                        field.onChange(Array.from(keys)[0] as string)
                      }
                      isInvalid={!!form.formState.errors.unitId}
                      errorMessage={form.formState.errors.unitId?.message}
                    >
                      {units.map((u: any) => (
                        <SelectItem key={u.id} textValue={u.nama}>
                          {u.nama}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleClose}>
                Batal
              </Button>
              <Button
                color="primary"
                type="submit"
                isLoading={form.formState.isSubmitting}
              >
                Simpan
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}
