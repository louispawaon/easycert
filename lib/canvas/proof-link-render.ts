import QRCode from "qrcode";

/** Hard minimum render size for proof links (legacy floor). */
export const MIN_PROOF_LINK_RENDER_PX = 49;

/** Target pixels per QR module for reliable phone scanning. */
export const PROOF_LINK_TARGET_MODULE_PX = 4;

/** Reference canvas width used when template dimensions are unavailable. */
export const PROOF_LINK_REFERENCE_CANVAS_WIDTH = 1200;

/** Fallback sizePct when template width is unknown. */
export const PROOF_LINK_DEFAULT_SIZE_PCT = 0.04;

/** Slider lower bound — user may go smaller, with a scan warning. */
export const PROOF_LINK_SLIDER_MIN_SIZE_PCT = 0.04;

/** Slider upper bound. */
export const PROOF_LINK_SLIDER_MAX_SIZE_PCT = 0.45;

/** Max recommended sizePct cap for very small templates. */
export const PROOF_LINK_MAX_RECOMMENDED_SIZE_PCT = 0.6;

/** Clamp stored sizePct to the editor slider range. */
export function normalizeProofLinkSizePct(sizePct: number): number {
  if (!Number.isFinite(sizePct)) return PROOF_LINK_SLIDER_MIN_SIZE_PCT;
  return Math.min(
    PROOF_LINK_SLIDER_MAX_SIZE_PCT,
    Math.max(PROOF_LINK_SLIDER_MIN_SIZE_PCT, sizePct)
  );
}

/** Quiet zone around the code, in modules (QR spec recommends 4). */
export const PROOF_LINK_MARGIN_MODULES = 4;

export const PROOF_LINK_ERROR_CORRECTION = "M" as const;

export type ProofLinkRenderDimensions = {
  renderSize: number;
  modulePx: number;
};

function getProofLinkModuleCount(proofUrl: string): number {
  const qr = QRCode.create(proofUrl, {
    errorCorrectionLevel: PROOF_LINK_ERROR_CORRECTION,
  });
  return qr.modules.size;
}

function getTotalModuleCount(proofUrl: string): number {
  return getProofLinkModuleCount(proofUrl) + PROOF_LINK_MARGIN_MODULES * 2;
}

export function computeMinScannableRenderPx(proofUrl: string): number {
  return PROOF_LINK_TARGET_MODULE_PX * getTotalModuleCount(proofUrl);
}

/** Recommended sizePct for reliable scanning on a given template width. */
export function computeRecommendedProofLinkSizePct(
  canvasWidth: number,
  proofUrl: string
): number {
  const width =
    canvasWidth > 0 ? canvasWidth : PROOF_LINK_REFERENCE_CANVAS_WIDTH;
  const minRenderPx = computeMinScannableRenderPx(proofUrl);
  const pct = minRenderPx / width;
  return Math.min(
    PROOF_LINK_MAX_RECOMMENDED_SIZE_PCT,
    Math.max(PROOF_LINK_DEFAULT_SIZE_PCT, pct)
  );
}

/** @deprecated Use `computeRecommendedProofLinkSizePct` instead. */
export const computeMinProofLinkSizePct = computeRecommendedProofLinkSizePct;

export function computeProofLinkRenderDimensions(
  sizePct: number,
  canvasWidth: number,
  proofUrl: string
): ProofLinkRenderDimensions {
  const effectiveWidth = canvasWidth > 0 ? canvasWidth : PROOF_LINK_REFERENCE_CANVAS_WIDTH;
  const targetSize = Math.max(1, Math.round(sizePct * effectiveWidth));
  const totalModules = getTotalModuleCount(proofUrl);
  const modulePx = Math.max(1, Math.floor(targetSize / totalModules));
  const renderSize = modulePx * totalModules;
  return { renderSize, modulePx };
}

export function isProofLinkBelowRecommendedSize(
  sizePct: number,
  canvasWidth: number,
  proofUrl: string
): boolean {
  const recommended = computeRecommendedProofLinkSizePct(canvasWidth, proofUrl);
  const { renderSize } = computeProofLinkRenderDimensions(sizePct, canvasWidth, proofUrl);
  const recommendedRenderPx = computeMinScannableRenderPx(proofUrl);
  return sizePct < recommended || renderSize < recommendedRenderPx;
}
