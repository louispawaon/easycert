import JSZip from "jszip";
import type { TextElement, ImageDimensions } from "@/types/types";
import {
  drawCertificateToCanvas,
  type DrawCertificateOptions,
} from "@/lib/canvas/draw-text-element";
import { awaitFontsReady } from "@/lib/canvas/await-fonts";
import { createReusableCanvas } from "@/lib/batch/canvas-pool";
import { yieldToMain } from "@/lib/batch/yield";

export type BatchPhase = "rendering" | "zipping" | "done" | "cancelled";

export type BatchProgress = {
  current: number;
  total: number;
  phase: BatchPhase;
  currentName?: string;
};

export type BatchOptions = {
  imageUrl: string;
  /** One draw context per output certificate (CSV row + display line fallback). */
  attendeeDrawOptions: DrawCertificateOptions[];
  textElements: TextElement[];
  imageDimensions: ImageDimensions;
  /** Prefix for each PNG inside the ZIP (`{prefix}_{sanitizedName}.png`). Omits path chars; defaults to `certificate` when unset. */
  pngFilenamePrefix?: string;
  /** Number of certificates rendered between event-loop yields. Default: 5. */
  chunkSize?: number;
  onProgress?: (progress: BatchProgress) => void;
  signal?: AbortSignal;
};

export class BatchAbortError extends Error {
  constructor() {
    super("Batch generation was cancelled");
    this.name = "BatchAbortError";
  }
}

const DEFAULT_CHUNK_SIZE = 5;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load certificate template"));
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to encode canvas to blob"));
      },
      type,
      quality
    );
  });
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new BatchAbortError();
}

