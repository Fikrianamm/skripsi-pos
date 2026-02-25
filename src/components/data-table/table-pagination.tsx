import { Pagination } from "@heroui/react";

interface TablePaginationProps {
  page: number;
  total: number;
  onChange: (page: number) => void;
}

export function TablePagination({
  page,
  total,
  onChange,
}: TablePaginationProps) {
  if (total <= 0) return null;

  return (
    <div className="flex w-full justify-center">
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
  );
}
