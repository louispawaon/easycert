"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TextElement } from "@/types/types";
import { useFontLoader } from "@/hooks/useFontLoader";
import { useCertificateTemplateImage } from "@/hooks/useCertificateTemplateImage";
import {
  drawCertificateToCanvas,
  measureElementBBoxes,
  type ElementBBox,
} from "@/lib/canvas/draw-text-element";
import { awaitFontsReady } from "@/lib/canvas/await-fonts";

interface CanvasPreviewProps {
  imageUrl: string | null;
  textElements: TextElement[];
  selectedElement: string | null;
  onElementSelect: (id: string | null) => void;
  onElementMove: (id: string, x: number, y: number) => void;
  imageDimensions: { width: number; height: number };
}

const DESIGN_HEIGHT_PX = 500;

export function CanvasPreview({
  imageUrl,
  textElements,
  selectedElement,
  onElementSelect,
  onElementMove,
  imageDimensions,
}: CanvasPreviewProps) {
  useFontLoader();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { image: templateImg } = useCertificateTemplateImage(imageUrl);
  const [bboxes, setBBoxes] = useState<ElementBBox[]>([]);

  // Re-render the canvas whenever the template, elements, or selection change.
  // Selection does not affect the canvas image itself but bbox recompute keeps
  // overlays aligned after font swaps or text edits.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !templateImg) {
      setBBoxes([]);
      return;
    }
    let cancelled = false;
    (async () => {
      await awaitFontsReady(textElements);
      if (cancelled) return;
      try {
        drawCertificateToCanvas(canvas, templateImg, textElements);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          setBBoxes(measureElementBBoxes(ctx, textElements, canvas.width, canvas.height));
        }
      } catch (err) {
        console.error("Designer render failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [templateImg, textElements]);

  const aspect = useMemo(() => {
    if (imageDimensions.width && imageDimensions.height) {
      return imageDimensions.width / imageDimensions.height;
    }
    if (templateImg) {
      return (templateImg.naturalWidth || 1) / (templateImg.naturalHeight || 1);
    }
    return 1;
  }, [imageDimensions.width, imageDimensions.height, templateImg]);

  const hasTemplate = Boolean(imageUrl);

  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onElementSelect(id);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const element = textElements.find((el) => el.id === id);
    if (!element) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startX = element.x;
    const startY = element.y;

    let frame: number | null = null;
    let pendingX = startX;
    let pendingY = startY;

    const flush = () => {
      frame = null;
      onElementMove(id, pendingX, pendingY);
    };

    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startClientX) / rect.width;
      const dy = (ev.clientY - startClientY) / rect.height;
      pendingX = Math.min(1, Math.max(0, startX + dx));
      pendingY = Math.min(1, Math.max(0, startY + dy));
      if (frame === null) frame = window.requestAnimationFrame(flush);
    };

    const onUp = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      onElementMove(id, pendingX, pendingY);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleBackgroundClick = () => {
    onElementSelect(null);
  };

  return (
    <div
      className={`relative border rounded-md overflow-hidden bg-white ${
        hasTemplate ? "mx-auto" : "w-full"
      }`}
      style={
        hasTemplate
          ? {
              height: `${DESIGN_HEIGHT_PX}px`,
              width: `${DESIGN_HEIGHT_PX * aspect}px`,
              maxWidth: "100%",
            }
          : {
              width: "100%",
              minHeight: `${DESIGN_HEIGHT_PX}px`,
            }
      }
      onClick={handleBackgroundClick}
    >
      {imageUrl ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: "block" }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground">Upload a certificate template to get started</p>
        </div>
      )}

      {imageUrl && bboxes.map((box) => {
        const canvas = canvasRef.current;
        const cw = canvas?.width || imageDimensions.width || 1;
        const ch = canvas?.height || imageDimensions.height || 1;
        return (
          <div
            key={box.id}
            role="button"
            tabIndex={0}
            className={`absolute cursor-move ${
              selectedElement === box.id ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-primary/40"
            }`}
            style={{
              left: `${(box.left / cw) * 100}%`,
              top: `${(box.top / ch) * 100}%`,
              width: `${(box.width / cw) * 100}%`,
              height: `${(box.height / ch) * 100}%`,
              backgroundColor:
                selectedElement === box.id ? "rgba(59,130,246,0.08)" : "transparent",
              zIndex: 10,
            }}
            onMouseDown={(e) => handleOverlayMouseDown(e, box.id)}
            onClick={(e) => {
              e.stopPropagation();
              onElementSelect(box.id);
            }}
          />
        );
      })}
    </div>
  );
}
