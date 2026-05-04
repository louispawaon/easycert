import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { TextElement } from "@/types/types"
import JSZip from "jszip"
import { drawCertificateToCanvas } from "@/lib/canvas/draw-text-element"
import { awaitFontsReady } from "@/lib/canvas/await-fonts"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function addEventListener(event: string, handler: EventListener): void {
  window.addEventListener(event, handler);
}

export function removeEventListener(event: string, handler: EventListener): void {
  window.removeEventListener(event, handler);
}

export function dispatchEvent(event: CustomEvent): void {
  window.dispatchEvent(event);
}

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
 * Render a single certificate to a PNG data URL. Caller is responsible for
 * awaiting font readiness for batch operations (see `generateCertificates`).
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
  drawCertificateToCanvas(canvas, img, textElements, { attendeeName: name });

  const dataUrl = canvas.toDataURL("image/png", 0.92);
  if (!dataUrl) throw new Error("Failed to generate image data URL");
  return dataUrl;
}

export async function generateCertificates(
  imageUrl: string,
  attendees: string[],
  textElements: TextElement[],
  imageDimensions: { width: number; height: number }
): Promise<Blob> {
  if (!imageUrl || attendees.length === 0 || !textElements.some(el => el.type === 'name')) {
    throw new Error("Missing requirements: template, attendees, and name placeholder");
  }

  // Wait for fonts once before the loop instead of per-iteration.
  await awaitFontsReady(textElements);

  const certificates: string[] = [];
  for (const attendee of attendees) {
    const cert = await generateCertificateImage(
      imageUrl,
      textElements,
      imageDimensions,
      attendee,
      { skipFontWait: true }
    );
    if (cert) certificates.push(cert);
  }

  const zip = new JSZip();
  let completed = 0;

  for (const cert of certificates) {
    const base64Data = cert.split(',')[1];
    const binaryString = atob(base64Data);
    const arrayBuffer = new ArrayBuffer(binaryString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }

    zip.file(`certificate_${attendees[completed]}.png`, uint8Array, {
      binary: true,
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });
    completed++;
  }

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  });
}
