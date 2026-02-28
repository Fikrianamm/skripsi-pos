"use client";
import React from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Button } from "@heroui/button";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import type { Selection } from "@heroui/react";

export type FilterItem = {
  key: string;
  label: string;
  startContent?: React.ReactNode;
};

interface FilterDropdownProps {
  label: string;
  icon?: React.ReactNode;
  items: FilterItem[];
  selectedKeys: Selection;
  selectedLabel: string;
  onSelectionChange: (keys: Selection) => void;
  onReset: () => void;
  showReset?: boolean;
}

export function FilterDropdown({
  label,
  icon,
  items,
  selectedKeys,
  selectedLabel,
  onSelectionChange,
  onReset,
  showReset = true,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="flex flex-row gap-2 items-center">
      <Dropdown isOpen={isOpen} onOpenChange={setIsOpen}>
        <DropdownTrigger>
          <Button
            className="capitalize border-1"
            variant="bordered"
            endContent={
              isOpen ? (
                <ChevronUp size={14} className="text-slate-500" />
              ) : (
                <ChevronDown size={14} className="text-slate-500" />
              )
            }
          >
            <div className="flex items-center gap-2">
              {icon && <span className="text-slate-500">{icon}</span>}
              {label}
              <span className="text-slate-300">|</span>
              <span className="text-primary font-medium">{selectedLabel}</span>
            </div>
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          disallowEmptySelection
          aria-label={label}
          selectedKeys={selectedKeys}
          selectionMode="single"
          variant="flat"
          onSelectionChange={onSelectionChange}
        >
          {items.map((item) => (
            <DropdownItem key={item.key} startContent={item.startContent}>
              {item.label}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
      {showReset && selectedLabel !== "Semua" && (
        <Button
          variant="bordered"
          startContent={<X size={16} />}
          onClick={onReset}
          className="hidden lg:flex"
        >
          Reset
        </Button>
      )}
    </div>
  );
}
