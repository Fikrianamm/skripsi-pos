import React from "react";

interface BulkSelectionBarProps {
  count: number;
  label?: string;
  children?: React.ReactNode;
}

export function BulkSelectionBar({
  count,
  label = "item dipilih",
  children,
}: BulkSelectionBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary-50 border border-primary-200">
      <span className="text-sm font-medium text-primary">
        {count} {label}
      </span>
      {children}
    </div>
  );
}
