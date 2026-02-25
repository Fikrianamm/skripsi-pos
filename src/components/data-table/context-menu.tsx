import React from "react";

export type ContextMenuAction = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "primary" | "destructive";
};

interface ContextMenuProps {
  x: number;
  y: number;
  actions: ContextMenuAction[];
}

const variantClass: Record<string, string> = {
  default: "hover:bg-accent",
  primary: "hover:bg-primary/10 text-primary",
  destructive: "hover:bg-destructive/10 text-destructive",
};

export function ContextMenu({ x, y, actions }: ContextMenuProps) {
  return (
    <div
      className="fixed z-50 min-w-[160px] rounded-lg border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
      style={{ top: y, left: x }}
    >
      {actions.map((action, i) => (
        <button
          key={i}
          className={`relative flex gap-2 w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none ${variantClass[action.variant ?? "default"]}`}
          onClick={action.onClick}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
}
