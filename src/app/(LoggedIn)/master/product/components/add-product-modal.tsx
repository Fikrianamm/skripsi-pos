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
import { PackagePlus, ImagePlus, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { CreateProductFormData, createProductSchema } from "@/lib/schemas";
import { useRef, useState } from "react";
import { Alert } from "@heroui/alert";
import { Select, SelectItem, Switch } from "@heroui/react";
import { addToast } from "@heroui/toast";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
import { Category, Unit } from "@/types/types";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";

export default function AddProductModal({
  onProductCreated,
}: {
  onProductCreated?: () => void;
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [globalError, setGlobalError] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
    mode: "onBlur",
    defaultValues: {
      nama: "",
      categoryId: "",
      unitId: "",
      sku: "",
      hpp: 0,
      hargaJual: 0,
      stok: 0,
      minStok: 0,
      isService: false,
      image: "",
    },
  });

  const { data: categoryData } = useSWR(`/api/category?limit=100`, fetcher);
  const categories = categoryData?.results ?? [];

  const { data: unitData } = useSWR(`/api/unit?limit=100`, fetcher);
  const units = unitData?.results ?? [];

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast({ title: "File terlalu besar", description: "Maksimal 5MB", color: "danger" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    form.setValue("image", "__pending__"); // placeholder until upload
  }

  function handleRemoveImage() {
    setImagePreview("");
    setImageFile(null);
    form.setValue("image", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function resetForm() {
    form.reset({
      nama: "",
      categoryId: "",
      unitId: "",
      sku: "",
      hpp: 0,
      hargaJual: 0,
      stok: 0,
      minStok: 0,
      isService: false,
      image: "",
    });
    setImagePreview("");
    setImageFile(null);
    setGlobalError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(data: CreateProductFormData, onClose: () => void) {
    setGlobalError("");
    try {
      let imageUrl = "";

      // Upload image to S3 if a file was selected
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("folder", "products");
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          setGlobalError(err.error || "Gagal mengunggah gambar.");
          return;
        }
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const res = await fetch("/api/admin/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, image: imageUrl || null }),
      });

      const json = await res.json();
      if (!res.ok) {
        setGlobalError(json.error || "Terjadi kesalahan.");
        return;
      }

      addToast({
        title: "Berhasil",
        description: "Produk berhasil ditambahkan.",
        color: "success",
      });

      resetForm();
      onClose();
      onProductCreated?.();
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
        Tambah Produk
      </Button>

      <Modal
        isOpen={isOpen}
        placement="bottom-center"
        scrollBehavior="inside"
        size="lg"
        onOpenChange={(open) => {
          onOpenChange();
          if (!open) resetForm();
        }}
      >
        <ModalContent>
          {(onClose) => (
            <form
              noValidate
              onSubmit={form.handleSubmit((data) => onSubmit(data, onClose))}
            >
              <ModalHeader className="flex flex-col">
                Tambah Produk
                <span className="block font-normal text-base text-slate-500">
                  Lengkapi data produk
                </span>
              </ModalHeader>

              <ModalBody>
                {globalError && <Alert color="danger" title={globalError} />}

                <div className="grid gap-4">
                  {/* ── Image + Nama side by side ── */}
                  <div className="flex gap-3 items-start">
                    {/* Image picker */}
                    <div className="flex flex-col gap-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                        disabled={form.formState.isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={form.formState.isSubmitting}
                        className="relative w-[90px] h-[90px] rounded-md border-2 border-dashed border-default-300 hover:border-primary transition-colors overflow-hidden bg-content2 flex items-center justify-center shrink-0"
                      >
                        {imagePreview ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imagePreview}
                              alt="preview"
                              className="w-full h-full object-contain"
                            />
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-default-400">
                            <ImagePlus size={24} />
                            <span className="text-[10px]">Pilih foto</span>
                          </div>
                        )}
                      </button>
                      {/* Tombol hapus gambar */}
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="flex items-center justify-center gap-1 text-xs text-danger hover:underline"
                        >
                          <X size={12} /> Hapus
                        </button>
                      )}
                    </div>

                    {/* Nama */}
                    <div className="flex-1">
                      <Input
                        label="Nama Produk"
                        placeholder="Contoh: Kaos Polos Hitam"
                        isRequired
                        {...form.register("nama")}
                        isDisabled={form.formState.isSubmitting}
                        isInvalid={!!form.formState.errors.nama}
                        errorMessage={form.formState.errors.nama?.message}
                      />
                    </div>
                  </div>

                  {/* SKU */}
                  <Input
                    label="SKU"
                    placeholder="Contoh: TB2530"
                    isRequired
                    {...form.register("sku")}
                    isDisabled={form.formState.isSubmitting}
                    isInvalid={!!form.formState.errors.sku}
                    errorMessage={form.formState.errors.sku?.message}
                  />

                  {/* Kategori + Satuan */}
                  <div className="grid grid-cols-2 gap-3">
                    <Controller
                      name="categoryId"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          label="Kategori"
                          placeholder="Pilih kategori"
                          isRequired
                          selectedKeys={field.value ? [field.value] : []}
                          onSelectionChange={(keys) =>
                            field.onChange(Array.from(keys)[0] as string)
                          }
                          isDisabled={form.formState.isSubmitting}
                          isInvalid={!!form.formState.errors.categoryId}
                          errorMessage={
                            form.formState.errors.categoryId?.message
                          }
                        >
                          {categories.map((c: Category) => (
                            <SelectItem key={c.id}>{c.nama}</SelectItem>
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
                          selectedKeys={field.value ? [field.value] : []}
                          onSelectionChange={(keys) =>
                            field.onChange(Array.from(keys)[0] as string)
                          }
                          isDisabled={form.formState.isSubmitting}
                          isInvalid={!!form.formState.errors.unitId}
                          errorMessage={form.formState.errors.unitId?.message}
                        >
                          {units.map((u: Unit) => (
                            <SelectItem key={u.id}>{u.nama}</SelectItem>
                          ))}
                        </Select>
                      )}
                    />
                  </div>

                  {/* HPP + Harga Jual */}
                  <div className="grid grid-cols-2 gap-3">
                    <Controller
                      name="hpp"
                      control={form.control}
                      render={({ field }) => (
                        <FormattedNumberInput
                          label="HPP (Modal)"
                          placeholder="0"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          isDisabled={form.formState.isSubmitting}
                          isInvalid={!!form.formState.errors.hpp}
                          errorMessage={form.formState.errors.hpp?.message}
                          startContent={
                            <span className="text-default-400 text-sm">Rp</span>
                          }
                        />
                      )}
                    />
                    <Controller
                      name="hargaJual"
                      control={form.control}
                      render={({ field }) => (
                        <FormattedNumberInput
                          label="Harga Jual"
                          placeholder="0"
                          isRequired
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          isDisabled={form.formState.isSubmitting}
                          isInvalid={!!form.formState.errors.hargaJual}
                          errorMessage={
                            form.formState.errors.hargaJual?.message
                          }
                          startContent={
                            <span className="text-default-400 text-sm">Rp</span>
                          }
                        />
                      )}
                    />
                  </div>

                  {/* Stok + Min Stok */}
                  <div className="grid grid-cols-2 gap-3">
                    <Controller
                      name="stok"
                      control={form.control}
                      render={({ field }) => (
                        <FormattedNumberInput
                          label="Stok Awal"
                          placeholder="0"
                          isRequired
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          isDisabled={form.formState.isSubmitting}
                          isInvalid={!!form.formState.errors.stok}
                          errorMessage={form.formState.errors.stok?.message}
                        />
                      )}
                    />
                    <Controller
                      name="minStok"
                      control={form.control}
                      render={({ field }) => (
                        <FormattedNumberInput
                          label="Min. Stok"
                          placeholder="0"
                          isRequired
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          isDisabled={form.formState.isSubmitting}
                          isInvalid={!!form.formState.errors.minStok}
                          errorMessage={form.formState.errors.minStok?.message}
                        />
                      )}
                    />
                  </div>

                  {/* Tipe: Produk / Jasa */}
                  <Controller
                    name="isService"
                    control={form.control}
                    render={({ field }) => (
                      <Switch
                        isSelected={field.value}
                        onValueChange={field.onChange}
                        isDisabled={form.formState.isSubmitting}
                        size="sm"
                      >
                        <span className="text-sm">
                          {field.value
                            ? "Jasa (tidak ada stok fisik)"
                            : "Produk fisik"}
                        </span>
                      </Switch>
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
                  Tambah
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
