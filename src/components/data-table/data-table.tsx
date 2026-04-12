import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
} from "@heroui/table";
import { Spinner } from "@heroui/react";
import type { Selection } from "@heroui/react";

export type ColumnDef = {
  key: string;
  label: React.ReactNode;
  className?: string;
};

// Use a relaxed constraint since all app types have `id?: string`
type WithId = { id?: string };

interface DataTableProps<T extends WithId> {
  columns: ColumnDef[];
  items: T[];
  isLoading: boolean;
  /**
   * Must return a full <TableRow key={item.id}> with <TableCell> as direct children.
   * Do NOT wrap cells in a fragment — HeroUI counts top-level children as cells.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderRow: (item: T) => any;
  selectionMode?: "none" | "single" | "multiple";
  selectedKeys?: Selection;
  onSelectionChange?: (keys: Selection) => void;
  emptyContent?: string;
}

export { TableRow };

export function DataTable<T extends WithId>({
  columns,
  items,
  isLoading,
  renderRow,
  selectionMode = "multiple",
  selectedKeys,
  onSelectionChange,
  emptyContent = "Tidak ada data",
}: DataTableProps<T>) {
  return (
    <div className="w-full max-w-full overflow-x-auto flex-1">
      <Table
        aria-label="Data table"
        selectionMode={selectionMode}
        color="primary"
        onSelectionChange={onSelectionChange}
        selectedKeys={selectedKeys}
        removeWrapper
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key} className={column.className}>
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          emptyContent={emptyContent}
          items={items}
          loadingContent={
            <div className="flex flex-col items-center gap-2 text-default-400">
              <Spinner />
              <p>Memuat data...</p>
            </div>
          }
          loadingState={isLoading ? "loading" : "idle"}
        >
          {renderRow}
        </TableBody>
      </Table>
    </div>
  );
}
