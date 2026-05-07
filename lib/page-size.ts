/**
 * Page-size presets used by the PDF generator.
 *
 * `auto` derives the page dimensions from the source certificate image so the
 * output is edge-to-edge with no letterboxing. The fixed presets force the
 * given paper size; the cert is then "contain-fit" centered on the page,
 * preserving aspect at the cost of whitespace bands when aspects differ.
 */

export type PageSizeId =
  | "auto"
  | "a4-landscape"
  | "a4-portrait"
  | "letter-landscape"
  | "letter-portrait";

export type PageSizeOption = {
  id: PageSizeId;
  label: string;
  description: string;
};

export const PAGE_SIZE_OPTIONS: ReadonlyArray<PageSizeOption> = [
  {
    id: "auto",
    label: "Auto (edge-to-edge)",
    description: "Page size matches the certificate template. No whitespace.",
  },
  { id: "a4-landscape", label: "A4 Landscape", description: "297 x 210 mm" },
  { id: "a4-portrait", label: "A4 Portrait", description: "210 x 297 mm" },
  { id: "letter-landscape", label: "Letter Landscape", description: "11 x 8.5 in" },
  { id: "letter-portrait", label: "Letter Portrait", description: "8.5 x 11 in" },
];

export const DEFAULT_PAGE_SIZE: PageSizeId = "auto";

export type PageDimensionsMm = {
  widthMm: number;
  heightMm: number;
};

/** Standard CSS pixel → millimetre conversion (96 dpi reference). */
const PX_TO_MM = 25.4 / 96;

const FIXED_DIMENSIONS_MM: Record<Exclude<PageSizeId, "auto">, PageDimensionsMm> = {
  "a4-landscape": { widthMm: 297, heightMm: 210 },
  "a4-portrait": { widthMm: 210, heightMm: 297 },
  "letter-landscape": { widthMm: 279.4, heightMm: 215.9 },
  "letter-portrait": { widthMm: 215.9, heightMm: 279.4 },
};

/**
 * Resolve the physical page dimensions for a given preset. For `auto`, the
 * image's natural dimensions are converted to millimetres at 96 dpi, which
 * keeps the generated PDF at the same physical size as the screen
 * preview at 100% scale.
 */
export function resolvePageDimensions(
  pageSize: PageSizeId,
  imageWidthPx: number,
  imageHeightPx: number
): PageDimensionsMm {
  if (pageSize === "auto") {
    return {
      widthMm: Math.max(1, imageWidthPx * PX_TO_MM),
      heightMm: Math.max(1, imageHeightPx * PX_TO_MM),
    };
  }
  return FIXED_DIMENSIONS_MM[pageSize];
}

/** True when the cert should be drawn edge-to-edge (no letterboxing). */
export function isEdgeToEdge(pageSize: PageSizeId): boolean {
  return pageSize === "auto";
}
