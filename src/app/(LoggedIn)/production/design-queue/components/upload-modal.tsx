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
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { Upload } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: () => void;
}

export function UploadModal({
  isOpen,
  onClose,
  orderId,
  onSuccess,
}: UploadModalProps) {
  const [nama, setNama] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleClose() {
    setNama("");
    setFile(null);
    onClose();
  }

  async function handleUpload() {
    if (!file || !nama.trim()) {
      addToast({ title: "Lengkapi nama dan pilih file.", color: "warning" });
      return;
    }
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("nama", nama.trim());
      fd.append("file", file);
      const res = await fetch(`/api/order/${orderId}/design-files`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        addToast({
          title: "Gagal upload",
          description: json.error,
          color: "danger",
        });
        return;
      }
      addToast({ title: "File berhasil diupload", color: "success" });
      onSuccess();
      handleClose();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <ModalContent>
        <ModalHeader className="text-sm">Upload File Desain</ModalHeader>
        <ModalBody className="gap-4">
          <Input
            label="Nama File"
            placeholder="contoh: Desain Kaos Final v2"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            size="sm"
          />
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.ai,.eps,.psd,.zip"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button
              variant="flat"
              size="sm"
              className="w-full"
              onPress={() => fileInputRef.current?.click()}
              startContent={<Upload size={14} />}
            >
              {file ? file.name : "Pilih File"}
            </Button>
            {file && (
              <p className="text-xs text-default-400 mt-1.5 text-center">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
          <p className="text-xs text-default-400">
            Format: JPG, PNG, PDF, AI, PSD, ZIP · Maks 10 MB
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            size="sm"
            variant="flat"
            onPress={handleClose}
            isDisabled={isLoading}
          >
            Batal
          </Button>
          <Button
            size="sm"
            color="primary"
            onPress={handleUpload}
            isLoading={isLoading}
            isDisabled={!file || !nama.trim()}
          >
            Upload
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
