import type { TextElement, ProofLinkElement } from "@/types/types";
import { DYNAMIC_TEXT_PLACEHOLDER } from "@/types/types";
import { drawProofLinkElement } from "@/lib/canvas/draw-proof-link-element";
import { computeProofLinkRenderDimensions } from "@/lib/canvas/proof-link-render";
import { buildProofSizingPlaceholderUrl } from "@/lib/proof/url";

const MIN_FONT_SIZE_PX = 10;

export type ResolvedText = {
  text: string;
  fontSize: number;
  width: number;
  height: number;
};

export type RecordDrawContext = {
  recordLabel?: string | null;
  record?: Record<string, string> | null;
  headers?: string[];
  /** @deprecated Use `recordLabel` instead. */
  attendeeName?: string | null;
  /** @deprecated Use `record` instead. */
  attendeeRow?: Record<string, string> | null;
  /** @deprecated Use `headers` instead. */
  tableHeadersOrdered?: string[];
  /** @deprecated Not used in new model. */
  namePlaceholder?: string;
};

/** @deprecated Use `RecordDrawContext` instead. */
export type AttendeeDrawContext = RecordDrawContext;

export function resolveElementText(
  element: TextElement,
  drawCtx: RecordDrawContext = {}
): string {
  const namePlaceholder = (drawCtx as Record<string, unknown>).namePlaceholder as string | undefined ?? DYNAMIC_TEXT_PLACEHOLDER;

  if (element.type === "static") return element.value ?? "";

  const variable = element.variable ?? element.variableColumn;
  const row = drawCtx.record ?? drawCtx.attendeeRow ?? null;
  const keys = drawCtx.headers ?? drawCtx.tableHeadersOrdered ?? [];
  const primaryLine = (drawCtx.recordLabel ?? drawCtx.attendeeName ?? "").trim();
  let raw: string | undefined;

  if (variable) {
    const cell = row?.[variable]?.trim();
    raw =
      cell && cell.length > 0
        ? cell
        : primaryLine.length > 0
          ? primaryLine
          : undefined;
  } else if (row && keys.length > 0) {
    const firstKey = keys[0];
    const cell = firstKey !== undefined ? row[firstKey]?.trim() : "";
    raw =
      cell && cell.length > 0
        ? cell
        : primaryLine.length > 0
          ? primaryLine
          : undefined;
  } else {
    raw = primaryLine.length > 0 ? primaryLine : undefined;
  }

  if (raw !== undefined && raw.length > 0) return raw;
  if (variable) return `{${variable}}`;
  return namePlaceholder;
}

function buildFontShorthand(
  style: TextElement["fontStyle"],
  weight: TextElement["fontWeight"],
  sizePx: number,
  family: string
): string {
  return `${style} ${weight} ${sizePx}px "${family}"`;
}

export function measureTextElement(
  ctx: CanvasRenderingContext2D,
  text: string,
  element: TextElement,
  canvasWidth: number,
  scale = 1
): ResolvedText | null {
  if (!text || !text.trim()) return null;
  const fontStyle = element.fontStyle ?? "normal";
  const textDecoration = element.textDecoration ?? "none";

  const maxWidth = Math.max(0, element.maxWidthPct * canvasWidth);
  let fontSize = element.fontSize * scale;
  ctx.font = buildFontShorthand(fontStyle, element.fontWeight, fontSize, element.fontFamily);
  let measured = ctx.measureText(text).width;

  if (measured > maxWidth && maxWidth > 0) {
    const shrunk = Math.floor(fontSize * (maxWidth / measured));
    fontSize = Math.max(MIN_FONT_SIZE_PX, shrunk);
    ctx.font = buildFontShorthand(fontStyle, element.fontWeight, fontSize, element.fontFamily);
    measured = ctx.measureText(text).width;
  }

  const underlineExtra = textDecoration === "underline" ? Math.max(2, fontSize * 0.12) : 0;
  const height = fontSize * 1.2 + underlineExtra;
  return { text, fontSize, width: measured, height };
}

