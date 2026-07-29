"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { PAGE_SIZE_OPTIONS, type PageSizeId } from "@/lib/page-size";
import type { BatchProgress as BatchProgressType } from "@/lib/batch/batch-engine";
import type { AuditReport } from "@/lib/audit/pre-generation-audit";
import type { ActiveGenerationKind } from "@/hooks/useDesignerController";
import { BatchProgress } from "@/components/design-editor/BatchProgress";
import { PreGenerationAudit } from "@/components/design-editor/PreGenerationAudit";
import { GenerateHelpHint } from "@/components/generate-help-hint";
import {
  FORMAT_OPTIONS,
  BUNDLE_OPTIONS,
  SCALE_PRESETS,
  type OutputFormat,
  type OutputBundle,
  type OutputSettings,
} from "@/lib/output/output-settings";
import { containerStemForPattern } from "@/lib/output/filename-pattern";

function Spinner() {
  return (
    <div
      className="mr-2 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
}

function loadingLabel(kind: ActiveGenerationKind): string {
  switch (kind) {
    case "png":
      return "Generating PNG…";
    case "webp":
      return "Generating WebP…";
    case "pdf":
      return "Generating PDF…";
    case "png-pdf":
      return "Generating PNG + PDF…";
    case "webp-pdf":
      return "Generating WebP + PDF…";
  }
}

export interface GeneratePanelProps {
  imageUrl: string | null;
  recordsCount: number;
  textElementsCount: number;
  dynamicTextElementsCount: number;
  proofLinkElementsCount: number;
  issuer: string;
  isGenerating: boolean;
  activeGenerationKind?: ActiveGenerationKind | null;
  batchProgress?: BatchProgressType | null;
  onCancel?: () => void;
  outputSettings: OutputSettings;
  onOutputSettingsChange: (settings: OutputSettings) => void;
  onGenerate: () => void;
  auditReport?: AuditReport | null;
  isAuditing?: boolean;
}

export function GenerateSummaryPanel({
  imageUrl,
  recordsCount,
  textElementsCount,
  dynamicTextElementsCount,
  proofLinkElementsCount,
  issuer,
}: Pick<
  GeneratePanelProps,
  | "imageUrl"
  | "recordsCount"
  | "textElementsCount"
  | "dynamicTextElementsCount"
  | "proofLinkElementsCount"
  | "issuer"
>) {
  return (
    <div id="ditto-onboarding-generate-summary" className="min-w-0 space-y-4">
      <div className="space-y-1">
        <div className="flex min-w-0 items-center gap-1">
          <Label className="font-subheading text-xs font-semibold uppercase tracking-widest leading-snug">
            Design Template
          </Label>
          <GenerateHelpHint label="Help: template status">
            <span>This shows if your design image is loaded.</span>
          </GenerateHelpHint>
        </div>
        <p className="text-sm text-muted-foreground">
          {imageUrl ? "Template uploaded" : "No template"}
        </p>
      </div>
      <div className="space-y-1 border-t pt-4">
        <div className="flex min-w-0 items-center gap-1">
          <Label className="font-subheading text-xs font-semibold uppercase tracking-widest leading-snug">
            Record List
          </Label>
          <GenerateHelpHint label="Help: record count">
            <span>This is how many records are in your list.</span>
          </GenerateHelpHint>
        </div>
        <p className="text-sm text-muted-foreground">
          {recordsCount} records
        </p>
      </div>
      <div className="space-y-1 border-t pt-4">
        <div className="flex min-w-0 items-center gap-1">
          <Label className="font-subheading text-xs font-semibold uppercase tracking-widest leading-snug">
            Text Elements
          </Label>
          <GenerateHelpHint label="Help: text elements summary">
            <span>
              Add at least one dynamic text field so each output can show a
              different record.
            </span>
          </GenerateHelpHint>
        </div>
        <p className="text-sm text-muted-foreground">
          {textElementsCount} elements ({dynamicTextElementsCount} dynamic
          text)
        </p>
      </div>
      {proofLinkElementsCount > 0 && (
        <div className="space-y-1 border-t pt-4">
          <Label className="font-subheading text-xs font-semibold uppercase tracking-widest leading-snug">
            Proof Link
          </Label>
          <p className="text-sm text-muted-foreground">
            {proofLinkElementsCount} proof link
            {proofLinkElementsCount > 1 ? "s" : ""}
            {issuer ? ` · Issued by ${issuer}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}

export function GenerateExportPanel({
  imageUrl,
  recordsCount,
  dynamicTextElementsCount,
  isGenerating,
  activeGenerationKind,
  batchProgress,
  onCancel,
  outputSettings,
  onOutputSettingsChange,
  onGenerate,
  auditReport = null,
  isAuditing = false,
}: GeneratePanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [showWarningsConfirm, setShowWarningsConfirm] = useState(false);

  const exportActionsDisabled =
    isGenerating || !imageUrl || recordsCount === 0 || dynamicTextElementsCount === 0;

  const hasBlockingErrors = auditReport?.blocking === true;
  const hasWarningsOnly =
    !hasBlockingErrors &&
    auditReport !== null &&
    auditReport.totalRecords > 0 &&
    auditReport.findings.some((f) => f.severity === "warning");
  const canGenerate = exportActionsDisabled;
  const blockedGenerate = hasBlockingErrors;

  const format = outputSettings.format;
  const scale = outputSettings.scale;
  const bundle = outputSettings.bundle;
  const pageSize = outputSettings.pageSize;
  const filenamePattern = outputSettings.filenamePattern;

  const scaleValue =
    scale === 1 ? 1 : scale === 2 ? 2 : -1;

  const activePageSizeOption = PAGE_SIZE_OPTIONS.find((o) => o.id === pageSize);
  const showsPageSize = format === "pdf" || bundle === "with-pdf";
  const showsBundle = format === "png" || format === "webp";

  return (
    <div className="min-w-0 space-y-4">
      <button
        type="button"
        className="flex w-full items-center gap-2 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        <span className="font-subheading text-xs font-semibold uppercase tracking-widest leading-snug">
          Output Settings
        </span>
      </button>

      {expanded && (
        <div className="min-w-0 space-y-4">
          <div className="min-w-0 space-y-2">
            <Label
              htmlFor="output-format"
              className="text-xs font-medium"
            >
              Format
            </Label>
            <Select
              value={format}
              onValueChange={(v) =>
                onOutputSettingsChange({
                  ...outputSettings,
                  format: v as OutputFormat,
                  ...(v === "pdf"
                    ? {
                        bundle: "standalone",
                        filenamePattern: containerStemForPattern(
                          outputSettings.filenamePattern,
                          "output"
                        ),
                      }
                    : {}),
                })
              }
            >
              <SelectTrigger id="output-format" className="min-w-0 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showsBundle && (
            <div className="min-w-0 space-y-2">
              <Label
                htmlFor="output-bundle"
                className="text-xs font-medium"
              >
                Bundle preset
              </Label>
              <Select
                value={bundle}
                onValueChange={(v) =>
                  onOutputSettingsChange({
                    ...outputSettings,
                    bundle: v as OutputBundle,
                  })
                }
              >
                <SelectTrigger id="output-bundle" className="min-w-0 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUNDLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="min-w-0 space-y-2">
            <Label
              htmlFor="output-scale-preset"
              className="text-xs font-medium"
            >
              Scale
            </Label>
            <Select
              value={String(scaleValue)}
              onValueChange={(v) => {
                const num = Number(v);
                if (num === 1 || num === 2) {
                  onOutputSettingsChange({
                    ...outputSettings,
                    scale: num,
                  });
                }
              }}
            >
              <SelectTrigger
                id="output-scale-preset"
                className="min-w-0 w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCALE_PRESETS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {scaleValue === -1 && (
              <div className="flex items-center gap-2 pt-1">
                <Input
                  id="output-scale-custom"
                  type="number"
                  step="0.1"
                  min={0.1}
                  max={5}
                  value={scale}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (isFinite(v)) {
                      onOutputSettingsChange({
                        ...outputSettings,
                        scale: Math.min(5, Math.max(0.1, v)),
                      });
                    }
                  }}
                  className="min-w-0 w-24"
                />
                <span className="text-xs text-muted-foreground">×</span>
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 items-center gap-1">
              <Label
                htmlFor="filename-pattern"
                className="text-xs font-medium"
              >
                {format === "pdf" ? "PDF filename" : "Filename pattern"}
              </Label>
              <GenerateHelpHint label="Help: filename pattern">
                {format === "pdf" ? (
                  <span>
                    All records are combined into a single PDF, so per-record
                    variables aren&apos;t used. Enter a name for the document.
                  </span>
                ) : (
                  <span>
                    Use {"{name}"}, {"{index}"} (row number), or any column
                    name like {"{serial}"}, {"{role}"}.
                  </span>
                )}
              </GenerateHelpHint>
            </div>
            <Input
              id="filename-pattern"
              value={filenamePattern}
              placeholder={format === "pdf" ? "output" : "output_{name}"}
              onChange={(e) =>
                onOutputSettingsChange({
                  ...outputSettings,
                  filenamePattern: e.target.value,
                })
              }
              className="min-w-0 w-full font-mono text-xs"
            />
          </div>

          {showsPageSize && (
            <div className="min-w-0 space-y-2 border-t pt-4">
              <div className="flex min-w-0 items-center gap-1">
                <Label
                  htmlFor="page-size"
                  className="text-xs font-medium"
                >
                  Page Size (PDF)
                </Label>
                <GenerateHelpHint label="Help: PDF page size">
                  <span>
                    Applies to PDF output. Choose the paper size for
                    printing or sharing.
                  </span>
                </GenerateHelpHint>
              </div>
              <p className="text-xs text-muted-foreground">
                {activePageSizeOption?.description ??
                  "Page size for PDF output."}
              </p>
              <Select
                value={pageSize}
                onValueChange={(v) =>
                  onOutputSettingsChange({
                    ...outputSettings,
                    pageSize: v as PageSizeId,
                  })
                }
              >
                <SelectTrigger
                  id="page-size"
                  className="min-w-0 w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {batchProgress ? (
        <BatchProgress progress={batchProgress} onCancel={onCancel} />
      ) : null}

      <PreGenerationAudit report={auditReport} isAuditing={isAuditing} />

      <div
        id="ditto-onboarding-generate-export"
        className="space-y-2 border-t pt-4"
      >
        {blockedGenerate ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium leading-snug text-destructive">
                Cannot generate — blocking errors found.
              </p>
              <p className="text-xs text-muted-foreground">
                Fix the issues flagged in the audit above before generating.
              </p>
            </div>
          </div>
        ) : showWarningsConfirm ? (
          <div className="space-y-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium leading-snug text-warning">
                  {auditReport?.readyCount ?? auditReport?.totalRecords ?? recordsCount} record
                  {((auditReport?.readyCount ?? auditReport?.totalRecords ?? recordsCount) === 1)
                    ? ""
                    : "s"}{" "}
                  will be generated with warnings.
                </p>
                <p className="text-xs text-muted-foreground">
                  Some outputs may have overflow, missing values, or other issues.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setShowWarningsConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => {
                  setShowWarningsConfirm(false);
                  onGenerate();
                }}
              >
                Generate anyway
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-muted-foreground">
            Create files
          </span>
          <GenerateHelpHint label="Help: generate downloads">
            <span>
              Click to generate outputs with your selected settings. Keep
              this page open until the download starts.
            </span>
          </GenerateHelpHint>
        </div>
        <Button
          onClick={() => {
            if (hasWarningsOnly && !showWarningsConfirm) {
              setShowWarningsConfirm(true);
              return;
            }
            onGenerate();
          }}
          disabled={canGenerate || blockedGenerate}
          className="w-full"
        >
          {isGenerating && activeGenerationKind ? (
            <>
              <Spinner />
              {loadingLabel(activeGenerationKind)}
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate{" "}
              {format === "pdf"
                ? "PDF"
                : bundle === "with-pdf"
                  ? `${format.toUpperCase()} + PDF bundle`
                  : `${format.toUpperCase()} ZIP`}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function GeneratePanel(props: GeneratePanelProps) {
  return (
    <div className="space-y-4">
      <GenerateSummaryPanel {...props} />
      <GenerateExportPanel {...props} />
    </div>
  );
}
