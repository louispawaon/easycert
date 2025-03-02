import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from 'next/image';

interface CertificateUploadProps {
  imagePreview: string | null;
  handleCertificateUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClearCertificate: () => void;
}

export function CertificateUpload({
  imagePreview,
  handleCertificateUpload,
  handleClearCertificate
}: CertificateUploadProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="certificate">Certificate Template</Label>
        {imagePreview ? (
          <div className="relative rounded-md overflow-hidden border">
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
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Drag and drop or click to upload
            </p>
            <Input
              id="certificate"
              type="file"
              accept="image/*"
              className="mt-4"
              onChange={handleCertificateUpload}
            />
          </div>
        )}
      </div>
    </div>
  );
} 