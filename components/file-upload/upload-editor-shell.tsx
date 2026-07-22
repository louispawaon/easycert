"use client";

import type { ReactNode } from "react";
import { WizardStepShell } from "@/components/wizard-step-shell";

export interface UploadEditorShellProps {
  templateUpload: ReactNode;
  recordUpload: ReactNode;
  className?: string;
}

export function UploadEditorShell({
  templateUpload,
  recordUpload,
  className,
}: UploadEditorShellProps) {
  return (
    <WizardStepShell
      title="Upload"
      helpLabel="Help: upload step"
      helpContent={
        <span>
          Upload your design image and your record list first.
          You need both before you can design or generate files.
        </span>
      }
      className={className}
      bodyClassName="flex h-full min-h-0 flex-col justify-center overflow-y-auto lg:justify-stretch lg:overflow-hidden"
    >
      <div className="grid w-full min-w-0 gap-0 lg:h-full lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:overflow-hidden">
        <div className="min-w-0 border-b p-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-y-auto lg:border-r lg:border-b-0">
          {templateUpload}
        </div>
        <div className="min-w-0 p-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-y-auto">
          {recordUpload}
        </div>
      </div>
    </WizardStepShell>
  );
}
