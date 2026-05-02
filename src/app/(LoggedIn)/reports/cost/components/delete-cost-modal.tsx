import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Trash2, Receipt } from "lucide-react";
import { Alert } from "@heroui/alert";
import { Tooltip } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { useState } from "react";
import { CostData } from "./cost-table";
import { formatRupiah } from "@/lib/func";

export function DeleteCostModal({
  cost,
  onSuccess,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  cost: CostData;
  onSuccess?: () => void;
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
      const res = await fetch(`/api/finance/cost?id=${cost.id}`, {
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
        description: "Data pengeluaran berhasil dipindahkan ke sampah.",
        color: "success",
      });
      onClose();
      onSuccess?.();
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
        <Tooltip content="Hapus Pengeluaran">
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
                Hapus Pengeluaran
                <span className="flex items-center gap-2 font-medium text-base text-slate-500">
                  <div className="p-1.5 rounded-lg bg-default-100 text-default-500">
                    <Receipt size={16} />
                  </div>
                  {cost.nama} - {formatRupiah(Number(cost.nominal))}
                </span>
              </ModalHeader>
              <ModalBody>
                <Alert color="danger" title="Konfirmasi Penghapusan">
                  <p className="mb-2">
                    Data pengeluaran ini akan dipindahkan ke <strong>Tempat Sampah</strong>.
                    Anda masih dapat memulihkannya nanti jika diperlukan.
                  </p>
                  <ul className="list-disc list-inside text-sm">
                    <li>Data Jurnal Umum terkait akan ikut dibatalkan (soft-delete).</li>
                    <li>Laporan Keuangan akan diperbarui secara otomatis.</li>
                  </ul>
                </Alert>
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
