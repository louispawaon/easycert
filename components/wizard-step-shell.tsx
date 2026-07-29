"use client";

import type { ReactNode } from "react";
import { AutosaveStatus } from "@/components/AutosaveStatus";
import { GenerateHelpHint } from "@/components/generate-help-hint";
import { cn } from "@/lib/cn";

export interface WizardStepShellProps {
  title: string;
  helpLabel: string;
  helpContent: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  showAutosave?: boolean;
  toolbarExtra?: ReactNode;
}

export function WizardStepShell({
  title,
  helpLabel,
  helpContent,
  children,
  className,
  bodyClassName,
  showAutosave = true,
  toolbarExtra,
}: WizardStepShellProps) {
  return (
    <div
      className={cn(
        "grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden",
        className
      )}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
        <div className="flex min-w-0 items-center gap-1">
          <h2 className="text-sm font-semibold leading-none">{title}</h2>
          <GenerateHelpHint label={helpLabel}>{helpContent}</GenerateHelpHint>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {toolbarExtra}
          {showAutosave ? <AutosaveStatus /> : null}
        </div>
      </div>

      <div className={cn("min-h-0 overflow-hidden", bodyClassName)}>{children}</div>
    </div>
  );
}
