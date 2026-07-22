/** @deprecated Use `@/lib/canvas/proof-link-render` instead. */
export {
  MIN_PROOF_LINK_RENDER_PX as MIN_QR_RENDER_PX,
  PROOF_LINK_REFERENCE_CANVAS_WIDTH as QR_REFERENCE_CANVAS_WIDTH,
  PROOF_LINK_DEFAULT_SIZE_PCT as QR_DEFAULT_SIZE_PCT,
  normalizeProofLinkSizePct as normalizeQrSizePct,
  PROOF_LINK_MARGIN_MODULES as QR_MARGIN_MODULES,
  PROOF_LINK_ERROR_CORRECTION as QR_ERROR_CORRECTION,
  computeProofLinkRenderDimensions as computeQrRenderDimensions,
} from "@/lib/canvas/proof-link-render";
export type { ProofLinkRenderDimensions as QrRenderDimensions } from "@/lib/canvas/proof-link-render";
