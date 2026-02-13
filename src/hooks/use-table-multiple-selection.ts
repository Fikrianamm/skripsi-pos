/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { SelectionMode } from "@heroui/table";

export function useTableMultipleSelection(isMultiple: boolean = false) {
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("single");

  useEffect(() => {
    setSelectionMode(isMultiple ? "multiple" : "single");
  }, [isMultiple]);

  return { selectionMode, setSelectionMode };
}
