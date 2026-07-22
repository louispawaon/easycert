import type { ElementBBox } from "@/lib/canvas/draw-text-element";

export type CanvasBoundsStatus = "visible" | "partially-clipped" | "fully-outside";

export function classifyBBoxAgainstCanvas(
  left: number,
  top: number,
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number
): CanvasBoundsStatus {
  if (width <= 0 || height <= 0 || canvasWidth <= 0 || canvasHeight <= 0) {
    return "visible";
  }

  const right = left + width;
  const bottom = top + height;

  if (right <= 0 || bottom <= 0 || left >= canvasWidth || top >= canvasHeight) {
    return "fully-outside";
  }

  if (left < 0 || top < 0 || right > canvasWidth || bottom > canvasHeight) {
    return "partially-clipped";
  }

  return "visible";
}

export function classifyElementBBoxAgainstCanvas(
  bbox: Pick<ElementBBox, "left" | "top" | "width" | "height">,
  canvasWidth: number,
  canvasHeight: number
): CanvasBoundsStatus {
  return classifyBBoxAgainstCanvas(
    bbox.left,
    bbox.top,
    bbox.width,
    bbox.height,
    canvasWidth,
    canvasHeight
  );
}
