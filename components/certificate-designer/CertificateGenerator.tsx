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
import { Download, Printer } from "lucide-react";
import { PAGE_SIZE_OPTIONS, type PageSizeId } from "@/lib/page-size";

interface CertificateGeneratorProps {
  imageUrl: string | null;
  attendeesCount: number;
  textElementsCount: number;
  namePlaceholdersCount: number;
  isGenerating: boolean;
  pageSize: PageSizeId;
  onPageSizeChange: (pageSize: PageSizeId) => void;
  onGenerate: () => void;
  onGeneratePDF: () => void;
  onPrint: () => void;
}

export function CertificateGenerator({
  imageUrl,
  attendeesCount,
  textElementsCount,
  namePlaceholdersCount,
  isGenerating,
  pageSize,
  onPageSizeChange,
  onGenerate,
  onGeneratePDF,
  onPrint,
}: CertificateGeneratorProps) {
  const activeOption = PAGE_SIZE_OPTIONS.find((o) => o.id === pageSize);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Certificate Template</Label>
          <span className="text-sm text-muted-foreground">
            {imageUrl ? "Template uploaded" : "No template"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <Label>Attendee List</Label>
          <span className="text-sm text-muted-foreground">
            {attendeesCount} attendees
          </span>
        </div>
        <div className="flex justify-between items-center">
          <Label>Text Elements</Label>
          <span className="text-sm text-muted-foreground">
            {textElementsCount} elements ({namePlaceholdersCount} name placeholders)
          </span>
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="filename">Output Filename</Label>
            <p className="text-sm text-muted-foreground">
              The name will be appended with the attendee name
            </p>
          </div>
          <Input
            id="filename"
            defaultValue="Certificate"
            className="w-[200px]"
          />
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="page-size">Page Size (PDF &amp; Print)</Label>
            <p className="text-sm text-muted-foreground">
              {activeOption?.description ?? "Page size for PDF and Print output."}
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

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={onGenerate}
          disabled={isGenerating || !imageUrl || attendeesCount === 0 || namePlaceholdersCount === 0}
          variant="outline"
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Individual Certificates
            </>
          )}
        </Button>
        <Button
          onClick={onGeneratePDF}
          disabled={isGenerating || !imageUrl || attendeesCount === 0 || namePlaceholdersCount === 0}
          className="flex-1"
        >
          <Download className="mr-2 h-4 w-4" />
          Generate PDF
        </Button>
        <Button
          onClick={onPrint}
          disabled={isGenerating || !imageUrl || attendeesCount === 0 || namePlaceholdersCount === 0}
          variant="secondary"
          className="flex-1"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Certificates
        </Button>
      </div>
    </div>
  );
}
