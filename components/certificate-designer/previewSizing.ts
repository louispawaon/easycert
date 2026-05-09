export const PREVIEW_ZOOM_MIN = 1;
export const PREVIEW_ZOOM_MAX = 2;
export const PREVIEW_ZOOM_STEP = 0.1;
export const PREVIEW_ZOOM_DEFAULT = 1;

export const DESIGN_PREVIEW_HEIGHT = {
  minPx: 280,
  maxPx: 640,
  viewport: "56vh",
  emptyMinPx: 320,
} as const;

export const CERTIFICATE_PREVIEW_HEIGHT = {
  minPx: 280,
  maxPx: 640,
  viewport: "56vh",
} as const;

export function clampPreviewZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return PREVIEW_ZOOM_DEFAULT;
  return Math.min(PREVIEW_ZOOM_MAX, Math.max(PREVIEW_ZOOM_MIN, Number(zoom.toFixed(2))));
}

export function buildAdaptiveHeight(minPx: number, viewport: string, maxPx: number): string {
  return `clamp(${minPx}px, ${viewport}, ${maxPx}px)`;
}
