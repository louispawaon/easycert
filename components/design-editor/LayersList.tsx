"use client";

import type { DesignElement } from "@/types/types";
import { isProofLinkElement } from "@/types/types";
import { cn } from "@/lib/cn";
import { Type, User, Link } from "lucide-react";

interface LayersListProps {
  elements: DesignElement[];
  selectedElement: string | null;
  onSelect: (id: string | null) => void;
}

function getElementLabel(element: DesignElement): string {
  if (isProofLinkElement(element)) return "Proof Link";
  if (element.type === "dynamic-text" || element.type === "name") {
    const variable = element.variable ?? element.variableColumn;
    return variable && variable.trim().length > 0
      ? variable
      : "Name";
  }
  return "Subtext";
}

function getElementIcon(element: DesignElement) {
  if (isProofLinkElement(element)) return <Link className="h-4 w-4 shrink-0" aria-hidden />;
  if (element.type === "dynamic-text" || element.type === "name") return <User className="h-4 w-4 shrink-0" aria-hidden />;
  return <Type className="h-4 w-4 shrink-0" aria-hidden />;
}

export function LayersList({ elements, selectedElement, onSelect }: LayersListProps) {
  if (elements.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No placed elements yet. Add one above to see it here.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {elements.map((element) => {
        const label = getElementLabel(element);
        const isSelected = selectedElement === element.id;

        return (
          <li key={element.id}>
            <button
              type="button"
              onClick={() => onSelect(element.id)}
              className={cn(
                "flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                isSelected
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted/60 text-foreground"
              )}
              aria-pressed={isSelected}
            >
              {getElementIcon(element)}
              <span className="min-w-0 flex-1 truncate" title={label}>
                {label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
