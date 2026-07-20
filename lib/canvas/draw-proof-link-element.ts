import type { ProofLinkElement } from "@/types/types";
import QRCode from "qrcode";
import {
  computeProofLinkRenderDimensions,
  PROOF_LINK_ERROR_CORRECTION,
  PROOF_LINK_MARGIN_MODULES,
} from "@/lib/canvas/proof-link-render";

export type ProofLinkRenderOptions = {
  proofLinkElement: ProofLinkElement;
  canvasWidth: number;
  canvasHeight: number;
  proofUrl: string;
};

export async function drawProofLinkElement(
  ctx: CanvasRenderingContext2D,
  options: ProofLinkRenderOptions
): Promise<void> {
  const { proofLinkElement, canvasWidth, canvasHeight, proofUrl } = options;

  const { renderSize, modulePx } = computeProofLinkRenderDimensions(
    proofLinkElement.sizePct,
    canvasWidth,
    proofUrl
  );

  const qrCanvas = document.createElement("canvas");
  qrCanvas.width = renderSize;
  qrCanvas.height = renderSize;

  await QRCode.toCanvas(qrCanvas, proofUrl, {
    scale: modulePx,
    margin: PROOF_LINK_MARGIN_MODULES,
    color: {
      dark: proofLinkElement.color,
      light: proofLinkElement.transparentBg ? "#ffffff00" : proofLinkElement.bgColor,
    },
    errorCorrectionLevel: PROOF_LINK_ERROR_CORRECTION,
  });

  const cx = proofLinkElement.x * canvasWidth;
  const cy = proofLinkElement.y * canvasHeight;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qrCanvas, cx - renderSize / 2, cy - renderSize / 2, renderSize, renderSize);
  ctx.restore();
}
