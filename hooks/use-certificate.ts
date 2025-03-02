import { useEffect, useState } from "react";
import { getLocalStorageItem } from "@/lib/utils";
import { addEventListener, removeEventListener } from "@/lib/utils";

export function useCertificateImage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const savedImageUrl = getLocalStorageItem('certificateImageUrl');
    if (savedImageUrl) setImageUrl(savedImageUrl);

    const handleImageUpload = (event: CustomEvent) => setImageUrl(event.detail.imageUrl);
    const handleImageClear = () => setImageUrl(null);

    addEventListener('certificate-image-uploaded', handleImageUpload as EventListener);
    addEventListener('certificate-image-cleared', handleImageClear);

    return () => {
      removeEventListener('certificate-image-uploaded', handleImageUpload as EventListener);
      removeEventListener('certificate-image-cleared', handleImageClear);
    };
  }, []);

  return { imageUrl, setImageUrl };
}