export type ImageDimensions = { width: number; height: number };

export type TemplateImage = {
  image: HTMLImageElement;
  dimensions: ImageDimensions;
};

/** Decodes the template image into an `HTMLImageElement`; shared across designer + previews via React Query cache. */
export function loadTemplateImage(imageUrl: string): Promise<TemplateImage> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "Anonymous";
    image.onload = () =>
      resolve({
        image,
        dimensions: { width: image.naturalWidth, height: image.naturalHeight },
      });
    image.onerror = () => reject(new Error("Failed to load design image"));
    image.src = imageUrl;
  });
}

export const CERT_TEMPLATE_IMAGE_QUERY_KEY = ["ditto", "template-image"] as const;

export function templateImageQueryKey(imageUrl: string | null) {
  return [...CERT_TEMPLATE_IMAGE_QUERY_KEY, imageUrl] as const;
}
