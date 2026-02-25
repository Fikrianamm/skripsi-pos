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
import { useForm } from "react-hook-form";
import { Alert } from "@heroui/alert";
import { Tooltip } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { authClient } from "@/lib/auth-client";
import { User } from "@/types/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitialName } from "@/lib/func";

export default function DeleteUserModal({
  onUserDeleted,
  user,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  onUserDeleted?: () => void;
  user: User;
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

  const form = useForm({
    defaultValues: {
      userId: user.id,
    },
  });

  async function onSubmit(data: { userId: string }, onClose: () => void) {
    try {
      const { error } = await authClient.admin.removeUser({
        userId: data.userId,
      });

      if (error) {
        addToast({
          title: "Gagal",
          description: error.message || "Terjadi kesalahan.",
          color: "danger",
        });
        return;
      }

      addToast({
        title: "Berhasil",
        description: "Pengguna berhasil dihapus.",
        color: "success",
      });

      onClose();
      onUserDeleted?.();
    } catch {
      addToast({
        title: "Gagal",
        description: "Terjadi kesalahan jaringan.",
        color: "danger",
      });
    }
  }

  return (
    <>
      {controlledIsOpen === undefined && (
        <Tooltip content="Delete User">
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
            <form
              onSubmit={form.handleSubmit((data) =>
                onSubmit(data as { userId: string }, onClose),
              )}
            >
              <ModalHeader className="flex flex-col gap-2">
                Delete Pengguna
                <span className="flex items-center gap-2 font-medium text-base text-slate-500">
                  <Avatar className="size-6">
                    <AvatarImage src={user.image || ""} alt={user.name} />
                    <AvatarFallback>{getInitialName(user.name)}</AvatarFallback>
                  </Avatar>
                  {user.name}
                </span>
              </ModalHeader>
              <ModalBody>
                <Alert color="danger" title="Peringatan">
                  menghapus pengguna ini akan menghapus semua data yang terkait
                  dengannya
                </Alert>
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
                  Hapus
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
