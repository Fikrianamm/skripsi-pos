"use client";

import { Chip } from "@heroui/react";
import { getStatusProduksiBadge } from "../../components/order-badges";

const STEPS = [
  "PENDING",
  "DESAIN",
  "PRODUKSI",
  "PACKING",
  "SELESAI",
];

export function ProduksiProgress({ current }: { current: string }) {
  if (current === "BATAL") {
    return (
      <div className="flex items-center gap-2">
        <Chip size="sm" color="danger" variant="solid">
          BATAL
        </Chip>
        <span className="text-xs text-danger">Pesanan dibatalkan</span>
      </div>
    );
  }

  const currentIdx = STEPS.indexOf(current);

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {STEPS.map((step, idx) => {
        const badge = getStatusProduksiBadge(step);
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={step} className="flex items-center">
            <Chip
              size="sm"
              color={isCurrent ? badge.color : isDone ? "success" : "default"}
              variant={isCurrent ? "solid" : isDone ? "flat" : "bordered"}
              className={`text-xs transition-all ${
                isCurrent
                  ? "scale-105 font-semibold"
                  : isDone
                    ? "opacity-80"
                    : "opacity-30"
              }`}
            >
              {badge.label}
            </Chip>
            {idx < STEPS.length - 1 && (
              <span
                className={`mx-0.5 text-xs ${isDone ? "text-success" : "text-default-200"}`}
              >
                →
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
