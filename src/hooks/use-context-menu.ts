import React from "react";

export type ContextMenuState<T> = {
  x: number;
  y: number;
  item: T;
} | null;

export function useContextMenu<T>() {
  const [contextMenu, setContextMenu] =
    React.useState<ContextMenuState<T>>(null);

  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  const openMenu = (e: React.MouseEvent, item: T) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const openMenuFromButton = (e: React.MouseEvent, item: T) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({ x: rect.left - 140, y: rect.bottom + 4, item });
  };

  const closeMenu = () => setContextMenu(null);

  return { contextMenu, openMenu, openMenuFromButton, closeMenu };
}
