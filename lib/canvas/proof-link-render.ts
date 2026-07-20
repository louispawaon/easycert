import QRCode from "qrcode";

/** Hard minimum render size for proof links. */
export const MIN_PROOF_LINK_RENDER_PX = 49;

/** Reference canvas width used for default % sizing in the editor. */
export const PROOF_LINK_REFERENCE_CANVAS_WIDTH = 1200;

/** Default sizePct; on a 1200px-wide template this renders at MIN_PROOF_LINK_RENDER_PX. */
export const PROOF_LINK_DEFAULT_SIZE_PCT = 0.04;

/** Previous default size values — migrated to PROOF_LINK_DEFAULT_SIZE_PCT on load. */
const LEGACY_PROOF_LINK_SIZE_PCTS = [0.12, 0.14, 0.18, 0.22];

export function normalizeProofLinkSizePct(sizePct: number): number {
  if (sizePct < PROOF_LINK_DEFAULT_SIZE_PCT || LEGACY_PROOF_LINK_SIZE_PCTS.includes(sizePct)) {
    return PROOF_LINK_DEFAULT_SIZE_PCT;
  }
  return sizePct;
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

export function computeProofLinkRenderDimensions(
  sizePct: number,
  canvasWidth: number,
  proofUrl: string
): ProofLinkRenderDimensions {
  const targetSize = Math.max(1, Math.round(sizePct * canvasWidth));
  const modules = getProofLinkModuleCount(proofUrl);
  const totalModules = modules + PROOF_LINK_MARGIN_MODULES * 2;
  let modulePx = Math.max(1, Math.floor(targetSize / totalModules));
  let renderSize = modulePx * totalModules;

  const minModulePx = Math.ceil(MIN_PROOF_LINK_RENDER_PX / totalModules);
  if (renderSize < MIN_PROOF_LINK_RENDER_PX) {
    modulePx = Math.max(modulePx, minModulePx);
    renderSize = modulePx * totalModules;
  }

  return { renderSize, modulePx };
}
