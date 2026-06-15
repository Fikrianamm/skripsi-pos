/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useRef, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/func";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Button,
  Textarea,
  Avatar,
  Spinner,
  Badge,
} from "@heroui/react";
import {
  Send,
  Paperclip,
  X,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { addToast } from "@heroui/toast";
import { DesignOrder } from "./types";

interface CommentFile {
  id: string;
  filePath: string;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
    role: string;
  };
  files: CommentFile[];
}

interface DesignDetailDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: DesignOrder;
  onMutate: () => void;
  currentUser: { id: string; role: string } | null;
}

function getFileIcon(filePath: string) {
  const ext = filePath.split(".").pop()?.toLowerCase();
  return ext === "pdf"
    ? "📄"
    : ext === "psd" || ext === "ai"
      ? "🎨"
      : ext === "zip"
        ? "📦"
        : "🖼️";
}

function isImage(filePath: string) {
  const ext = filePath.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(ext || "");
}

export function DesignDetailDrawer({
  isOpen,
  onOpenChange,
  order,
  onMutate,
  currentUser,
}: DesignDetailDrawerProps) {
  const { data, isLoading, mutate: mutateComments } = useSWR<{ comments: Comment[] }>(
    isOpen ? `/api/order/${order.id}/comments` : null,
    fetcher
  );

  const comments = React.useMemo(() => data?.comments ?? [], [data?.comments]);

  const [text, setText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat when new comments arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  // Mark comments as read when drawer is opened
  React.useEffect(() => {
    if (isOpen && order?.id && (order as any).hasUnreadComments) {
      fetch(`/api/order/${order.id}/comments/read`, { method: "PATCH" })
        .catch(console.error);
    }
  }, [isOpen, order?.id, order]);

  // Handle onMutate when drawer closes so the card doesn't vanish while open
  React.useEffect(() => {
    if (!isOpen && order?.id && (order as any).hasUnreadComments) {
       onMutate();
    }
  }, [isOpen, order?.id, order, onMutate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArr]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && selectedFiles.length === 0) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("text", text.trim());
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch(`/api/order/${order.id}/comments`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        addToast({
          title: "Gagal mengirim komentar",
          description: json.error,
          color: "danger",
        });
        return;
      }

      setText("");
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      mutateComments();
    } catch (err) {
      console.error(err);
      addToast({
        title: "Gagal mengirim komentar",
        description: "Terjadi kesalahan koneksi.",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="md"
      classNames={{
        base: "sm:data-[placement=right]:m-2 sm:data-[placement=left]:m-2 rounded-medium",
      }}
    >
      <DrawerContent>
        {() => (
          <div className="flex flex-col h-full bg-content1">
            {/* Header */}
            <DrawerHeader className="border-b border-default-100 flex flex-col gap-1 p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-bold text-primary">
                  {order.nomorOrder}
                </span>
                <Badge
                  color={
                    order.isDesignFinal
                      ? "success"
                      : order.designReviewStatus === "REVISI"
                        ? "danger"
                        : order.designReviewStatus === "PENDING_REVIEW"
                          ? "warning"
                          : "default"
                  }
                  variant="flat"
                  size="sm"
                >
                  {order.isDesignFinal
                    ? "ACC / Final"
                    : order.designReviewStatus === "REVISI"
                      ? "Perlu Revisi"
                      : order.designReviewStatus === "PENDING_REVIEW"
                        ? "Menunggu Review"
                        : "Proses"}
                </Badge>
              </div>
              <p className="text-xs text-default-500">
                Customer: <span className="font-medium text-default-700">{order.customer.nama}</span>
              </p>
            </DrawerHeader>

            {/* Content Body */}
            <DrawerBody className="p-0 flex flex-col flex-1 overflow-hidden">
              {/* Order Info & Items */}
              <div className="p-4 bg-default-50 border-b border-default-100 flex flex-col gap-2 shrink-0">
                <div className="flex flex-wrap gap-1">
                  {order.items.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-default-200/60 text-default-700 px-2 py-0.5 rounded-full"
                    >
                      {item.nama} ×{Number(item.qty)}
                    </span>
                  ))}
                </div>
                {order.catatan && (
                  <p className="text-xs text-default-500 italic bg-default-100/50 p-2 rounded-lg">
                    Catatan: {order.catatan}
                  </p>
                )}
              </div>

              {/* Banner Revisi */}
              {order.designReviewStatus === "REVISI" && !order.isDesignFinal && (
                <div className="mx-4 mt-3 p-3 bg-danger-50 border border-danger-200 rounded-xl flex items-start gap-2">
                  <AlertCircle size={14} className="text-danger-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-danger-700">Desain Memerlukan Revisi</p>
                    <p className="text-xs text-danger-600 mt-0.5">
                      Periksa komentar di bawah untuk detail revisian dari admin/kasir.
                    </p>
                  </div>
                </div>
              )}

              {/* Thread Chat Area */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 flex flex-col gap-4"
              >
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <Spinner size="sm" />
                    <span className="text-xs text-default-400">Memuat komentar...</span>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-default-400">
                    <MessageSquare size={36} strokeWidth={1.2} />
                    <p className="text-xs">Belum ada diskusi untuk antrean ini.</p>
                  </div>
                ) : (
                  comments.map((comment) => {
                    const isOwn = currentUser?.id === comment.user.id;
                    return (
                      <div
                        key={comment.id}
                        className={`flex gap-2 max-w-[85%] ${
                          isOwn ? "self-end flex-row-reverse" : "self-start"
                        }`}
                      >
                        <Avatar
                          src={comment.user.image || undefined}
                          name={comment.user.name.substring(0, 2).toUpperCase()}
                          size="sm"
                          className="shrink-0"
                        />
                        <div className="flex flex-col gap-1">
                          <div
                            className={`flex items-center gap-1.5 text-[10px] text-default-400 ${
                              isOwn ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span className="font-semibold text-default-600">
                              {comment.user.name}
                            </span>
                            <span className="bg-default-200 text-default-600 px-1 rounded scale-90">
                              {comment.user.role}
                            </span>
                            <span>
                              {new Date(comment.createdAt).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div
                            className={`p-3 rounded-xl text-sm ${
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : "bg-default-100 text-default-800 rounded-tl-none"
                            }`}
                          >
                            {comment.text && <p className="whitespace-pre-wrap">{comment.text}</p>}

                            {/* Attachments inside Chat */}
                            {comment.files.length > 0 && (
                              <div className="flex flex-col gap-1.5 mt-2">
                                {comment.files.map((file) => (
                                  <a
                                    key={file.id}
                                    href={file.filePath}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all ${
                                      isOwn
                                        ? "bg-primary-600/30 border-primary-400/30 text-primary-foreground hover:bg-primary-600/50"
                                        : "bg-default-200/50 border-default-300/30 text-default-800 hover:bg-default-200"
                                    }`}
                                  >
                                    <span className="text-base">{getFileIcon(file.filePath)}</span>
                                    <div className="flex-1 min-w-0">
                                      {isImage(file.filePath) ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                          src={file.filePath}
                                          alt="Preview"
                                          className="max-h-24 max-w-full rounded object-cover border border-default-300"
                                        />
                                      ) : (
                                        <span className="text-xs truncate block">
                                          Unduh Lampiran
                                        </span>
                                      )}
                                    </div>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendComment}
                className="p-3 border-t border-default-100 flex flex-col gap-2 bg-default-50 shrink-0"
              >
                {/* Selected File Previews */}
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-2">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 bg-default-200 px-2.5 py-1 rounded-full text-xs"
                      >
                        <span className="max-w-[120px] truncate">{file.name}</span>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="h-4 w-4 min-w-4 text-danger hover:bg-danger-100 rounded-full"
                          onPress={() => removeSelectedFile(idx)}
                        >
                          <X size={10} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 items-end">
                    <Button
                      isIconOnly
                      color="default"
                      variant="flat"
                      onPress={() => fileInputRef.current?.click()}
                      className="h-10 w-10 min-w-10 rounded-xl"
                    >
                      <Paperclip size={18} />
                    </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    className="hidden"
                  />
                  <Textarea
                    placeholder="Tulis komentar/revisi..."
                    minRows={1}
                    maxRows={4}
                    value={text}
                    onValueChange={setText}
                    className="flex-1"
                    classNames={{
                      input: "text-sm py-1.5",
                      inputWrapper: "bg-content1 border border-default-200 shadow-none rounded-xl",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendComment(e);
                      }
                    }}
                  />
                  <Button
                    isIconOnly
                    color="primary"
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={!text.trim() && selectedFiles.length === 0}
                    className="h-10 w-10 min-w-10 rounded-xl shrink-0"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </form>
            </DrawerBody>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
