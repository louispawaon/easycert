import type { TextElement, ProofLinkElement, ImageDimensions } from "@/types/types";
import { renderToCanvas, type RecordDrawContext } from "@/lib/canvas/draw-text-element";
import { awaitFontsReady } from "@/lib/canvas/await-fonts";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      console.error("Image loading error:", err);
      reject(new Error("Failed to load design template"));
    };
    img.src = url;
  });
}

export async function renderImage(
  imageUrl: string,
  textElements: TextElement[],
  proofLinkElements: ProofLinkElement[],
  issuer: string,
  _imageDimensions: ImageDimensions,
  drawOptions: RecordDrawContext,
  proofUrl?: string,
  options: { skipFontWait?: boolean } = {}
): Promise<string | null> {
  if (!imageUrl) throw new Error("No design template available");

  if (!options.skipFontWait) {
    await awaitFontsReady(textElements);
  }

  const img = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  try {
    await renderToCanvas(canvas, img, textElements, proofLinkElements, issuer, drawOptions, proofUrl);

    const dataUrl = canvas.toDataURL("image/png", 0.92);
    if (!dataUrl) throw new Error("Failed to generate image data URL");
    return dataUrl;
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}
