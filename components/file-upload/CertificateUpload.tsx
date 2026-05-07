"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import { GenerateHelpHint } from "@/components/generate-help-hint";

interface CertificateUploadProps {
  imagePreview: string | null;
  onCertificateFile: (file: File) => void;
  handleClearCertificate: () => void;
  isUploading: boolean;
}

export function CertificateUpload({
  imagePreview,
  onCertificateFile,
  handleClearCertificate,
  isUploading,
}: CertificateUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div id="easycert-onboarding-certificate-upload" className="min-w-0">
      <div className="flex items-center gap-1">
        <Label htmlFor="certificate" className="uppercase font-semibold">
          Certificate Template
        </Label>
        <GenerateHelpHint label="Help: certificate template">
          <span>
            Use a clear image of your blank certificate (PNG or JPG). This becomes the background for
            every person’s certificate.
          </span>
        </GenerateHelpHint>
      </div>
      {imagePreview ? (
        <div className="relative mt-2 flex min-h-[300px] w-full items-center justify-center overflow-hidden rounded-md border-2 border-success bg-muted/20 shadow-[0_0_0_4px_hsl(var(--success)/0.12)] transition-[border-color,box-shadow]">
          <img
            src={imagePreview}
            alt="Certificate Preview"
            className="max-h-[300px] w-full max-w-full object-contain object-center"
          />
          <Button
            variant="outline"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
            onClick={handleClearCertificate}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "mt-2 flex min-h-[300px] flex-col items-center justify-center rounded-md border border-dashed p-8 w-full",
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
            if (file) onCertificateFile(file);
          }}
        >
          {isUploading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <label
              htmlFor="certificate"
              className="cursor-pointer group flex flex-col items-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                Click to upload or drag and drop
              </p>
              <Input
                id="certificate"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(ev) => {
                  const file = ev.target.files?.[0];
                  if (file) onCertificateFile(file);
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