export function drawTextElement(
  ctx: CanvasRenderingContext2D,
  text: string,
  element: TextElement,
  canvasWidth: number,
  canvasHeight: number,
  scale = 1
): void {
  const measurement = measureTextElement(ctx, text, element, canvasWidth, scale);
  if (!measurement) return;
  const fontStyle = element.fontStyle ?? "normal";
  const textDecoration = element.textDecoration ?? "none";
  const textAlign = element.textAlign ?? "center";

  const x = element.x * canvasWidth;
  const y = element.y * canvasHeight;
  const maxWidth = Math.max(0, element.maxWidthPct * canvasWidth);
  const boxHalfWidth = maxWidth > 0 ? maxWidth / 2 : measurement.width / 2;
  const leftEdge = x - boxHalfWidth;
  const rightEdge = x + boxHalfWidth;
  const textX = textAlign === "left" ? leftEdge : textAlign === "right" ? rightEdge : x;
  const underlineStartX = textAlign === "left" ? leftEdge : textAlign === "right" ? rightEdge - measurement.width : x - measurement.width / 2;
  const underlineEndX = textAlign === "left" ? leftEdge + measurement.width : textAlign === "right" ? rightEdge : x + measurement.width / 2;

  ctx.save();
  ctx.font = buildFontShorthand(
    fontStyle,
    element.fontWeight,
    measurement.fontSize,
    element.fontFamily
  );
  ctx.textAlign = textAlign;
  ctx.textBaseline = "middle";
  ctx.fillStyle = element.color;
  ctx.fillText(measurement.text, textX, y);
  if (textDecoration === "underline") {
    const underlineY = y + measurement.fontSize * 0.52;
    ctx.lineWidth = Math.max(1, measurement.fontSize * 0.06);
    ctx.beginPath();
    ctx.moveTo(underlineStartX, underlineY);
    ctx.lineTo(underlineEndX, underlineY);
    ctx.strokeStyle = element.color;
    ctx.stroke();
  }
  ctx.restore();
}

export async function renderToCanvas(
  canvas: HTMLCanvasElement,
  templateImg: HTMLImageElement,
  textElements: TextElement[],
  proofLinkElements: ProofLinkElement[],
  issuer: string,
  options: RecordDrawContext = {},
  proofUrl?: string,
  scale = 1
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas 2d context");

  const w = Math.round((templateImg.naturalWidth || templateImg.width) * scale);
  const h = Math.round((templateImg.naturalHeight || templateImg.height) * scale);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(templateImg, 0, 0, w, h);

  for (const element of textElements) {
    const text = resolveElementText(element, options);
    drawTextElement(ctx, text, element, w, h, scale);
  }

  for (const el of proofLinkElements) {
    const url = proofUrl || "https://ditto.example/proof/PLACEHOLDER";
    await drawProofLinkElement(ctx, { proofLinkElement: el, canvasWidth: w, canvasHeight: h, proofUrl: url });
  }
}

export type ElementBBox = {
  id: string;
  type: "dynamic-text" | "static" | "name" | "proof-link" | "qr";
  left: number;
  top: number;
  width: number;
  height: number;
};

export function measureElementBBoxes(
  ctx: CanvasRenderingContext2D,
  textElements: TextElement[],
  proofLinkElements: ProofLinkElement[],
  canvasWidth: number,
  canvasHeight: number,
  options: RecordDrawContext = {},
  proofUrl?: string
): ElementBBox[] {
  const out: ElementBBox[] = [];
  const sizingUrl = proofUrl ?? buildProofSizingPlaceholderUrl();

  for (const element of textElements) {
    const text = resolveElementText(element, options);
    const m = measureTextElement(ctx, text, element, canvasWidth);
    if (!m) continue;
    const cx = element.x * canvasWidth;
    const cy = element.y * canvasHeight;
    const maxWidth = Math.max(0, element.maxWidthPct * canvasWidth);
    const boxHalfWidth = maxWidth > 0 ? maxWidth / 2 : m.width / 2;
    const leftEdge = cx - boxHalfWidth;
    const rightEdge = cx + boxHalfWidth;
    const left = element.textAlign === "left" ? leftEdge : element.textAlign === "right" ? rightEdge - m.width : cx - m.width / 2;

    out.push({
      id: element.id,
      type: element.type,
      left,
      top: cy - m.height / 2,
      width: m.width,
      height: m.height,
    });
  }

  for (const el of proofLinkElements) {
    const { renderSize } = computeProofLinkRenderDimensions(el.sizePct, canvasWidth, sizingUrl);
    const cx = el.x * canvasWidth;
    const cy = el.y * canvasHeight;
    out.push({
      id: el.id,
      type: el.type,
      left: cx - renderSize / 2,
      top: cy - renderSize / 2,
      width: renderSize,
      height: renderSize,
    });
  }

  return out;
}

export const __test = {
  buildFontShorthand,
  MIN_FONT_SIZE_PX,
};
