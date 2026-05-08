"use client";

import React from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Button } from "@heroui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onConfirm: () => void;
  isLoading: boolean;
  confirmLabel: string;
  confirmColor?: "danger" | "primary" | "warning";
}

export function ConfirmModal({
  isOpen,
  onClose,
  title,
  description,
  onConfirm,
  isLoading,
  confirmLabel,
  confirmColor = "primary",
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalContent>
        <ModalHeader className="text-sm">{title}</ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-600">{description}</p>
        </ModalBody>
        <ModalFooter>
          <Button
            size="sm"
            variant="flat"
            onPress={onClose}
            isDisabled={isLoading}
          >
            Batal
          </Button>
          <Button
            size="sm"
            color={confirmColor}
            onPress={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
