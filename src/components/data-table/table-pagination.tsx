import { Pagination, Select, SelectItem } from "@heroui/react";

export const LIMIT_OPTIONS = [10, 25, 50, 100] as const;
export type LimitOption = (typeof LIMIT_OPTIONS)[number];

interface TablePaginationProps {
  page: number;
  total: number;
  onChange: (page: number) => void;
  limit?: number;
  onLimitChange?: (limit: number) => void;
  totalItems?: number; // total count of all records (optional, for display)
}

export function TablePagination({
  page,
  total,
  onChange,
  limit,
  onLimitChange,
  totalItems,
}: TablePaginationProps) {
  const showLimitSelect = !!onLimitChange;

  if (!showLimitSelect && total <= 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      {/* Limit selector */}
      {showLimitSelect && (
        <div className="flex items-center gap-2 text-sm text-default-500">
          <span className="text-xs shrink-0">Tampilkan</span>
          <Select
            size="sm"
            selectedKeys={[String(limit ?? 10)]}
            onSelectionChange={(keys) => {
              const val = Number(Array.from(keys)[0]);
              if (!isNaN(val)) {
                onLimitChange(val);
                onChange(1); // reset ke halaman 1 saat limit berubah
              }
            }}
            aria-label="Jumlah baris per halaman"
            className="w-20"
            classNames={{ trigger: "h-7 min-h-7 text-xs" }}
          >
            {LIMIT_OPTIONS.map((opt) => (
              <SelectItem key={String(opt)} textValue={String(opt)}>
                {opt}
              </SelectItem>
            ))}
          </Select>
          <span className="text-xs shrink-0">
            per halaman
            {totalItems !== undefined && (
              <> · {totalItems.toLocaleString("id-ID")} total</>
            )}
          </span>
        </div>
      )}

      {/* Pagination buttons */}
      {total > 1 && (
        <div className={showLimitSelect ? "" : "flex w-full justify-center"}>
          <Pagination
            isCompact
            showControls
            showShadow
            color="primary"
            page={page}
            total={total}
            onChange={onChange}
          />
        </div>
      )}

      {/* Spacer when no limit select but pagination exists */}
      {!showLimitSelect && total > 1 && <div />}
    </div>
  );
}
