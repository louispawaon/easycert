"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";

interface CertificateGeneratorProps {
  imageUrl: string | null;
  attendeesCount: number;
  textElementsCount: number;
  namePlaceholdersCount: number;
  isGenerating: boolean;
  onGenerate: () => void;
  onGeneratePDF: () => void;
}

export function CertificateGenerator({
  imageUrl,
  attendeesCount,
  textElementsCount,
  namePlaceholdersCount,
  isGenerating,
  onGenerate,
  onGeneratePDF
}: CertificateGeneratorProps) {
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
        <div className="flex items-center justify-between">
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
      
      <div className="flex justify-between gap-2">
        <Button 
          onClick={onGenerate}
          disabled={isGenerating || !imageUrl || attendeesCount === 0 || namePlaceholdersCount === 0}
          variant="outline"
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
        >
          <Download className="mr-2 h-4 w-4" />
          Generate PDF
        </Button>
      </div>
    </div>
  );
} 