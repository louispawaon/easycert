"use client";

import { WizardStepShell } from "@/components/wizard-step-shell";
import {
  GenerateExportPanel,
  GenerateSummaryPanel,
  type GeneratePanelProps,
} from "@/components/design-editor/GeneratePanel";
import { GenerationReportPanel } from "@/components/design-editor/GenerationReportPanel";
import type { GenerationReport } from "@/lib/output/generation-report";

export interface GenerateEditorShellProps extends GeneratePanelProps {
  className?: string;
  generationReport?: GenerationReport | null;
  onDismissReport?: () => void;
}

export function GenerateEditorShell({
  className,
  generationReport,
  onDismissReport,
  ...generatorProps
}: GenerateEditorShellProps) {
  return (
    <WizardStepShell
      title="Generate"
      helpLabel="Help: generate step"
      helpContent={
        <span>
          When you are ready, download a ZIP of images or one PDF.
          Large lists may take longer, so keep this tab open until download starts.
        </span>
      }
      className={className}
      showAutosave={false}
      bodyClassName="flex h-full min-h-0 flex-col justify-center overflow-y-auto lg:justify-stretch lg:overflow-hidden"
    >
      <div className="grid w-full min-w-0 gap-0 lg:h-full lg:min-h-0 lg:flex-1 lg:grid-cols-[280px_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="min-w-0 border-b p-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-y-auto lg:border-r lg:border-b-0">
          <GenerateSummaryPanel {...generatorProps} />
        </aside>
        <div className="min-w-0 p-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-y-auto">
          {generationReport && onDismissReport ? (
            <div className="mb-4">
              <GenerationReportPanel report={generationReport} onDismiss={onDismissReport} />
            </div>
          ) : null}
          <GenerateExportPanel {...generatorProps} />
        </div>
      </div>
    </WizardStepShell>
  );
}
