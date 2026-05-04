import type { TextElement, ImageDimensions } from "@/types/types";

/**
 * The old preview frame was always 500px tall with proportional width derived
 * from the template's natural aspect ratio. Coordinates and font sizes were
 * stored in that pixel space. We need both dimensions to migrate to fractions
 * of the full-resolution canvas.
 */
const LEGACY_PREVIEW_HEIGHT = 500;

/**
 * Default reference template dimensions used when the live `imageDimensions`
 * are unknown at migration time. Matches the audit fallback (800x566 preview).
 * If the actual template is loaded later, percentages are unaffected because
 * the legacy x/y were already preview-relative.
 */
export const FALLBACK_REFERENCE_DIMENSIONS: ImageDimensions = { width: 800, height: 566 };

export type LegacyTextElement = Partial<TextElement> & {
  text?: string;
  value?: string | null;
  isDragging?: boolean;
  fontStyle?: string;
  textDecoration?: string;
  textAlign?: string;
  lineHeight?: number;
  individualAdjustments?: Record<string, { x: number; y: number }>;
  fontWeight?: string | number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  type?: TextElement["type"];
  id?: string;
  x?: number;
  y?: number;
  maxWidthPct?: number;
};

function legacyPreviewWidth(image: ImageDimensions): number {
  if (!image.width || !image.height) return FALLBACK_REFERENCE_DIMENSIONS.width;
  return (LEGACY_PREVIEW_HEIGHT / image.height) * image.width;
}

function coerceFontWeight(raw: unknown): TextElement["fontWeight"] {
  if (raw === "bold") return "bold";
  if (typeof raw === "number" && raw >= 600) return "bold";
  return "normal";
}

function isLegacyShape(el: LegacyTextElement): boolean {
  // Legacy elements either expose `text` instead of `value`, or carry pixel
  // coordinates (>1) or omit `maxWidthPct`.
  if ("text" in el && !("value" in el)) return true;
  if (el.maxWidthPct === undefined) return true;
  if (typeof el.x === "number" && el.x > 1.0001) return true;
  if (typeof el.y === "number" && el.y > 1.0001) return true;
  return false;
}

function defaultMaxWidthPct(type: TextElement["type"]): number {
  return type === "name" ? 0.7 : 0.6;
}

/**
 * Migrate a single text element from the legacy schema (or partial new schema)
 * to the strict new shape. Idempotent: passing a fully-migrated element through
 * returns an equivalent record.
 *
 * `imageDimensions` should be the natural size of the template that was active
 * when the element was placed. When unknown, pass `FALLBACK_REFERENCE_DIMENSIONS`.
 */
export function migrateTextElement(
  raw: unknown,
  imageDimensions: ImageDimensions = FALLBACK_REFERENCE_DIMENSIONS
): TextElement | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const el = raw as LegacyTextElement;

  if (typeof el.id !== "string" || !el.id.trim()) return null;
  if (el.type !== "name" && el.type !== "static") return null;
  if (typeof el.fontSize !== "number" || !Number.isFinite(el.fontSize)) return null;
  if (typeof el.fontFamily !== "string") return null;
  if (typeof el.color !== "string") return null;
  if (typeof el.x !== "number" || !Number.isFinite(el.x)) return null;
  if (typeof el.y !== "number" || !Number.isFinite(el.y)) return null;

  const legacy = isLegacyShape(el);

  let x = el.x;
  let y = el.y;
  let fontSize = el.fontSize;
  let maxWidthPct = el.maxWidthPct ?? defaultMaxWidthPct(el.type);

  if (legacy) {
    const refW = legacyPreviewWidth(imageDimensions) || FALLBACK_REFERENCE_DIMENSIONS.width;
    const refH = LEGACY_PREVIEW_HEIGHT;

    if (x > 1.0001) x = x / refW;
    if (y > 1.0001) y = y / refH;
    // Old fontSize was in preview-pixel space (500-tall). Scale to full resolution.
    if (imageDimensions.height > 0) {
      fontSize = fontSize * (imageDimensions.height / LEGACY_PREVIEW_HEIGHT);
    }
    // Old schema lacked maxWidthPct entirely — apply a sensible default that
    // roughly preserves the old "right-edge of canvas" implicit max width.
    if (el.maxWidthPct === undefined) {
      maxWidthPct = Math.min(1, Math.max(0.1, 1 - x));
    }
  }

  // Clamp to legal ranges so a malformed file cannot break downstream draws.
  x = Math.min(1, Math.max(0, x));
  y = Math.min(1, Math.max(0, y));
  maxWidthPct = Math.min(1, Math.max(0.05, maxWidthPct));
  fontSize = Math.max(1, fontSize);

  let value: string | null;
  if (el.type === "name") {
    value = null;
  } else if (typeof el.value === "string") {
    value = el.value;
  } else if (typeof el.text === "string") {
    value = el.text;
  } else {
    value = "";
  }

  const migrated: TextElement = {
    id: el.id,
    type: el.type,
    x,
    y,
    maxWidthPct,
    fontSize,
    fontFamily: el.fontFamily,
    fontWeight: coerceFontWeight(el.fontWeight),
    color: el.color,
    value,
  };
  return migrated;
}

/**
 * Migrate a list of text elements. Drops any that fail validation rather than
 * failing the whole load — a single corrupted element should not block an
 * otherwise-recoverable project.
 */
export function migrateTextElements(
  raw: unknown,
  imageDimensions?: ImageDimensions
): TextElement[] {
  if (!Array.isArray(raw)) return [];
  const out: TextElement[] = [];
  for (const item of raw) {
    const m = migrateTextElement(item, imageDimensions);
    if (m) out.push(m);
  }
  return out;
}

/**
 * Returns true when the array contains any element written in the legacy
 * shape. Used by the persistence layer to decide whether to rewrite the
 * stored record after migration.
 */
export function hasLegacyTextElements(raw: unknown): boolean {
  if (!Array.isArray(raw)) return false;
  for (const item of raw) {
    if (item && typeof item === "object" && !Array.isArray(item) && isLegacyShape(item as LegacyTextElement)) {
      return true;
    }
  }
  return false;
}
