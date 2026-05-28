"use client";

import { Button, Input, Tooltip } from "@heroui/react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { formatRupiah } from "@/lib/func";
import type { CartItem } from "./types";

interface CartItemRowProps {
  item: CartItem;
  onQtyChange: (qty: number) => void;
  onRemove: () => void;
}

export function CartItemRow({
  item,
  onQtyChange,
  onRemove,
}: CartItemRowProps) {
  return (
    <div className="flex flex-col gap-2 py-3 border-b border-default-100 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-default-800 truncate">
            {item.nama}
          </p>
          <p className="text-xs text-default-400">
            {formatRupiah(item.harga)} / {item.unit}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            color="default"
            className="min-w-7 h-7"
            onPress={() => onQtyChange(Math.max(1, item.qty - 1))}
          >
            <Minus size={12} />
          </Button>
          <Input
            size="sm"
            placeholder="Jumlah"
            value={item.qty.toString()}
            onValueChange={(value) => onQtyChange(parseInt(value) || 1)}
            variant="underlined"
            classNames={{ input: "text-xs", inputWrapper: "h-7 min-h-7 " }}
            type="number"
            className="w-10"
          />
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            color="primary"
            className="min-w-7 h-7"
            onPress={() => onQtyChange(item.qty + 1)}
          >
            <Plus size={12} />
          </Button>
          <Tooltip content="Hapus item">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              className="min-w-7 h-7 ml-1"
              onPress={onRemove}
            >
              <Trash2 size={12} />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <span className="text-sm font-semibold text-primary shrink-0">
          {formatRupiah(item.harga * item.qty)}
        </span>
      </div>
    </div>
  );
}
