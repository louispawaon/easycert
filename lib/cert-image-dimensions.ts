export type CertificateImageDimensions = { width: number; height: number };

export function loadCertificateImageNaturalSize(imageUrl: string): Promise<CertificateImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error("Failed to load certificate image"));
    img.src = imageUrl;
  });
}
