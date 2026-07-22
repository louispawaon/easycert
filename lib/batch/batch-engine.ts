import JSZip from "jszip";
import type { TextElement, ProofLinkElement, ImageDimensions } from "@/types/types";
import {
  renderToCanvas,
  type RecordDrawContext,
} from "@/lib/canvas/draw-text-element";
import { awaitFontsReady } from "@/lib/canvas/await-fonts";
import { createReusableCanvas } from "@/lib/batch/canvas-pool";
import { yieldToMain } from "@/lib/batch/yield";
import { buildProofUrl } from "@/lib/proof/url";
import { generatePDF } from "@/lib/pdf";
import {
  resolveFilenameForRecord,
  containerStemForPattern,
  type FilenameContext,
} from "@/lib/output/filename-pattern";
import type {
  OutputSettings,
  OutputFormat,
} from "@/lib/output/output-settings";

export type BatchPhase = "rendering" | "zipping" | "done" | "cancelled";

export type BatchProgress = {
  current: number;
  total: number;
  phase: BatchPhase;
  currentName?: string;
};

export type BatchOptions = {
  imageUrl: string;
  recordDrawOptions: RecordDrawContext[];
  textElements: TextElement[];
  proofLinkElements: ProofLinkElement[];
  issuer: string;
  proofTokens?: string[];
  imageDimensions: ImageDimensions;
  pngFilenamePrefix?: string;
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
    img.onerror = () => reject(new Error("Failed to load design template"));
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

function uniqueZipFilename(
  used: Set<string>,
  stem: string,
  ext: string
): string {
  let candidate = `${stem}.${ext}`;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${stem}-${n}.${ext}`;
    n++;
  }
  used.add(candidate);
  return candidate;
}

function currentName(ctx: RecordDrawContext | undefined): string | undefined {
  return (ctx?.recordLabel ?? ctx?.attendeeName) ?? undefined;
}

export function sanitizeOutputBasename(
  raw: string,
  emptyFallback = "Output"
): string {
  const cleaned = raw.replace(/[\\/:*?"<>|\x00-\x1f]/g, "").trim();
  return cleaned.length > 0 ? cleaned : emptyFallback;
}

export function sanitizeRecordForFilename(
  name: string,
  index: number
): string {
  const cleaned = name.replace(/[\\/:*?"<>|\x00-\x1f]/g, "").trim();
  return cleaned.length > 0 ? cleaned : `record_${index + 1}`;
}

function validateBatchInputs(opts: BatchOptions): void {
  if (!opts.imageUrl) {
    throw new Error("No design template available");
  }
  if (opts.recordDrawOptions.length === 0) {
    throw new Error("No records provided");
  }
  if (
    !opts.textElements.some(
      (el) => el.type === "dynamic-text" || el.type === "name"
    )
  ) {
    throw new Error("At least one dynamic text element is required");
  }
}

function buildFilenameCtx(
  drawCtx: RecordDrawContext,
  i: number
): FilenameContext {
  return {
    recordLabel: drawCtx.recordLabel,
    record: drawCtx.record ?? null,
    headers: drawCtx.headers ?? [],
    index: i + 1,
  };
}

function mimeForFormat(format: OutputFormat): string {
  switch (format) {
    case "webp":
      return "image/webp";
    default:
      return "image/png";
  }
}

function extForFormat(format: OutputFormat): string {
  switch (format) {
    case "webp":
      return "webp";
    default:
      return "png";
  }
}

async function generateRasterZip(
  settings: OutputSettings,
  opts: BatchOptions,
  mimeType: string,
  ext: string
): Promise<Blob> {
  const chunkSize = Math.max(1, opts.chunkSize ?? DEFAULT_CHUNK_SIZE);
  const total = opts.recordDrawOptions.length;
  const scale = settings.scale;
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
      currentName: currentName(opts.recordDrawOptions[0]),
    });

    for (let i = 0; i < total; i++) {
      throwIfAborted(opts.signal);

      const drawCtx = opts.recordDrawOptions[i];
      const proofUrl =
        opts.proofLinkElements.length > 0 && opts.proofTokens
          ? buildProofUrl(opts.proofTokens[i]!)
          : undefined;

      await renderToCanvas(
        canvas,
        templateImg,
        opts.textElements,
        opts.proofLinkElements,
        opts.issuer,
        drawCtx,
        proofUrl,
        scale
      );

      const blob = await canvasToBlob(canvas, mimeType, 0.92);
      const arrayBuffer = await blob.arrayBuffer();
      const stem = resolveFilenameForRecord(
        settings.filenamePattern,
        buildFilenameCtx(drawCtx, i)
      );
      const filename = uniqueZipFilename(usedZipNames, stem, ext);

      zip.file(filename, arrayBuffer, {
        binary: true,
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      opts.onProgress?.({
        current: i + 1,
        total,
        phase: "rendering",
        currentName: currentName(opts.recordDrawOptions[i + 1]),
      });

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

async function renderPngDataUrls(
  settings: OutputSettings,
  opts: BatchOptions
): Promise<string[]> {
  const chunkSize = Math.max(1, opts.chunkSize ?? DEFAULT_CHUNK_SIZE);
  const total = opts.recordDrawOptions.length;
  const scale = settings.scale;
  const { canvas, dispose } = createReusableCanvas();
  const dataUrls: string[] = [];

  try {
    await awaitFontsReady(opts.textElements);
    throwIfAborted(opts.signal);

    const templateImg = await loadImage(opts.imageUrl);
    throwIfAborted(opts.signal);

    opts.onProgress?.({
      current: 0,
      total,
      phase: "rendering",
      currentName: currentName(opts.recordDrawOptions[0]),
    });

    for (let i = 0; i < total; i++) {
      throwIfAborted(opts.signal);

      const drawCtx = opts.recordDrawOptions[i];
      const proofUrl =
        opts.proofLinkElements.length > 0 && opts.proofTokens
          ? buildProofUrl(opts.proofTokens[i]!)
          : undefined;

      await renderToCanvas(
        canvas,
        templateImg,
        opts.textElements,
        opts.proofLinkElements,
        opts.issuer,
        drawCtx,
        proofUrl,
        scale
      );

      const dataUrl = canvas.toDataURL("image/png", 0.92);
      if (!dataUrl) throw new Error("Failed to generate image data URL");
      dataUrls.push(dataUrl);

      opts.onProgress?.({
        current: i + 1,
        total,
        phase: "rendering",
        currentName: currentName(opts.recordDrawOptions[i + 1]),
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

async function generatePdfOutput(
  settings: OutputSettings,
  opts: BatchOptions
): Promise<Blob> {
  const dataUrls = await renderPngDataUrls(settings, opts);
  if (opts.signal?.aborted) throw new BatchAbortError();

  const stem = containerStemForPattern(settings.filenamePattern);
  const filename = `${stem}.pdf`;

  const sourceImageDimensions = {
    width: opts.imageDimensions.width,
    height: opts.imageDimensions.height,
  };

  return generatePDF(dataUrls, filename, {
    pageSize: settings.pageSize,
    sourceImageDimensions,
  });
}

async function generateRasterWithPdf(
  settings: OutputSettings,
  opts: BatchOptions,
  mimeType: string,
  ext: string
): Promise<Blob> {
  const chunkSize = Math.max(1, opts.chunkSize ?? DEFAULT_CHUNK_SIZE);
  const total = opts.recordDrawOptions.length;
  const scale = settings.scale;
  const { canvas, dispose } = createReusableCanvas();
  const pngDataUrls: string[] = [];

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
      currentName: currentName(opts.recordDrawOptions[0]),
    });

    for (let i = 0; i < total; i++) {
      throwIfAborted(opts.signal);

      const drawCtx = opts.recordDrawOptions[i];
      const proofUrl =
        opts.proofLinkElements.length > 0 && opts.proofTokens
          ? buildProofUrl(opts.proofTokens[i]!)
          : undefined;

      await renderToCanvas(
        canvas,
        templateImg,
        opts.textElements,
        opts.proofLinkElements,
        opts.issuer,
        drawCtx,
        proofUrl,
        scale
      );

      const rasterBlob = await canvasToBlob(canvas, mimeType, 0.92);
      const arrayBuffer = await rasterBlob.arrayBuffer();
      const stem = resolveFilenameForRecord(
        settings.filenamePattern,
        buildFilenameCtx(drawCtx, i)
      );
      const filename = uniqueZipFilename(usedZipNames, stem, ext);

      zip.file(filename, arrayBuffer, {
        binary: true,
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const pngDataUrl = canvas.toDataURL("image/png", 0.92);
      if (!pngDataUrl) throw new Error("Failed to generate PNG data URL");
      pngDataUrls.push(pngDataUrl);

      opts.onProgress?.({
        current: i + 1,
        total,
        phase: "rendering",
        currentName: currentName(opts.recordDrawOptions[i + 1]),
      });

      if ((i + 1) % chunkSize === 0 && i + 1 < total) {
        await yieldToMain();
      }
    }

    throwIfAborted(opts.signal);
    opts.onProgress?.({ current: total, total, phase: "zipping" });

    const pdfStem = containerStemForPattern(settings.filenamePattern);
    const pdfFilename = `${pdfStem}.pdf`;

    const sourceImageDimensions = {
      width: opts.imageDimensions.width,
      height: opts.imageDimensions.height,
    };

    const pdfBlob = await generatePDF(pngDataUrls, pdfFilename, {
      pageSize: settings.pageSize,
      sourceImageDimensions,
    });

    throwIfAborted(opts.signal);

    zip.file(pdfFilename, await pdfBlob.arrayBuffer(), {
      binary: true,
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

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

export async function generateOutputBatch(
  settings: OutputSettings,
  opts: BatchOptions
): Promise<Blob> {
  validateBatchInputs(opts);

  const { format, bundle } = settings;

  if (format === "pdf") {
    return generatePdfOutput(settings, opts);
  }

  const mimeType = mimeForFormat(format);
  const ext = extForFormat(format);

  if (bundle === "with-pdf") {
    return generateRasterWithPdf(settings, opts, mimeType, ext);
  }

  return generateRasterZip(settings, opts, mimeType, ext);
}

export async function generateOutputsBatch(
  opts: BatchOptions
): Promise<Blob> {
  const { pngFilenamePrefix, ...rest } = opts;
  return generateOutputBatch(
    {
      format: "png",
      scale: 1,
      filenamePattern: `${pngFilenamePrefix ?? "output"}_{name}`,
      pageSize: "auto",
      bundle: "standalone",
    },
    rest
  );
}

export async function generateImageBatch(
  opts: BatchOptions
): Promise<string[]> {
  return renderPngDataUrls(
    {
      format: "png",
      scale: 1,
      filenamePattern: "output_{name}",
      pageSize: "auto",
      bundle: "standalone",
    },
    opts
  );
}

/** @deprecated Use `generateOutputsBatch` instead. */
export { generateOutputsBatch as generateCertificatesBatch };
/** @deprecated Use `generateImageBatch` instead. */
export { generateImageBatch as generateCertificateImagesBatch };
/** @deprecated Use `sanitizeRecordForFilename` instead. */
export { sanitizeRecordForFilename as sanitizeAttendeeForFilename };
