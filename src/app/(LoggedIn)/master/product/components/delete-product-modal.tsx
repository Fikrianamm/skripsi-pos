import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Trash2 } from "lucide-react";
import { Alert } from "@heroui/alert";
import { Tooltip } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { Product } from "@/types/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

export default function DeleteProductModal({
  product,
  onProductDeleted,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  product: Product;
  onProductDeleted?: () => void;
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

  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete(onClose: () => void) {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/product/${product.id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        addToast({
          title: "Gagal",
          description: json.error || "Terjadi kesalahan.",
          color: "danger",
        });
        return;
      }

      addToast({
        title: "Berhasil",
        description: "Produk berhasil dihapus.",
        color: "success",
      });
      onClose();
      onProductDeleted?.();
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
    <>
      {controlledIsOpen === undefined && (
        <Tooltip content="Hapus Produk">
          <Button
            color="danger"
            variant="light"
            onPress={onOpen}
            size="sm"
            isIconOnly
          >
            <Trash2 size={16} />
          </Button>
        </Tooltip>
      )}
      <Modal
        isOpen={isOpen}
        placement="bottom-center"
        onOpenChange={onOpenChange}
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-2">
                Hapus Produk
                <span className="flex items-center gap-2 font-medium text-base text-slate-500">
                  <Avatar className="size-6 rounded-sm">
                    <AvatarImage src={product.image || ""} alt={product.nama} />
                    <AvatarFallback className="rounded-sm text-[10px]">
                      {product.sku.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {product.nama}
                </span>
              </ModalHeader>
              <ModalBody className="gap-3">
                <Alert color="danger" title="Konfirmasi Penghapusan">
                  <p className="mb-2">
                    Data produk ini akan dipindahkan ke <strong>Tempat Sampah</strong>.
                    Anda masih dapat memulihkannya nanti jika diperlukan.
                  </p>
                  <ul className="list-disc list-inside text-sm">
                    <li>Produk tidak akan muncul lagi di daftar aktif.</li>
                    <li>Data terkait pada riwayat Order akan tetap tersimpan namun ditandai sebagai produk terhapus.</li>
                  </ul>
                </Alert>
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 shrink-0 mt-0.5"><rect width="20" height="5" x="2" y="3" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" /></svg>
                  <p className="text-xs text-blue-700">
                    Data dipindahkan ke <strong>Sampah</strong> dan bisa dipulihkan kembali.
                  </p>
                </div>
                <div className="flex items-start gap-2 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning-600 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  <p className="text-xs text-warning-700">
                    Jika produk masih dibutuhkan sebagai referensi historis,
                    sebaiknya simpan di arsip daripada dihapus permanen.
                  </p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="flat" onPress={onClose}>
                  Batal
                </Button>
                <Button
                  color="danger"
                  onPress={() => handleDelete(onClose)}
                  isDisabled={isDeleting}
                  isLoading={isDeleting}
                >
                  Pindahkan ke Sampah
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
