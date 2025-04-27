import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from 'next/image';

interface CertificateUploadProps {
  imagePreview: string | null;
  handleCertificateUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClearCertificate: () => void;
  isUploading: boolean;
}

export function CertificateUpload({
  imagePreview,
  handleCertificateUpload,
  handleClearCertificate,
  isUploading
}: CertificateUploadProps) {
  return (
    <div>
      <Label htmlFor="certificate">Certificate Template</Label>
      {imagePreview ? (
        <div className="mt-2 relative rounded-md overflow-hidden border w-full h-[92%]">
          <Image 
            src={imagePreview} 
            alt="Certificate Preview" 
            width={300} 
            height={200}
            className="w-full h-auto object-contain max-h-[300px]"
          />
          <Button 
            variant="destructive" 
            size="icon" 
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={handleClearCertificate}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div 
          className="mt-2 flex flex-col items-center justify-center rounded-md border border-dashed p-8 w-full h-[92%]"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('bg-primary/10');
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-primary/10');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-primary/10');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              const event = {
                target: {
                  files: e.dataTransfer.files
                }
              } as React.ChangeEvent<HTMLInputElement>;
              handleCertificateUpload(event);
            }
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
                onChange={handleCertificateUpload}
                disabled={isUploading}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
} 