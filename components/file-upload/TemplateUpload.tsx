"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GenerateHelpHint } from "@/components/generate-help-hint";
import { cn } from "@/lib/cn";

interface TemplateUploadProps {
  imagePreview: string | null;
  onTemplateFile: (file: File) => void;
  handleClearTemplate: () => void;
  isUploading: boolean;
}

export function TemplateUpload({
  imagePreview,
  onTemplateFile,
  handleClearTemplate,
  isUploading,
}: TemplateUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      id="ditto-onboarding-template-upload"
      className="flex h-full min-h-0 min-w-0 flex-col"
    >
      <div className="flex shrink-0 items-center gap-1">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-tight leading-none">Design Template</h3>
        <GenerateHelpHint label="Help: design template">
          <span>
            Upload a clear image of your blank design.
            This image is the background for every output.
          </span>
        </GenerateHelpHint>
      </div>
      {imagePreview ? (
        <div className="relative mt-3 flex min-h-60 flex-1 items-center justify-center overflow-hidden rounded-md border-2 border-success bg-muted/20 shadow-[0_0_0_4px_var(--success-ring)] transition-[border-color,box-shadow]">
          <Image
            src={imagePreview}
            alt="Design Preview"
            fill
            unoptimized
            className="object-contain object-center"
          />
          <Button
            variant="outline"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
            onClick={handleClearTemplate}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "mt-3 flex min-h-60 flex-1 flex-col items-center justify-center rounded-md border border-dashed p-8 w-full",
            isDragging && "bg-primary/10"
          )}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const next = e.relatedTarget as Node | null;
            if (next && e.currentTarget.contains(next)) return;
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) onTemplateFile(file);
          }}
        >
          {isUploading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <label
              htmlFor="template"
              className="cursor-pointer group flex flex-col items-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                Click to upload or drag and drop
              </p>
              <Input
                id="template"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(ev) => {
                  const file = ev.target.files?.[0];
                  if (file) onTemplateFile(file);
                }}
                disabled={isUploading}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
