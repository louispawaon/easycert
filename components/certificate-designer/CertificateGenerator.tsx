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
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="uppercase font-semibold">Certificate Template</Label>
          <span className="text-sm text-muted-foreground">
            {imageUrl ? "Template uploaded" : "No template"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <Label className="uppercase font-semibold">Attendee List</Label>
          <span className="text-sm text-muted-foreground">
            {attendeesCount} attendees
          </span>
        </div>
        <div className="flex justify-between items-center">
          <Label className="uppercase font-semibold">Text Elements</Label>
          <span className="text-sm text-muted-foreground">
            {textElementsCount} elements ({namePlaceholdersCount} name placeholders)
          </span>
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="filename" className="uppercase font-semibold">Output Filename</Label>
            <p className="text-sm text-muted-foreground ">
              The name will be appended with the attendee name
            </p>
          </div>
          <Input
            id="filename"
            value={outputFileBaseName}
            onChange={(e) => onOutputFileBaseNameChange(e.target.value)}
            className="w-[200px]"
          />
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="page-size" className="uppercase font-semibold">Page Size (PDF)</Label>
            <p className="text-sm text-muted-foreground">
              {activeOption?.description ?? "Page size for PDF output."}
            </p>
          </div>
          <Select value={pageSize} onValueChange={(v) => onPageSizeChange(v as PageSizeId)}>
            <SelectTrigger id="page-size" className="w-[220px]">
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

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={onGenerate}
          disabled={exportActionsDisabled}
          variant="outline"
          className="flex-1 font-semibold"
        >
          {isGenerating && activeGenerationKind === "png" ? (
            <>
              <Spinner />
              {loadingLabel("png")}
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Individual Certificates (PNG)
            </>
          )}
        </Button>
        <Button
          onClick={onGeneratePDF}
          disabled={exportActionsDisabled}
          className="flex-1 font-semibold"
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
  );
}