/** Avoid duplicate ZIP entries when sanitized attendee names collide. */
function uniqueZipPngFilename(used: Set<string>, stem: string): string {
  let candidate = `${stem}.png`;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${stem}-${n}.png`;
    n++;
  }
  used.add(candidate);
  return candidate;
}

export function sanitizeOutputBasename(raw: string, emptyFallback = "Certificate"): string {
  const cleaned = raw.replace(/[\\/:*?"<>|\x00-\x1f]/g, "").trim();
  return cleaned.length > 0 ? cleaned : emptyFallback;
}

export function sanitizeAttendeeForFilename(name: string, index: number): string {
  // Strip path separators and control chars; fall back to index if empty.
  const cleaned = name.replace(/[\\/:*?"<>|\x00-\x1f]/g, "").trim();
  return cleaned.length > 0 ? cleaned : `attendee_${index + 1}`;
}

/**
 * Validate inputs shared by every batch entry point. Throws with a single
 * caller-friendly message so the hook can surface it via toast.
 */
function validateBatchInputs(opts: BatchOptions): void {
  if (!opts.imageUrl) {
    throw new Error("No certificate template available");
  }
  if (opts.attendeeDrawOptions.length === 0) {
    throw new Error("No attendees provided");
  }
  if (!opts.textElements.some((el) => el.type === "name")) {
    throw new Error("At least one name placeholder is required");
  }
}

/**
 * Render every attendee into a JSZip archive in chunks, reusing a single
 * canvas and a single decoded template image. The archive Blob is returned
 * to the caller for download.
 *
 * Memory characteristics:
 * - Peak in-memory PNG payload: 1 (current canvas blob) + cumulative ZIP
 *   contents inside JSZip, instead of N decoded data URLs.
 * - Template bitmap: decoded once.
 * - Canvas backing store: a single reusable canvas, disposed in `finally`.
 */
export async function generateCertificatesBatch(
  opts: BatchOptions
): Promise<Blob> {
  validateBatchInputs(opts);
  const chunkSize = Math.max(1, opts.chunkSize ?? DEFAULT_CHUNK_SIZE);
  const total = opts.attendeeDrawOptions.length;
  const { canvas, dispose } = createReusableCanvas();

  try {
    await awaitFontsReady(opts.textElements);
    throwIfAborted(opts.signal);

    const templateImg = await loadImage(opts.imageUrl);
    throwIfAborted(opts.signal);

    const zip = new JSZip();
    const usedZipNames = new Set<string>();

    opts.onProgress?.({
      current: 0,
      total,
      phase: "rendering",
      currentName: opts.attendeeDrawOptions[0]?.attendeeName ?? undefined,
    });

    for (let i = 0; i < total; i++) {
      throwIfAborted(opts.signal);

      const drawCtx = opts.attendeeDrawOptions[i];
      drawCertificateToCanvas(canvas, templateImg, opts.textElements, drawCtx);

      const blob = await canvasToBlob(canvas, "image/png", 0.92);
      const arrayBuffer = await blob.arrayBuffer();
      const prefix =
        opts.pngFilenamePrefix !== undefined
          ? sanitizeOutputBasename(opts.pngFilenamePrefix, "certificate")
          : "certificate";
      const line = (drawCtx.attendeeName ?? "").trim();
      const stem = `${prefix}_${sanitizeAttendeeForFilename(line, i)}`;
      const filename = uniqueZipPngFilename(usedZipNames, stem);

      zip.file(filename, arrayBuffer, {
        binary: true,
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      opts.onProgress?.({
        current: i + 1,
        total,
        phase: "rendering",
        currentName: opts.attendeeDrawOptions[i + 1]?.attendeeName ?? undefined,
      });

      // Yield to the main thread between chunks so the browser can paint
      // the new progress and process a pending cancel click.
      if ((i + 1) % chunkSize === 0 && i + 1 < total) {
        await yieldToMain();
      }
    }

    throwIfAborted(opts.signal);

    opts.onProgress?.({ current: total, total, phase: "zipping" });

    const archive = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    opts.onProgress?.({ current: total, total, phase: "done" });
    return archive;
  } catch (err) {
    if (err instanceof BatchAbortError) {
      opts.onProgress?.({ current: 0, total, phase: "cancelled" });
    }
    throw err;
  } finally {
    dispose();
  }
}

/**
 * Render every attendee into PNG data URLs for PDF generation.
 *
 * Same memory and yielding rules as `generateCertificatesBatch`, except the
 * caller is on the hook for the resulting strings -- expect ~3-5MB per
 * full-resolution certificate. PDF callers should either stream into jsPDF
 * page-by-page or accept the temporary peak.
 */
export async function generateCertificateImagesBatch(
  opts: BatchOptions
): Promise<string[]> {
  validateBatchInputs(opts);
  const chunkSize = Math.max(1, opts.chunkSize ?? DEFAULT_CHUNK_SIZE);
  const total = opts.attendeeDrawOptions.length;
  const { canvas, dispose } = createReusableCanvas();

  try {
    await awaitFontsReady(opts.textElements);
    throwIfAborted(opts.signal);

    const templateImg = await loadImage(opts.imageUrl);
    throwIfAborted(opts.signal);

    const dataUrls: string[] = [];

    opts.onProgress?.({
      current: 0,
      total,
      phase: "rendering",
      currentName: opts.attendeeDrawOptions[0]?.attendeeName ?? undefined,
    });

    for (let i = 0; i < total; i++) {
      throwIfAborted(opts.signal);

      const drawCtx = opts.attendeeDrawOptions[i];
      drawCertificateToCanvas(canvas, templateImg, opts.textElements, drawCtx);

      const dataUrl = canvas.toDataURL("image/png", 0.92);
      if (!dataUrl) throw new Error("Failed to generate image data URL");
      dataUrls.push(dataUrl);

      opts.onProgress?.({
        current: i + 1,
        total,
        phase: "rendering",
        currentName: opts.attendeeDrawOptions[i + 1]?.attendeeName ?? undefined,
      });

      if ((i + 1) % chunkSize === 0 && i + 1 < total) {
        await yieldToMain();
      }
    }

    throwIfAborted(opts.signal);
    opts.onProgress?.({ current: total, total, phase: "done" });
    return dataUrls;
  } catch (err) {
    if (err instanceof BatchAbortError) {
      opts.onProgress?.({ current: 0, total, phase: "cancelled" });
    }
    throw err;
  } finally {
    dispose();
  }
}
