"use client";

import { fetcher } from "@/lib/func";
import useSWR from "swr";
import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Button,
  useDisclosure,
  Tooltip,
  Input,
  Spinner,
  Chip,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import {
  Package2,
  Plus,
  Pencil,
  Trash2,
  Tag,
  Ruler,
  Check,
  X,
} from "lucide-react";
import { addToast } from "@heroui/toast";

// Types
interface CategoryItem {
  id: string;
  nama: string;
  _count?: { products: number };
}

interface UnitItem {
  id: string;
  nama: string;
  _count?: { products: number };
}

// Inline Editable Row
function EditableRow({
  item,
  onSave,
  onCancel,
  isSaving,
}: {
  item: CategoryItem | UnitItem;
  onSave: (nama: string) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [value, setValue] = useState(item.nama);
  return (
    <div className="flex items-center gap-2">
      <Input
        size="sm"
        value={value}
        onValueChange={setValue}
        autoFocus
        className="flex-1"
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(value);
          if (e.key === "Escape") onCancel();
        }}
      />
      <Button
        isIconOnly
        size="sm"
        color="success"
        variant="flat"
        isLoading={isSaving}
        onPress={() => onSave(value)}
      >
        <Check size={14} />
      </Button>
      <Button
        isIconOnly
        size="sm"
        color="default"
        variant="flat"
        onPress={onCancel}
        isDisabled={isSaving}
      >
        <X size={14} />
      </Button>
    </div>
  );
}

