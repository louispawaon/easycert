import { TextElement } from "@/types/types";
import { drawCertificateToCanvas } from "@/lib/canvas/draw-text-element";
import { awaitFontsReady } from "@/lib/canvas/await-fonts";
import {
  generateCertificatesBatch,
  type BatchOptions,
} from "@/lib/batch/batch-engine";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      console.error("Image loading error:", err);
      reject(new Error("Failed to load certificate template"));
    };
    img.src = url;
  });
}

/**
 * Render a single certificate to a PNG data URL. Used by single-attendee
 * flows (preview download) -- batch flows should use the batch engine
 * directly, which reuses one canvas/template across the run.
 *
 * The local canvas is explicitly disposed (width/height -> 0) once the
 * data URL is extracted so its backing store is released without waiting
 * on GC. Callers can pass `skipFontWait` to avoid redundant font waits.
 */
export async function generateCertificateImage(
  imageUrl: string,
  textElements: TextElement[],
  _imageDimensions: { width: number; height: number },
  name: string,
  options: { skipFontWait?: boolean } = {}
): Promise<string | null> {
  if (!imageUrl) throw new Error("No certificate template available");

  if (!options.skipFontWait) {
    await awaitFontsReady(textElements);
  }

  const img = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  try {
    drawCertificateToCanvas(canvas, img, textElements, { attendeeName: name });

    const dataUrl = canvas.toDataURL("image/png", 0.92);
    if (!dataUrl) throw new Error("Failed to generate image data URL");
    return dataUrl;
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

/**
 * Thin wrapper kept for backward compatibility. New callers should use
 * `generateCertificatesBatch` from `@/lib/batch/batch-engine` directly so
 * they can pass `onProgress` / `signal` for cancel + progress UI.
 */
export async function generateCertificates(
  imageUrl: string,
  attendees: string[],
  textElements: TextElement[],
  imageDimensions: { width: number; height: number },
  options: Pick<BatchOptions, "onProgress" | "signal" | "chunkSize"> = {}
): Promise<Blob> {
  return generateCertificatesBatch({
    imageUrl,
    attendees,
    textElements,
    imageDimensions,
    ...options,
  });
}
