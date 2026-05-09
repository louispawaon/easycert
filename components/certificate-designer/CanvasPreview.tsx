"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TextElement } from "@/types/types";
import { useFontLoader } from "@/hooks/useFontLoader";
import { useCertificateTemplateImage } from "@/hooks/useCertificateTemplateImage";
import { PreviewZoomControls } from "@/components/certificate-designer/PreviewZoomControls";
import {
  DESIGN_PREVIEW_HEIGHT,
  PREVIEW_ZOOM_DEFAULT,
  buildAdaptiveHeight,
  clampPreviewZoom,
} from "@/components/certificate-designer/previewSizing";
import { cn } from "@/lib/cn";
import {
  drawCertificateToCanvas,
  measureElementBBoxes,
  type ElementBBox,
  type DrawCertificateOptions,
} from "@/lib/canvas/draw-text-element";
import { awaitFontsReady } from "@/lib/canvas/await-fonts";

interface CanvasPreviewProps {
  imageUrl: string | null;
  textElements: TextElement[];
  selectedElement: string | null;
  onElementSelect: (id: string | null) => void;
  onElementMove: (id: string, x: number, y: number) => void;
  imageDimensions: { width: number; height: number };
  /** Resolved attendee row + fallback line used when drawing `name` elements. */
  previewDrawContext?: DrawCertificateOptions | null;
}

export function CanvasPreview({
  imageUrl,
  textElements,
  selectedElement,
  onElementSelect,
  onElementMove,
  imageDimensions,
  previewDrawContext = null,
}: CanvasPreviewProps) {
  useFontLoader();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { image: templateImg } = useCertificateTemplateImage(imageUrl);
  const [bboxes, setBBoxes] = useState<ElementBBox[]>([]);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(PREVIEW_ZOOM_DEFAULT);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

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
        const drawOpts: DrawCertificateOptions = previewDrawContext ?? {};
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
  }, [templateImg, textElements, previewDrawContext]);

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
  const adaptiveHeight = buildAdaptiveHeight(
    DESIGN_PREVIEW_HEIGHT.minPx,
    DESIGN_PREVIEW_HEIGHT.viewport,
    DESIGN_PREVIEW_HEIGHT.maxPx
  );
  const elementById = useMemo(
    () => new Map(textElements.map((el) => [el.id, el] as const)),
    [textElements]
  );

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

  const clampPan = (nextX: number, nextY: number, nextZoom = zoom) => {
    const viewport = viewportRef.current;
    if (!viewport || nextZoom <= 1) return { x: 0, y: 0 };
    const maxX = ((nextZoom - 1) * viewport.clientWidth) / 2;
    const maxY = ((nextZoom - 1) * viewport.clientHeight) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, nextX)),
      y: Math.min(maxY, Math.max(-maxY, nextY)),
    };
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const nextZoom = clampPreviewZoom(zoom + (e.deltaY < 0 ? 0.1 : -0.1));
    setZoom(nextZoom);
    setPan((currentPan) => clampPan(currentPan.x, currentPan.y, nextZoom));
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const stopBrowserZoom = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
    };

    viewport.addEventListener("wheel", stopBrowserZoom, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", stopBrowserZoom);
    };
  }, []);

  const handleViewportMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageUrl || zoom <= 1 || e.button !== 0) return;
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startPanX = pan.x;
    const startPanY = pan.y;
    setIsPanning(true);
    e.preventDefault();

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startClientX;
      const dy = ev.clientY - startClientY;
      setPan(clampPan(startPanX + dx, startPanY + dy));
    };

    const onUp = () => {
      setIsPanning(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div className="space-y-2">
      <PreviewZoomControls
        zoom={zoom}
        onZoomChange={(nextZoom) => {
          const clampedZoom = clampPreviewZoom(nextZoom);
          setZoom(clampedZoom);
          setPan((currentPan) => clampPan(currentPan.x, currentPan.y, clampedZoom));
        }}
      />
      <div
        ref={viewportRef}
        className="overflow-hidden rounded-md"
        onWheelCapture={handleWheel}
        onMouseDown={handleViewportMouseDown}
      >
        <div className="flex justify-center p-1">
          <div
            className={cn("origin-center transition-transform", zoom > 1 ? (isPanning ? "cursor-grabbing" : "cursor-grab") : "")}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              width: hasTemplate ? `calc(${adaptiveHeight} * ${aspect})` : "100%",
            }}
          >
            <div
              className={`relative border rounded-md overflow-hidden bg-background ${
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
                      minHeight: buildAdaptiveHeight(
                        DESIGN_PREVIEW_HEIGHT.emptyMinPx,
                        "40vh",
                        DESIGN_PREVIEW_HEIGHT.maxPx
                      ),
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
        const sourceElement = elementById.get(box.id);
        const variableTag = sourceElement?.type === "name" ? sourceElement.variableColumn : undefined;
        const nameBadgeLabel = variableTag && variableTag.trim().length > 0 ? variableTag : "Name";
        const ariaLabel = isNameElement
          ? variableTag && variableTag.trim().length > 0
            ? `Variable field: ${variableTag}`
            : "Name element"
          : "Static text element";
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
                    aria-label={ariaLabel}
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
                        {isNameElement ? nameBadgeLabel : "Subtext"}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
