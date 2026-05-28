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
import { Upload, Link } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: () => void;
}

type InputMode = "file" | "url";

export function UploadModal({
  isOpen,
  onClose,
  orderId,
  onSuccess,
}: UploadModalProps) {
  const [nama, setNama] = React.useState("");
  const [inputMode, setInputMode] = React.useState<InputMode>("file");
  const [file, setFile] = React.useState<File | null>(null);
  const [fileUrl, setFileUrl] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleClose() {
    setNama("");
    setFile(null);
    setFileUrl("");
    setInputMode("file");
    onClose();
  }

  function isValidUrl(url: string) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  async function handleUpload() {
    if (!nama.trim()) {
      addToast({ title: "Nama file wajib diisi.", color: "warning" });
      return;
    }

    if (inputMode === "file" && !file) {
      addToast({ title: "Pilih file terlebih dahulu.", color: "warning" });
      return;
    }

    if (inputMode === "url") {
      if (!fileUrl.trim()) {
        addToast({ title: "URL file wajib diisi.", color: "warning" });
        return;
      }
      if (!isValidUrl(fileUrl.trim())) {
        addToast({ title: "Format URL tidak valid.", color: "warning" });
        return;
      }
    }

    setIsLoading(true);
    try {
      let res: Response;

      if (inputMode === "file") {
        const fd = new FormData();
        fd.append("nama", nama.trim());
        fd.append("file", file!);
        res = await fetch(`/api/order/${orderId}/design-files`, {
          method: "POST",
          body: fd,
        });
      } else {
        res = await fetch(`/api/order/${orderId}/design-files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nama: nama.trim(), fileUrl: fileUrl.trim() }),
        });
      }

      const json = await res.json();
      if (!res.ok) {
        addToast({
          title: "Gagal menyimpan file",
          description: json.error,
          color: "danger",
        });
        return;
      }
      addToast({ title: "File berhasil disimpan", color: "success" });
      onSuccess();
      handleClose();
    } finally {
      setIsLoading(false);
    }
  }

  const isSubmitDisabled =
    !nama.trim() ||
    (inputMode === "file" ? !file : !fileUrl.trim()) ||
    isLoading;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <ModalContent>
        <ModalHeader className="text-sm">Upload File Desain</ModalHeader>
        <ModalBody className="gap-4">
          {/* Input Nama */}
          <Input
            label="Nama File"
            placeholder="contoh: Desain Kaos Final v2"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            size="sm"
          />

          {/* Mode Toggle */}
          <div className="flex gap-1 p-1 bg-default-100 rounded-xl">
            <Button
              size="sm"
              variant={inputMode === "file" ? "solid" : "flat"}
              color={inputMode === "file" ? "primary" : "default"}
              className="flex-1 h-7 text-xs"
              onPress={() => setInputMode("file")}
              startContent={<Upload size={12} />}
            >
              Upload File
            </Button>
            <Button
              size="sm"
              variant={inputMode === "url" ? "solid" : "flat"}
              color={inputMode === "url" ? "primary" : "default"}
              className="flex-1 h-7 text-xs"
              onPress={() => setInputMode("url")}
              startContent={<Link size={12} />}
            >
              Link URL
            </Button>
          </div>

          {/* Conditional Input */}
          {inputMode === "file" ? (
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
              <p className="text-xs text-default-400 mt-2">
                Format: JPG, PNG, PDF, AI, PSD, ZIP · Maks 10 MB
              </p>
            </div>
          ) : (
            <div>
              <Input
                label="URL File / Link Drive"
                placeholder="https://drive.google.com/... atau URL file lainnya"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                size="sm"
                startContent={<Link size={14} className="text-default-400 shrink-0" />}
                description="Tempel link Google Drive, Dropbox, atau URL file langsung"
              />
            </div>
          )}
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
            isDisabled={isSubmitDisabled}
          >
            {inputMode === "file" ? "Upload" : "Simpan Link"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
