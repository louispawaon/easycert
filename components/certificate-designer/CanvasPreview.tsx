"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TextElement } from "@/types/types";
import { useFontLoader } from "@/hooks/useFontLoader";
import { useCertificateTemplateImage } from "@/hooks/useCertificateTemplateImage";
import { cn } from "@/lib/cn";
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
  /** When set, `name` elements render this attendee instead of the placeholder. */
  previewAttendeeName?: string | null;
}

const DESIGN_HEIGHT_MIN_PX = 220;
const DESIGN_HEIGHT_MAX_PX = 500;
const DESIGN_HEIGHT_VIEWPORT = "42vh";
const DESIGN_EMPTY_MIN_PX = 260;

export function CanvasPreview({
  imageUrl,
  textElements,
  selectedElement,
  onElementSelect,
  onElementMove,
  imageDimensions,
  previewAttendeeName = null,
}: CanvasPreviewProps) {
  useFontLoader();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { image: templateImg } = useCertificateTemplateImage(imageUrl);
  const [bboxes, setBBoxes] = useState<ElementBBox[]>([]);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);

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
        const drawOpts =
          previewAttendeeName != null && previewAttendeeName !== ""
            ? { attendeeName: previewAttendeeName }
            : {};
        drawCertificateToCanvas(canvas, templateImg, textElements, drawOpts);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          setBBoxes(
            measureElementBBoxes(ctx, textElements, canvas.width, canvas.height, drawOpts)
          );
        }
      } catch (err) {
        console.error("Designer render failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [templateImg, textElements, previewAttendeeName]);

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
  const adaptiveHeight = `clamp(${DESIGN_HEIGHT_MIN_PX}px, ${DESIGN_HEIGHT_VIEWPORT}, ${DESIGN_HEIGHT_MAX_PX}px)`;

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
              height: adaptiveHeight,
              width: `calc(${adaptiveHeight} * ${aspect})`,
              maxWidth: "100%",
            }
          : {
              width: "100%",
              minHeight: `clamp(${DESIGN_EMPTY_MIN_PX}px, 38vh, ${DESIGN_HEIGHT_MAX_PX}px)`,
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
        const isSelected = selectedElement === box.id;
        const isHovered = hoveredBoxId === box.id;
        const showTypeBadge = isSelected || isHovered;
        const isNameElement = box.type === "name";
        const ringBase = isNameElement ? "ring-success" : "ring-info";
        const ringHover = isNameElement ? "hover:ring-success/60" : "hover:ring-info/60";
        const selectedFill = isNameElement ? "bg-success/10" : "bg-info/10";
        const badgeBase = isNameElement
          ? "bg-success text-white"
          : "bg-info text-white";
        return (
          <div
            key={box.id}
            role="button"
            tabIndex={0}
            aria-label={isNameElement ? "Name element" : "Static text element"}
            className={cn(
              "group absolute cursor-move border border-background/70",
              isSelected ? `ring-2 ${ringBase} ${selectedFill}` : `hover:ring-1 ${ringHover}`
            )}
            style={{
              left: `${(box.left / cw) * 100}%`,
              top: `${(box.top / ch) * 100}%`,
              width: `${(box.width / cw) * 100}%`,
              height: `${(box.height / ch) * 100}%`,
              zIndex: 10,
            }}
            onMouseEnter={() => setHoveredBoxId(box.id)}
            onMouseLeave={() => setHoveredBoxId((current) => (current === box.id ? null : current))}
            onMouseDown={(e) => handleOverlayMouseDown(e, box.id)}
            onClick={(e) => {
              e.stopPropagation();
              onElementSelect(box.id);
            }}
          >
            {showTypeBadge ? (
              <span
                className={cn(
                  "pointer-events-none absolute -top-5 left-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide shadow-sm",
                  badgeBase
                )}
              >
                {isNameElement ? "Name" : "Static"}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
