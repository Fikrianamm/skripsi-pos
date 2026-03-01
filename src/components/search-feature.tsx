"use client";

import { Modal, ModalContent, ModalBody, useDisclosure } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Search, X } from "lucide-react";
import { Kbd } from "@heroui/kbd";
import { Input } from "@heroui/input";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { NAV_ITEMS } from "@/config/navigation";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LucideIcon } from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  items?: { title: string; url: string }[];
}

interface FlatNavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  groupLabel: string;
  parentTitle?: string;
}

interface GroupedNavItems {
  [key: string]: FlatNavItem[];
}

export default function SearchFeature() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Flatten navigation items for search with group info
  const flatNavItems = useMemo(() => {
    const items: FlatNavItem[] = [];

    NAV_ITEMS.forEach((group) => {
      group.items.forEach((item: NavItem) => {
        // Add parent item if it has a valid URL (standalone items like Dashboard)
        if (item.url !== "#") {
          items.push({
            title: item.title,
            url: item.url,
            icon: item.icon,
            groupLabel: item.title,
          });
        }

        // Add sub-items with parent as group
        if (item.items) {
          item.items.forEach((subItem) => {
            items.push({
              title: subItem.title,
              url: subItem.url,
              icon: item.icon,
              groupLabel: item.title,
              parentTitle: item.title,
            });
          });
        }
      });
    });

    return items;
  }, []);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return flatNavItems;

    const lowerQuery = query.toLowerCase();
    return flatNavItems.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.groupLabel.toLowerCase().includes(lowerQuery),
    );
  }, [query, flatNavItems]);

  // Group filtered items by their group label
  const groupedItems = useMemo(() => {
    const groups: GroupedNavItems = {};

    filteredItems.forEach((item) => {
      if (!groups[item.groupLabel]) {
        groups[item.groupLabel] = [];
      }
      groups[item.groupLabel].push(item);
    });

    return groups;
  }, [filteredItems]);

  // Handle query change and reset selected index
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setSelectedIndex(0);
  }, []);

  // Handle modal open/close state change
  const handleOpenChange = useCallback(
    (open: boolean) => {
      onOpenChange();
      if (!open) {
        setQuery("");
        setSelectedIndex(0);
      }
    },
    [onOpenChange],
  );

  const handleNavigation = useCallback(
    (url: string) => {
      router.push(url);
      onClose();
    },
    [router, onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : prev,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleNavigation(filteredItems[selectedIndex].url);
        }
      }
    },
    [filteredItems, selectedIndex, handleNavigation],
  );

  useHotkeys("k", { ctrl: true }, () => {
    onOpen();
  });

  return (
    <>
      <Button
        onPress={onOpen}
        variant="light"
        className="border border-gray-200 hover:text-slate-900 text-slate-600 sm:w-48 w-auto sm:justify-between"
      >
        <div className="flex items-center gap-2">
          <Search size={16} />
          <span>Cari</span>
        </div>
        <Kbd>Ctrl + K</Kbd>
      </Button>
      <Modal
        isOpen={isOpen}
        size="lg"
        scrollBehavior="inside"
        onOpenChange={handleOpenChange}
        hideCloseButton
      >
        <ModalContent>
          <div className="flex items-center gap-2 p-4 border-b border-divider">
            <Input
              autoFocus
              placeholder="Cari menu navigasi..."
              value={query}
              onValueChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              startContent={<Search size={18} className="text-default-400" />}
              classNames={{
                input: "text-base",
                inputWrapper: "h-12",
              }}
            />
            <Button
              isIconOnly
              variant="light"
              onPress={onClose}
              className="shrink-0 sm:hidden"
            >
              <X size={20} />
            </Button>
          </div>
          <ModalBody className="p-2 max-h-[400px]">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-default-400">
                <Search size={48} className="mb-2 opacity-50" />
                <p>Tidak ada hasil untuk &quot;{query}&quot;</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {Object.entries(groupedItems).map(([groupLabel, items]) => {
                  const GroupIcon = items[0]?.icon;
                  return (
                    <div key={groupLabel} className="flex flex-col gap-1">
                      {/* Group Header */}
                      <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-default-500 uppercase tracking-wide">
                        {GroupIcon && <GroupIcon size={14} />}
                        <span>{groupLabel}</span>
                      </div>
                      {/* Group Items */}
                      {items.map((item) => {
                        const globalIndex = filteredItems.indexOf(item);
                        return (
                          <button
                            key={`${item.url}-${globalIndex}`}
                            onClick={() => handleNavigation(item.url)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`flex items-center gap-3 px-3 py-2 ml-4 rounded-lg text-left transition-colors ${
                              globalIndex === selectedIndex
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-default-100"
                            }`}
                          >
                            <span className="font-medium">{item.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </ModalBody>
          <div className="hidden sm:flex items-center gap-4 px-4 py-3 border-t border-divider text-xs text-default-400">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span>navigasi</span>
            </span>
            <span className="flex items-center gap-1">
              <Kbd>Enter</Kbd>
              <span>pilih</span>
            </span>
            <span className="flex items-center gap-1">
              <Kbd>Esc</Kbd>
              <span>tutup</span>
            </span>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}