// Delete Confirm Modal 
function DeleteConfirmModal({
  isOpen,
  onOpenChange,
  itemName,
  productCount,
  isDeleting,
  onConfirm,
}: {
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
  itemName: string;
  productCount?: number;
  isDeleting: boolean;
  onConfirm: (force: boolean) => void;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="bottom-center"
      backdrop="blur"
      size="sm"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="text-danger">
              Hapus &ldquo;{itemName}&rdquo;?
            </ModalHeader>
            <ModalBody>
              {(productCount ?? 0) > 0 ? (
                <p className="text-sm text-default-600">
                  Item ini digunakan oleh{" "}
                  <span className="font-semibold text-warning">
                    {productCount} produk
                  </span>
                  . Yakin ingin tetap menghapus?
                </p>
              ) : (
                <p className="text-sm text-default-600">
                  Tindakan ini tidak dapat dibatalkan. Yakin ingin menghapus?
                </p>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose} isDisabled={isDeleting}>
                Batal
              </Button>
              <Button
                color="danger"
                isLoading={isDeleting}
                onPress={() => onConfirm((productCount ?? 0) > 0)}
              >
                Hapus
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

// Section List (shared for category & unit)
function ManageSection({
  title,
  icon,
  items,
  isLoading,
  apiBase,
  onMutate,
  emptyLabel,
}: {
  title: string;
  icon: React.ReactNode;
  items: (CategoryItem | UnitItem)[];
  isLoading: boolean;
  apiBase: string; // e.g. "/api/category"
  onMutate: () => void;
  emptyLabel: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [addValue, setAddValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<
    (CategoryItem | UnitItem) | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();

  // Add
  async function handleAdd() {
    if (!addValue.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: addValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({
          title: "Gagal",
          description: data.error || "Terjadi kesalahan.",
          color: "danger",
        });
        return;
      }
      addToast({
        title: "Berhasil",
        description: "Item berhasil ditambahkan.",
        color: "success",
      });
      setAddValue("");
      setShowAddInput(false);
      onMutate();
    } catch {
      addToast({
        title: "Gagal",
        description: "Terjadi kesalahan jaringan.",
        color: "danger",
      });
    } finally {
      setIsAdding(false);
    }
  }

  // Edit 
  async function handleEdit(id: string, nama: string) {
    if (!nama.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${apiBase}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: nama.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({
          title: "Gagal",
          description: data.error || "Terjadi kesalahan.",
          color: "danger",
        });
        return;
      }
      addToast({
        title: "Berhasil",
        description: "Item berhasil diperbarui.",
        color: "success",
      });
      setEditingId(null);
      onMutate();
    } catch {
      addToast({
        title: "Gagal",
        description: "Terjadi kesalahan jaringan.",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  }

  // Delete
  function openDeleteModal(item: CategoryItem | UnitItem) {
    setDeleteTarget(item);
    onDeleteOpen();
  }

  async function handleDelete(force: boolean) {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const url = `${apiBase}/${deleteTarget.id}${force ? "?force=true" : ""}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        addToast({
          title: "Gagal",
          description: data.error || "Terjadi kesalahan.",
          color: "danger",
        });
        return;
      }
      addToast({
        title: "Berhasil",
        description: "Item berhasil dihapus.",
        color: "success",
      });
      onDeleteOpenChange();
      onMutate();
    } catch {
      addToast({
        title: "Gagal",
        description: "Terjadi kesalahan jaringan.",
        color: "danger",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-default-700 font-semibold text-sm">
          {icon}
          {title}
          <Chip size="sm" variant="flat" color={"primary"} className="text-xs">
            {items.length}
          </Chip>
        </div>
        <Button
          size="sm"
          variant="flat"
          color={"primary"}
          startContent={<Plus size={14} />}
          onPress={() => {
            setShowAddInput(true);
            setAddValue("");
          }}
        >
          Tambah
        </Button>
      </div>

      {/* Add Input */}
      {showAddInput && (
        <div className="flex items-center gap-2">
          <Input
            size="sm"
            placeholder={`Nama ${title.toLowerCase()}...`}
            value={addValue}
            onValueChange={setAddValue}
            autoFocus
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") {
                setShowAddInput(false);
                setAddValue("");
              }
            }}
          />
          <Button
            isIconOnly
            size="sm"
            color="success"
            variant="flat"
            isLoading={isAdding}
            onPress={handleAdd}
          >
            <Check size={14} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onPress={() => {
              setShowAddInput(false);
              setAddValue("");
            }}
            isDisabled={isAdding}
          >
            <X size={14} />
          </Button>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-1">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner size="sm" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-default-400 text-xs py-4">
            {emptyLabel}
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-2 px-3 py-2 rounded-medium hover:bg-default-100 transition-colors"
            >
              {editingId === item.id ? (
                <EditableRow
                  item={item}
                  onSave={(nama) => handleEdit(item.id, nama)}
                  onCancel={() => setEditingId(null)}
                  isSaving={isSaving}
                />
              ) : (
                <>
                  <span className="flex-1 text-sm text-default-800">
                    {item.nama}
                  </span>
                  {(item._count?.products ?? 0) > 0 && (
                    <Chip
                      size="sm"
                      variant="flat"
                      color="default"
                      className="text-xs"
                    >
                      {item._count!.products} produk
                    </Chip>
                  )}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip content="Edit">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="primary"
                        onPress={() => setEditingId(item.id)}
                      >
                        <Pencil size={13} />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Hapus">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => openDeleteModal(item)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </Tooltip>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onOpenChange={onDeleteOpenChange}
        itemName={deleteTarget?.nama ?? ""}
        productCount={deleteTarget?._count?.products}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// Main Drawer
export default function DrawerManageCategory() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const {
    data: categoryData,
    isLoading: isCategoryLoading,
    mutate: mutateCategory,
  } = useSWR(isOpen ? "/api/category?limit=200" : null, fetcher);

  const {
    data: unitData,
    isLoading: isUnitLoading,
    mutate: mutateUnit,
  } = useSWR(isOpen ? "/api/unit?limit=200" : null, fetcher);

  const categories: CategoryItem[] = categoryData?.results ?? [];
  const units: UnitItem[] = unitData?.results ?? [];

  return (
    <>
      <Button
        color="primary"
        variant="faded"
        onPress={onOpen}
        startContent={<Package2 size={16} />}
      >
        Kelola Kategori &amp; Satuan
      </Button>

      <Drawer
        hideCloseButton
        classNames={{
          base: "sm:data-[placement=right]:m-2 sm:data-[placement=left]:m-2 rounded-medium",
        }}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              {/* Header */}
              <DrawerHeader className="absolute top-0 inset-x-0 z-50 flex flex-row gap-2 px-2 py-2 border-b border-default-200/50 justify-start bg-content1/50 backdrop-blur-sm">
                <Tooltip content="Tutup">
                  <Button
                    isIconOnly
                    className="text-default-400"
                    size="sm"
                    variant="light"
                    onPress={onClose}
                  >
                    <svg
                      fill="none"
                      height="20"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="m13 17 5-5-5-5M6 17l5-5-5-5" />
                    </svg>
                  </Button>
                </Tooltip>
                <span className="font-semibold text-sm self-center">
                  Kelola Kategori &amp; Satuan
                </span>
              </DrawerHeader>

              {/* Body */}
              <DrawerBody className="pt-16 pb-6 flex flex-col gap-6">
                {/* Category Section */}
                <ManageSection
                  title="Kategori"
                  icon={<Tag size={15} />}
                  items={categories}
                  isLoading={isCategoryLoading}
                  apiBase="/api/category"
                  onMutate={() => mutateCategory()}
                  emptyLabel="Belum ada kategori."
                />

                <Divider />

                {/* Unit Section */}
                <ManageSection
                  title="Satuan"
                  icon={<Ruler size={15} />}
                  items={units}
                  isLoading={isUnitLoading}
                  apiBase="/api/unit"
                  onMutate={() => mutateUnit()}
                  emptyLabel="Belum ada satuan."
                />
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
