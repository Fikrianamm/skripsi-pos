"use client";

import { Button, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { FileText } from "lucide-react";
import { DesignFile } from "./types";

interface DesignFilesCardProps {
  files: DesignFile[];
}

export function DesignFilesCard({ files }: DesignFilesCardProps) {
  if (files.length === 0) return null;

  return (
    <Card shadow="none" className="border border-default-200">
      <CardHeader className="pb-1 pt-4 px-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-default-700">
          File Desain
        </span>
        <span className="text-xs text-default-400">{files.length} file</span>
      </CardHeader>
      <Divider />
      <CardBody className="p-3 gap-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 p-2.5 rounded-lg border border-default-100 hover:border-primary/30 hover:bg-default-50 transition-colors"
          >
            <FileText size={18} className="text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.nama}</p>
              {file.uploadedBy && (
                <p className="text-xs text-default-400">
                  Upload oleh {file.uploadedBy.name} ·{" "}
                  {new Date(file.createdAt).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="flat"
              color="primary"
              as="a"
              href={file.filePath}
              target="_blank"
            >
              Lihat
            </Button>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
