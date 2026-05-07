import type { TextElement } from "@/types/types";
import { NAME_PLACEHOLDER } from "@/types/types";

const MIN_FONT_SIZE_PX = 10;

export type ResolvedText = {
  text: string;
  fontSize: number;
  width: number;
  height: number;
};

/**
 * Resolve the rendered text for an element given the optional attendee name.
 * For `name` elements, falls back to the placeholder when no attendee is provided.
 */
export function resolveElementText(
  element: TextElement,
  attendeeName?: string | null,
  namePlaceholder: string = NAME_PLACEHOLDER
): string {
  if (element.type === "name") {
    const trimmed = attendeeName?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : namePlaceholder;
  }
  return element.value ?? "";
}

function buildFontShorthand(
  style: TextElement["fontStyle"],
  weight: TextElement["fontWeight"],
  sizePx: number,
  family: string
): string {
  // Quote the family so multi-word names ("Times New Roman") still parse.
  return `${style} ${weight} ${sizePx}px "${family}"`;
}

/**
 * Compute the rendered font size after auto-shrink to fit `maxWidthPct`.
 * Returns null when the text is empty/whitespace and should not be drawn.
 */
export function measureTextElement(
  ctx: CanvasRenderingContext2D,
  text: string,
  element: TextElement,
  canvasWidth: number
): ResolvedText | null {
  if (!text || !text.trim()) return null;
  const fontStyle = element.fontStyle ?? "normal";
  const textDecoration = element.textDecoration ?? "none";

  const maxWidth = Math.max(0, element.maxWidthPct * canvasWidth);
  let fontSize = element.fontSize;
  ctx.font = buildFontShorthand(fontStyle, element.fontWeight, fontSize, element.fontFamily);
  let measured = ctx.measureText(text).width;

  if (measured > maxWidth && maxWidth > 0) {
    const shrunk = Math.floor(fontSize * (maxWidth / measured));
    fontSize = Math.max(MIN_FONT_SIZE_PX, shrunk);
    ctx.font = buildFontShorthand(fontStyle, element.fontWeight, fontSize, element.fontFamily);
    measured = ctx.measureText(text).width;
  }

  // Approximate text box height. Canvas does not expose line-height; use a 1.2 factor
  // matching typical CSS defaults for selection bbox sizing.
  const underlineExtra = textDecoration === "underline" ? Math.max(2, fontSize * 0.12) : 0;
  const height = fontSize * 1.2 + underlineExtra;
  return { text, fontSize, width: measured, height };
}

/**
 * Draw a single text element on the canvas, center-anchored on its (x, y) percentage.
 * Auto-shrinks the font to fit `maxWidthPct`. Wrap calls in save/restore so the
 * `textAlign`/`textBaseline` settings do not leak to other draws.
 */
export function drawTextElement(
  ctx: CanvasRenderingContext2D,
  text: string,
  element: TextElement,
  canvasWidth: number,
  canvasHeight: number
): void {
  const measurement = measureTextElement(ctx, text, element, canvasWidth);
  if (!measurement) return;
  const fontStyle = element.fontStyle ?? "normal";
  const textDecoration = element.textDecoration ?? "none";

  const x = element.x * canvasWidth;
  const y = element.y * canvasHeight;

  ctx.save();
  ctx.font = buildFontShorthand(
    fontStyle,
    element.fontWeight,
    measurement.fontSize,
    element.fontFamily
  );
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = element.color;
  ctx.fillText(measurement.text, x, y);
  if (textDecoration === "underline") {
    const underlineY = y + measurement.fontSize * 0.52;
    const underlineHalfWidth = measurement.width / 2;
    ctx.lineWidth = Math.max(1, measurement.fontSize * 0.06);
    ctx.beginPath();
    ctx.moveTo(x - underlineHalfWidth, underlineY);
    ctx.lineTo(x + underlineHalfWidth, underlineY);
    ctx.strokeStyle = element.color;
    ctx.stroke();
  }
  ctx.restore();
}

export type DrawCertificateOptions = {
  /** When provided, `name` elements render this attendee. Otherwise placeholder is used. */
  attendeeName?: string | null;
  /** Override the placeholder shown for `name` elements when no attendee is supplied. */
  namePlaceholder?: string;
};

/**
 * Render a full certificate (template + every text element) into the given canvas.
 * The canvas is sized to the natural template dimensions before drawing.
 */
export function drawCertificateToCanvas(
  canvas: HTMLCanvasElement,
  templateImg: HTMLImageElement,
  elements: TextElement[],
  options: DrawCertificateOptions = {}
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas 2d context");

  const w = templateImg.naturalWidth || templateImg.width;
  const h = templateImg.naturalHeight || templateImg.height;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(templateImg, 0, 0, w, h);

  for (const element of elements) {
    const text = resolveElementText(element, options.attendeeName, options.namePlaceholder);
    drawTextElement(ctx, text, element, w, h);
  }
}

export type ElementBBox = {
  id: string;
  type: TextElement["type"];
  /** Bounding box left edge in canvas pixels. */
  left: number;
  /** Bounding box top edge in canvas pixels. */
  top: number;
  width: number;
  height: number;
};

/**
 * Compute the post-shrink bounding boxes for each element. Used by the designer
 * to render transparent hit-test overlays over the canvas.
 */
export function measureElementBBoxes(
  ctx: CanvasRenderingContext2D,
  elements: TextElement[],
  canvasWidth: number,
  canvasHeight: number,
  options: DrawCertificateOptions = {}
): ElementBBox[] {
  const out: ElementBBox[] = [];
  for (const element of elements) {
    const text = resolveElementText(element, options.attendeeName, options.namePlaceholder);
    const m = measureTextElement(ctx, text, element, canvasWidth);
    if (!m) continue;
    const cx = element.x * canvasWidth;
    const cy = element.y * canvasHeight;
    out.push({
      id: element.id,
      type: element.type,
      left: cx - m.width / 2,
      top: cy - m.height / 2,
      width: m.width,
      height: m.height,
    });
  }
  return out;
}

export const __test = {
  buildFontShorthand,
  MIN_FONT_SIZE_PX,
};
