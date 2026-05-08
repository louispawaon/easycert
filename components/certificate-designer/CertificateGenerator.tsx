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
import { Download } from "lucide-react";
import { PAGE_SIZE_OPTIONS, type PageSizeId } from "@/lib/page-size";
import type { BatchProgress as BatchProgressType } from "@/lib/batch/batch-engine";
import type { ActiveGenerationKind } from "@/hooks/useCertificateDesigner";
import { BatchProgress } from "@/components/certificate-designer/BatchProgress";
import { GenerateHelpHint } from "@/components/generate-help-hint";

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
      return "Generating ZIP…";
    case "pdf":
      return "Generating PDF…";
  }
}

interface CertificateGeneratorProps {
  imageUrl: string | null;
  attendeesCount: number;
  textElementsCount: number;
  namePlaceholdersCount: number;
  isGenerating: boolean;
  activeGenerationKind?: ActiveGenerationKind | null;
  batchProgress?: BatchProgressType | null;
  onCancel?: () => void;
  pageSize: PageSizeId;
  onPageSizeChange: (pageSize: PageSizeId) => void;
  outputFileBaseName: string;
  onOutputFileBaseNameChange: (value: string) => void;
  onGenerate: () => void;
  onGeneratePDF: () => void;
}

export function CertificateGenerator({
  imageUrl,
  attendeesCount,
  textElementsCount,
  namePlaceholdersCount,
  isGenerating,
  activeGenerationKind,
  batchProgress,
  onCancel,
  pageSize,
  onPageSizeChange,
  outputFileBaseName,
  onOutputFileBaseNameChange,
  onGenerate,
  onGeneratePDF,
}: CertificateGeneratorProps) {
  const activeOption = PAGE_SIZE_OPTIONS.find((o) => o.id === pageSize);
  const exportActionsDisabled =
    isGenerating || !imageUrl || attendeesCount === 0 || namePlaceholdersCount === 0;

  return (
    <div className="space-y-4">
      <div id="easycert-onboarding-generate-summary" className="space-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1">
          <Label className="shrink-0 uppercase font-semibold">Certificate Template</Label>
          <GenerateHelpHint label="Help: template status">
            <span>This shows if your certificate image is loaded.</span>
          </GenerateHelpHint>
          <span className="ml-auto min-w-0 flex-1 basis-0 text-right text-sm text-muted-foreground sm:flex-none sm:basis-auto">
            {imageUrl ? "Template uploaded" : "No template"}
          </span>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1">
          <Label className="shrink-0 uppercase font-semibold">Attendee List</Label>
          <GenerateHelpHint label="Help: attendee count">
            <span>This is how many attendees are in your list.</span>
          </GenerateHelpHint>
          <span className="ml-auto min-w-0 flex-1 basis-0 text-right text-sm text-muted-foreground sm:flex-none sm:basis-auto">
            {attendeesCount} attendees
          </span>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1">
          <Label className="shrink-0 uppercase font-semibold">Text Elements</Label>
          <GenerateHelpHint label="Help: text elements summary">
            <span>
              Add at least one name field so each certificate can show a different person.
            </span>
          </GenerateHelpHint>
          <span className="ml-auto min-w-0 max-w-full flex-1 basis-0 truncate text-right text-sm text-muted-foreground sm:max-w-none sm:flex-none sm:basis-auto">
            {textElementsCount} elements ({namePlaceholdersCount} name placeholders)
          </span>
        </div>
      </div>

      <div id="easycert-onboarding-generate-options" className="space-y-2 border-t pt-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0 space-y-0.5">
            <div className="flex flex-wrap items-center gap-1">
              <Label htmlFor="filename" className="uppercase font-semibold">
                Output Filename
              </Label>
              <GenerateHelpHint label="Help: output filename">
                <span>
                  We use this as the base file name.
                  The attendee name or a number is added at the end.
                </span>
              </GenerateHelpHint>
            </div>
            <p className="text-sm text-muted-foreground ">
              The name will be appended with the attendee name
            </p>
          </div>
          <Input
            id="filename"
            value={outputFileBaseName}
            onChange={(e) => onOutputFileBaseNameChange(e.target.value)}
            className="w-full min-w-0 sm:w-[200px] sm:shrink-0"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-3 border-t pt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 space-y-0.5">
            <div className="flex flex-wrap items-center gap-1">
              <Label htmlFor="page-size" className="uppercase font-semibold">
                Page Size (PDF)
              </Label>
              <GenerateHelpHint label="Help: PDF page size">
                <span>This only applies to PDF export. Pick the page size you want to print or share.</span>
              </GenerateHelpHint>
            </div>
            <p className="text-sm text-muted-foreground">
              {activeOption?.description ?? "Page size for PDF output."}
            </p>
          </div>
          <Select value={pageSize} onValueChange={(v) => onPageSizeChange(v as PageSizeId)}>
            <SelectTrigger id="page-size" className="w-full min-w-0 sm:w-[220px] sm:shrink-0">
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
      </div>

      {batchProgress ? (
        <BatchProgress progress={batchProgress} onCancel={onCancel} />
      ) : null}

      <div id="easycert-onboarding-generate-export" className="space-y-2">
        <div className="flex items-center justify-end gap-1">
          <span className="text-sm font-medium text-muted-foreground">Create files</span>
          <GenerateHelpHint label="Help: generate downloads">
            <span>
              PNG ZIP gives one image per attendee.
              PDF puts everyone in one file. Keep this page open until download starts.
            </span>
          </GenerateHelpHint>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={onGenerate}
            disabled={exportActionsDisabled}
            variant="outline"
            className="flex-1 whitespace-normal px-3 text-xs font-semibold leading-snug sm:px-4 sm:text-sm"
          >
            {isGenerating && activeGenerationKind === "png" ? (
              <>
                <Spinner />
                {loadingLabel("png")}
              </>
            ) : (
              <>
                <Download className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden text-center sm:inline">Generate Individual Certificates (PNG)</span>
                <span className="text-center sm:hidden">PNGs (ZIP)</span>
              </>
            )}
          </Button>
          <Button
            onClick={onGeneratePDF}
            disabled={exportActionsDisabled}
            className="flex-1 whitespace-normal px-3 text-xs font-semibold sm:px-4 sm:text-sm"
          >
            {isGenerating && activeGenerationKind === "pdf" ? (
              <>
                <Spinner />
                {loadingLabel("pdf")}
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate PDF
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
