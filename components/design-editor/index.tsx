"use client";

import { useEffect } from "react";
import type { DesignerController } from "@/hooks/useDesignerController";
import { DesignEditorShell } from "@/components/design-editor/design-editor-shell";
import { shouldIgnoreDesignerKeyboardTarget } from "@/lib/designer-keyboard";

export function DesignEditor(
  props: DesignerController & { className?: string }
) {
  const { className, ...designer } = props;
  const { selectedElement, handleElementRemove, handleElementSelect } = designer;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (shouldIgnoreDesignerKeyboardTarget(e.target)) return;

      if (e.key === "Escape") {
        if (selectedElement == null) return;
        e.preventDefault();
        handleElementSelect(null);
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElement == null) return;
        e.preventDefault();
        handleElementRemove();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedElement, handleElementRemove, handleElementSelect]);

  return (
    <DesignEditorShell
      {...designer}
      className={className}
    />
  );
}
