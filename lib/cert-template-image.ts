export type CertificateImageDimensions = { width: number; height: number };

export type CertificateTemplateImage = {
  image: HTMLImageElement;
  dimensions: CertificateImageDimensions;
};

/** Decodes the certificate template into an `HTMLImageElement`; shared across designer + previews via React Query cache. */
export function loadCertificateTemplateImage(imageUrl: string): Promise<CertificateTemplateImage> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "Anonymous";
    image.onload = () =>
      resolve({
        image,
        dimensions: { width: image.naturalWidth, height: image.naturalHeight },
      });
    image.onerror = () => reject(new Error("Failed to load certificate image"));
    image.src = imageUrl;
  });
}

export const CERT_TEMPLATE_IMAGE_QUERY_KEY = ["easycert", "cert-template-image"] as const;

export function certTemplateImageQueryKey(imageUrl: string | null) {
  return [...CERT_TEMPLATE_IMAGE_QUERY_KEY, imageUrl] as const;
}
