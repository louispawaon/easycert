"use client";

import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CanvasPreview } from "@/components/design-editor/CanvasPreview";
import { TextElementEditor } from "@/components/design-editor/TextElementEditor";
import { ProofLinkElementEditor } from "@/components/design-editor/ProofLinkElementEditor";
import { DesignControls } from "@/components/design-editor/DesignControls";
import { DesignAuditSummary } from "@/components/design-editor/DesignAuditSummary";
import { AutosaveStatus } from "@/components/AutosaveStatus";
import { GenerateHelpHint } from "@/components/generate-help-hint";
import type { DesignerController } from "@/hooks/useDesignerController";
import type { ProofLinkElement } from "@/types/types";
import { isProofLinkElement, isTextElement } from "@/types/types";
import { cn } from "@/lib/cn";
import type { AuditReport } from "@/lib/audit/pre-generation-audit";

type DesignEditorShellProps = Pick<
  DesignerController,
  | "imageUrl"
  | "designElements"
  | "selectedElement"
  | "handleElementUpdate"
  | "handleElementRemove"
  | "handleElementSelect"
  | "handleAddTextElement"
  | "handleAddProofLinkElement"
  | "canvasPreviewProps"
  | "outputPreviewProps"
  | "loadPreset"
  | "recordLinesMode"
  | "recordCsvHeaders"
  | "issuer"
  | "handleIssuerChange"
  | "imageDimensions"
  | "auditReport"
  | "isAuditing"
> & {
  className?: string;
};

export function DesignEditorShell({
  imageUrl,
  designElements,
  selectedElement,
  handleElementUpdate,
  handleElementRemove,
  handleElementSelect,
  handleAddTextElement,
  handleAddProofLinkElement,
  canvasPreviewProps,
  outputPreviewProps,
  loadPreset,
  recordLinesMode,
  recordCsvHeaders,
  issuer,
  handleIssuerChange,
  imageDimensions,
  auditReport,
  isAuditing,
  className,
}: DesignEditorShellProps) {
  const { records, previewIndex, onPreviewChange, onDownload } = outputPreviewProps;
  const previewingName = records[previewIndex] ?? "Record Name";
  const hasNamePlaceholder = designElements.some((el) => el.type === "dynamic-text" || el.type === "name");
  const canDownloadPreview = records.length > 0 && Boolean(imageUrl);
  const selectedElementObj =
    selectedElement != null ? designElements.find((el) => el.id === selectedElement) : undefined;
  const isProofLinkSelected = selectedElementObj != null && isProofLinkElement(selectedElementObj);
  const selectedTextElement = isProofLinkSelected ? undefined : selectedElementObj;

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <aside
          id="ditto-onboarding-design-sidebar"
          className="min-h-0 min-w-0 max-h-[38vh] shrink-0 overflow-y-auto border-b p-4 lg:w-70 lg:max-h-none lg:border-r lg:border-b-0"
        >
          <div id="ditto-onboarding-design-controls">
            <DesignControls
              onInsertStatic={() => handleAddTextElement("static")}
              onInsertRecordName={() => handleAddTextElement("dynamic-text")}
              onInsertFieldFromCsv={(columnKey) => handleAddTextElement("dynamic-text", columnKey)}
              onInsertQr={handleAddProofLinkElement}
              recordCsvHeaders={recordCsvHeaders}
              recordLinesMode={recordLinesMode}
              placedElements={designElements}
              textElements={designElements.filter(isTextElement)}
              imageUrl={imageUrl}
              onLoadPreset={loadPreset}
              selectedElement={selectedElement}
              onElementSelect={handleElementSelect}
            />
          </div>
          <DesignAuditSummary report={auditReport} isAuditing={isAuditing} />
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="grid h-12 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b px-3">
            <div className="flex min-w-0 items-center gap-1 justify-self-start">
              <span className="truncate text-sm text-muted-foreground">Design preview</span>
              <GenerateHelpHint label="Help: design preview">
                <span>
                  This preview updates as you edit. Use the arrows to check different records.
                </span>
              </GenerateHelpHint>
            </div>

            {records.length > 0 ? (
              <div className="flex shrink-0 items-center justify-center gap-2 justify-self-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => onPreviewChange(Math.max(0, previewIndex - 1))}
                  disabled={previewIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </Button>
                <div
                  className="flex min-w-0 w-24 items-baseline justify-center gap-1.5 sm:w-44 lg:w-52"
                  title={`Previewing: ${previewingName}`}
                >
                  <span className="min-w-0 truncate text-sm font-medium">{previewingName}</span>
                  <span className="shrink-0 whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                    ({previewIndex + 1}/{records.length})
                  </span>
                </div>
                <Button
                  type="button"
                  size="icon"
                  className="shrink-0"
                  onClick={() =>
                    onPreviewChange(Math.min(records.length - 1, previewIndex + 1))
                  }
                  disabled={previewIndex === records.length - 1}
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            ) : (
              <div className="hidden sm:block" aria-hidden />
            )}

            <div className="flex min-w-0 shrink items-center justify-end gap-2 justify-self-end">
              {canDownloadPreview ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={onDownload}
                  title={
                    hasNamePlaceholder
                      ? "Download preview for current record"
                      : "Download current design preview"
                  }
                >
                  <Download className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Download</span>
                </Button>
              ) : null}
              <AutosaveStatus />
            </div>
          </div>

          <div
            id="ditto-onboarding-design-canvas"
            className="flex min-h-0 flex-1 items-start justify-center overflow-hidden bg-muted/30 p-3"
          >
            <CanvasPreview {...canvasPreviewProps} fillContainer />
          </div>
        </section>

        <aside
          id="ditto-onboarding-design-properties"
          className="min-h-0 min-w-0 max-h-[38vh] shrink-0 overflow-y-auto border-t p-4 lg:w-70 lg:max-h-none lg:border-l lg:border-t-0"
        >
          {isProofLinkSelected && selectedElementObj ? (
            <ProofLinkElementEditor
              element={selectedElementObj as ProofLinkElement}
              onUpdate={handleElementUpdate}
              onRemove={handleElementRemove}
              issuer={issuer}
              onIssuerChange={handleIssuerChange}
              canvasWidth={imageDimensions.width}
            />
          ) : selectedTextElement ? (
            <TextElementEditor
              element={selectedTextElement}
              onUpdate={handleElementUpdate}
              onRemove={handleElementRemove}
              recordCsvHeaders={recordCsvHeaders}
              recordLinesMode={recordLinesMode}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Select an element on the canvas or in the placed elements list to edit its properties.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
