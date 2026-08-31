/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { PenLine, ImagePlus, X, Trash2, Plus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useWatch, useFieldArray } from "react-hook-form";
import { editProductSchema, type EditProductFormData } from "@/lib/schemas";
import { useRef, useState } from "react";
import { Alert } from "@heroui/alert";
import { Select, SelectItem, Switch, Tooltip } from "@heroui/react";
import { addToast } from "@heroui/toast";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
import { Product, Category, Unit } from "@/types/types";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";

export default function EditProductModal({
  product,
  onProductUpdated,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  product: Product;
  onProductUpdated?: () => void;
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

  const [globalError, setGlobalError] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>(product.image || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categoryData } = useSWR(`/api/category?limit=100`, fetcher);
  const categories = categoryData?.results ?? [];

  const { data: unitData } = useSWR(`/api/unit?limit=100`, fetcher);
  const units = unitData?.results ?? [];

  const form = useForm<EditProductFormData>({
    resolver: zodResolver(editProductSchema),
    mode: "onBlur",
    defaultValues: {
      nama: product.nama,
      sku: product.sku,
      categoryId: product.category?.id ?? "",
      unitId: product.unit?.id ?? "",
      hpp: Number(product.hpp) ?? 0,
      hargaJual: Number(product.hargaJual) ?? 0,
      stok: Number(product.stok) ?? 0,
      minStok: Number(product.minStok) ?? 0,
      isService: product.isService,
      image: product.image || "",
      bahanBakuList: product.bahanBakuList?.map((bb) => ({
        bahanBakuId: bb.bahanBakuId,
        jumlahButuh: Number(bb.jumlahButuh),
      })) || [],
    },
  });

  const { fields: bomFields, append: appendBom, remove: removeBom } = useFieldArray({
    control: form.control,
    name: "bahanBakuList",
  });

  const { data: bbData } = useSWR(`/api/admin/bahan-baku?limit=100`, fetcher);
  const bahanBakus = bbData?.results ?? [];

  const isService = useWatch({ control: form.control, name: "isService" });

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast({ title: "File terlalu besar", description: "Maksimal 5MB", color: "danger" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    form.setValue("image", "__pending__");
  }

  function handleRemoveImage() {
    setImagePreview("");
    setImageFile(null);
    form.setValue("image", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function resetForm() {
    form.reset({
      nama: product.nama,
      sku: product.sku,
      categoryId: product.category?.id ?? "",
      unitId: product.unit?.id ?? "",
      hpp: Number(product.hpp) ?? 0,
      hargaJual: Number(product.hargaJual) ?? 0,
      stok: Number(product.stok) ?? 0,
      minStok: Number(product.minStok) ?? 0,
      isService: product.isService,
      image: product.image || "",
      bahanBakuList: product.bahanBakuList?.map((bb) => ({
        bahanBakuId: bb.bahanBakuId,
        jumlahButuh: Number(bb.jumlahButuh),
      })) || [],
    });
    setImagePreview(product.image || "");
    setImageFile(null);
    setGlobalError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(data: EditProductFormData, onClose: () => void) {
    setGlobalError("");
    try {
      let imageUrl: string | null = imagePreview && !imageFile ? imagePreview : null;

      // Upload new image to S3 if file was selected
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

      const res = await fetch(`/api/admin/product/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, image: imageUrl }),
      });

      const json = await res.json();

      if (!res.ok) {
        setGlobalError(json.error || "Terjadi kesalahan.");
        return;
      }

      addToast({
        title: "Berhasil",
        description: "Produk berhasil diperbarui.",
        color: "success",
      });

      onClose();
      onProductUpdated?.();
    } catch {
      setGlobalError("Terjadi kesalahan jaringan.");
    }
  }

  return (
    <>
      {controlledIsOpen === undefined && (
        <Tooltip content="Edit Produk">
          <Button variant="light" size="sm" onPress={onOpen} isIconOnly>
            <PenLine size={16} />
          </Button>
        </Tooltip>
      )}

      <Modal
        isOpen={isOpen}
        placement="bottom-center"
        scrollBehavior="inside"
        size="xl"
        onOpenChange={(open) => {
          onOpenChange(open);
          if (!open) resetForm();
        }}
      >
        <ModalContent>
          {(onClose) => (
            <form
              className="contents"
              noValidate
              onSubmit={form.handleSubmit((data) => onSubmit(data, onClose))}
            >
              <ModalHeader className="flex flex-col">
                Edit Produk
                <span className="block font-normal text-base text-slate-500">
                  {product.sku}
                </span>
              </ModalHeader>

              <ModalBody>
                {globalError && <Alert color="danger" title={globalError} />}

                <div className="grid gap-4 grid-cols-2">
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
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imagePreview}
                            alt="preview"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-default-400">
                            <ImagePlus size={24} />
                            <span className="text-[10px]">Pilih foto</span>
                          </div>
                        )}
                      </button>
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
                            <SelectItem key={c.id!}>{c.nama}</SelectItem>
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
                            <SelectItem key={u.id!}>{u.nama}</SelectItem>
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
                          label="Stok"
                          placeholder="0"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          isDisabled={form.formState.isSubmitting || isService}
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
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          isDisabled={form.formState.isSubmitting || isService}
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
                        isSelected={field.value ?? false}
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

                  {/* Resep BOM (Bahan Baku) - Hanya muncul jika BUKAN Jasa */}
                  {!isService && (
                    <div className="flex flex-col gap-2 mt-2 border border-default-200 rounded-md p-3 bg-default-50/50 col-span-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold">Resep Bahan Baku (BOM)</span>
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          onPress={() => appendBom({ bahanBakuId: "", jumlahButuh: 0 })}
                          startContent={<Plus size={14} />}
                        >
                          Tambah Bahan
                        </Button>
                      </div>
                      
                      {bomFields.length === 0 ? (
                        <p className="text-xs text-default-400 text-center py-2">
                          Tidak ada bahan baku yang diatur. Otomatisasi pemotongan bahan baku tidak akan berjalan untuk produk ini.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {bomFields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 items-start">
                              <div className="flex-1">
                                <Controller
                                  name={`bahanBakuList.${index}.bahanBakuId`}
                                  control={form.control}
                                  render={({ field: bbField }) => (
                                    <Select
                                      aria-label="Pilih bahan baku"
                                      placeholder="Pilih Bahan Baku"
                                      size="sm"
                                      isRequired
                                      selectedKeys={bbField.value ? [bbField.value] : []}
                                      onSelectionChange={(keys) => bbField.onChange(Array.from(keys)[0] as string)}
                                      isInvalid={!!form.formState.errors.bahanBakuList?.[index]?.bahanBakuId}
                                      errorMessage={form.formState.errors.bahanBakuList?.[index]?.bahanBakuId?.message}
                                    >
                                      {bahanBakus.map((b: any) => (
                                        <SelectItem key={b.id} textValue={`${b.nama} (${b.unit?.nama || "-"})`}>
                                          <div className="flex justify-between items-center">
                                            <span>{b.nama}</span>
                                            <span className="text-xs text-default-400">{b.unit?.nama}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </Select>
                                  )}
                                />
                              </div>
                              <div className="w-[120px]">
                                <Controller
                                  name={`bahanBakuList.${index}.jumlahButuh`}
                                  control={form.control}
                                  render={({ field: qtyField }) => (
                                    <FormattedNumberInput
                                      aria-label="Jumlah butuh"
                                      placeholder="Jumlah"
                                      size="sm"
                                      isRequired
                                      value={qtyField.value}
                                      onChange={qtyField.onChange}
                                      onBlur={qtyField.onBlur}
                                      isInvalid={!!form.formState.errors.bahanBakuList?.[index]?.jumlahButuh}
                                      errorMessage={form.formState.errors.bahanBakuList?.[index]?.jumlahButuh?.message}
                                    />
                                  )}
                                />
                              </div>
                              <Button
                                isIconOnly
                                color="danger"
                                variant="light"
                                size="sm"
                                onPress={() => removeBom(index)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
