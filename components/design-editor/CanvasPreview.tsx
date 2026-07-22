"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TextElement, ProofLinkElement, DesignElement } from "@/types/types";
import { isTextElement, isProofLinkElement } from "@/types/types";
import { useFontLoader } from "@/hooks/useFontLoader";
import { useTemplateImage } from "@/hooks/useTemplateImage";
import { cn } from "@/lib/cn";
import {
  renderToCanvas,
  measureElementBBoxes,
  measureTextElement,
  type ElementBBox,
  type RecordDrawContext,
} from "@/lib/canvas/draw-text-element";
import { awaitFontsReady } from "@/lib/canvas/await-fonts";
import { buildProofSizingPlaceholderUrl } from "@/lib/proof/url";
import type { AuditReport } from "@/lib/audit/pre-generation-audit";
import {
  buildElementAuditSeverityMap,
  getCanvasAuditBorderSeverity,
} from "@/lib/audit/canvas-audit-highlights";

interface CanvasPreviewProps {
  imageUrl: string | null;
  designElements: DesignElement[];
  selectedElement: string | null;
  editingElementId: string | null;
  onElementSelect: (id: string | null) => void;
  onElementMove: (id: string, x: number, y: number) => void;
  onEditStart: (id: string) => void;
  onEditEnd: () => void;
  onEditCommit: (id: string, value: string) => void;
  imageDimensions: { width: number; height: number };
  previewDrawContext?: RecordDrawContext | null;
  fillContainer?: boolean;
  auditReport?: AuditReport | null;
  previewIndex?: number;
}

const DESIGN_HEIGHT_MIN_PX = 220;
const DESIGN_HEIGHT_MAX_PX = 500;
const DESIGN_HEIGHT_VIEWPORT = "42vh";
const DESIGN_EMPTY_MIN_PX = 260;
const DEFAULT_STATIC_TEXT = "Enter text here";
const DRAG_THRESHOLD_PX = 4;

function fitContain(
  containerWidth: number,
  containerHeight: number,
  aspect: number
): { width: number; height: number } {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return { width: 0, height: 0 };
  }

  const containerAspect = containerWidth / containerHeight;
  if (aspect > containerAspect) {
    const width = containerWidth;
    return { width, height: width / aspect };
  }

  const height = containerHeight;
  return { width: height * aspect, height };
}

export function CanvasPreview({
  imageUrl,
  designElements,
  selectedElement,
  editingElementId,
  onElementSelect,
  onElementMove,
  onEditStart,
  onEditEnd,
  onEditCommit,
  imageDimensions,
  previewDrawContext = null,
  fillContainer = false,
  auditReport = null,
  previewIndex = 0,
}: CanvasPreviewProps) {
  useFontLoader();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const renderRunIdRef = useRef(0);
  const { image: templateImg } = useTemplateImage(imageUrl);
  const [bboxes, setBBoxes] = useState<ElementBBox[]>([]);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [displayedCanvasSize, setDisplayedCanvasSize] = useState({ width: 0, height: 0 });
  const measureCtx = useMemo(() => {
    if (typeof document === "undefined") return null;
    return document.createElement("canvas").getContext("2d");
  }, []);

  const textElements = useMemo(() => designElements.filter(isTextElement) as TextElement[], [designElements]);
  const proofLinkElements = useMemo(() => designElements.filter(isProofLinkElement) as ProofLinkElement[], [designElements]);
  const textElementsForRender = useMemo(
    () =>
      editingElementId
        ? textElements.filter((el) => el.id !== editingElementId)
        : textElements,
    [textElements, editingElementId]
  );
  const editingElement = useMemo(
    () =>
      editingElementId
        ? textElements.find((el) => el.id === editingElementId && el.type === "static")
        : undefined,
    [textElements, editingElementId]
  );

  useEffect(() => {
    if (!fillContainer) return;
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setContainerSize((prev) => {
        if (
          Math.abs(prev.width - width) < 2 &&
          Math.abs(prev.height - height) < 2
        ) {
          return prev;
        }
        return { width, height };
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [fillContainer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateDisplayedSize = () => {
      const rect = canvas.getBoundingClientRect();
      setDisplayedCanvasSize((prev) => {
        if (
          Math.abs(prev.width - rect.width) < 1 &&
          Math.abs(prev.height - rect.height) < 1
        ) {
          return prev;
        }
        return { width: rect.width, height: rect.height };
      });
    };

    updateDisplayedSize();
    const observer = new ResizeObserver(updateDisplayedSize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [imageUrl, fillContainer, containerSize.width, containerSize.height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !templateImg) {
      const id = requestAnimationFrame(() => setBBoxes([]));
      return () => {
        cancelAnimationFrame(id);
        renderRunIdRef.current += 1;
      };
    }
    const runId = ++renderRunIdRef.current;
    (async () => {
      await awaitFontsReady(textElementsForRender);
      if (runId !== renderRunIdRef.current) return;
      try {
        const drawOpts: RecordDrawContext = previewDrawContext ?? {};
        const dummyProofUrl = proofLinkElements.length > 0
          ? buildProofSizingPlaceholderUrl()
          : undefined;
        await renderToCanvas(canvas, templateImg, textElementsForRender, proofLinkElements, "", drawOpts, dummyProofUrl);
        if (runId !== renderRunIdRef.current) return;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          setBBoxes(
            measureElementBBoxes(ctx, textElementsForRender, proofLinkElements, canvas.width, canvas.height, drawOpts, dummyProofUrl)
          );
        }
      } catch (err) {
        console.error("Designer render failed:", err);
      }
    })();
    return () => {
      renderRunIdRef.current += 1;
    };
  }, [templateImg, textElementsForRender, proofLinkElements, previewDrawContext]);

  useEffect(() => {
    if (!editingElementId) return;
    const input = editInputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, [editingElementId]);

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
  const elementById = useMemo(
    () => new Map(designElements.map((el) => [el.id, el] as const)),
    [designElements]
  );
  const elementAuditSeverities = useMemo(
    () => buildElementAuditSeverityMap(auditReport, previewIndex),
    [auditReport, previewIndex]
  );
  const canvasAuditBorderSeverity = useMemo(
    () => getCanvasAuditBorderSeverity(auditReport, previewIndex),
    [auditReport, previewIndex]
  );

  const fillContainerSize = useMemo(() => {
    if (!fillContainer) return null;
    if (!hasTemplate) {
      return {
        width: containerSize.width,
        height: Math.max(containerSize.height, DESIGN_EMPTY_MIN_PX),
      };
    }
    return fitContain(containerSize.width, containerSize.height, aspect);
  }, [fillContainer, hasTemplate, containerSize.width, containerSize.height, aspect]);

  const finishEditing = () => {
    if (!editingElement) {
      onEditEnd();
      return;
    }
    const currentValue = editingElement.value ?? "";
    if (!currentValue.trim()) {
      onEditCommit(editingElement.id, DEFAULT_STATIC_TEXT);
    }
    onEditEnd();
  };

  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    if (editingElementId === id) return;
    if (editingElementId && editingElementId !== id) {
      finishEditing();
    }
    e.preventDefault();
    e.stopPropagation();
    onElementSelect(id);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const element = designElements.find((el) => el.id === id);
    if (!element) return;

    const isStaticText = isTextElement(element) && element.type === "static";

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startX = element.x;
    const startY = element.y;

    let frame: number | null = null;
    let pendingX = startX;
    let pendingY = startY;
    let dragged = false;

    const flush = () => {
      frame = null;
      onElementMove(id, pendingX, pendingY);
    };

    const onMove = (ev: MouseEvent) => {
      if (!dragged) {
        const dxPx = ev.clientX - startClientX;
        const dyPx = ev.clientY - startClientY;
        if (Math.hypot(dxPx, dyPx) >= DRAG_THRESHOLD_PX) {
          dragged = true;
        }
      }
      if (!dragged) return;

      const dx = (ev.clientX - startClientX) / rect.width;
      const dy = (ev.clientY - startClientY) / rect.height;
      pendingX = Math.min(1, Math.max(0, startX + dx));
      pendingY = Math.min(1, Math.max(0, startY + dy));
      if (frame === null) frame = window.requestAnimationFrame(flush);
    };

    const onUp = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      if (dragged) {
        onElementMove(id, pendingX, pendingY);
      } else if (isStaticText) {
        onEditStart(id);
      }
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleBackgroundClick = () => {
    if (editingElementId) {
      finishEditing();
      return;
    }
    onElementSelect(null);
  };

  const handleEditInputBlur = () => {
    finishEditing();
  };

  const handleEditInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      finishEditing();
    }
  };

  const canvasPixelWidth = imageDimensions.width || 1;
  const canvasPixelHeight = imageDimensions.height || 1;
  const fontScale =
    displayedCanvasSize.width > 0 && canvasPixelWidth > 0
      ? displayedCanvasSize.width / canvasPixelWidth
      : 1;

  const editingInputWidthPx = useMemo(() => {
    if (!editingElement || displayedCanvasSize.width <= 0) return undefined;

    const maxWidthPx = editingElement.maxWidthPct * displayedCanvasSize.width;
    const text = editingElement.value ?? "";
    const textToMeasure = text.length > 0 ? text : " ";

    if (measureCtx) {
      const measured = measureTextElement(measureCtx, textToMeasure, editingElement, canvasPixelWidth);
      if (measured) {
        const contentWidthPx = measured.width * fontScale + 12;
        const minWidthPx = Math.max(24, measured.fontSize * fontScale * 0.6);
        return Math.min(maxWidthPx, Math.max(minWidthPx, contentWidthPx));
      }
    }

    const estimatedWidthPx = textToMeasure.length * editingElement.fontSize * fontScale * 0.55 + 12;
    return Math.min(maxWidthPx, Math.max(24, estimatedWidthPx));
  }, [editingElement, displayedCanvasSize.width, canvasPixelWidth, fontScale, measureCtx]);

  const canvasSurfaceStyle = fillContainer
    ? fillContainerSize && fillContainerSize.width > 0 && fillContainerSize.height > 0
      ? {
          width: fillContainerSize.width,
          height: fillContainerSize.height,
        }
      : { width: "100%", minHeight: DESIGN_EMPTY_MIN_PX }
    : hasTemplate
      ? {
          height: adaptiveHeight,
          width: `calc(${adaptiveHeight} * ${aspect})`,
          maxWidth: "100%",
        }
      : {
          width: "100%",
          minHeight: `clamp(${DESIGN_EMPTY_MIN_PX}px, 38vh, ${DESIGN_HEIGHT_MAX_PX}px)`,
        };

  const canvasSurface = (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border bg-background",
        fillContainer ? "mx-auto" : hasTemplate ? "mx-auto" : "w-full",
        canvasAuditBorderSeverity === "error" && "border-destructive ring-2 ring-destructive/40",
        canvasAuditBorderSeverity === "warning" && "border-warning ring-2 ring-warning/40"
      )}
      style={canvasSurfaceStyle}
      onClick={handleBackgroundClick}
    >
      {imageUrl ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ display: "block" }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground">Upload a design template to get started</p>
        </div>
      )}

      {auditReport?.blocking ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-center justify-center gap-2 bg-destructive/90 px-3 py-2 text-center text-xs font-medium text-destructive-foreground">
          {auditReport.findings.find((finding) => finding.severity === "error")?.label ??
            "Fix audit errors before generating"}
        </div>
      ) : null}

      {imageUrl &&
        bboxes.map((box) => {
          const cw = canvasPixelWidth;
          const ch = canvasPixelHeight;
          const isSelected = selectedElement === box.id;
          const isEditing = editingElementId === box.id;
          const isHovered = hoveredBoxId === box.id;
          const showTypeBadge = (isSelected || isHovered) && !isEditing;
          const isProofLink = box.type === "proof-link" || box.type === "qr";
          const sourceElement = elementById.get(box.id);

          let label: string;
          if (isProofLink) {
            label = "Proof Link";
          } else if (sourceElement?.type === "dynamic-text" || sourceElement?.type === "name") {
            const el = sourceElement as TextElement;
            const vc = el.variable ?? el.variableColumn;
            label = vc && vc.trim().length > 0 ? vc : "Name";
          } else {
            label = "Subtext";
          }

          const isDynamic = sourceElement?.type === "dynamic-text" || sourceElement?.type === "name";

          const ariaLabel = isProofLink
            ? "Proof Link element"
            : isDynamic
              ? "Name element"
              : "Static text element";

          const auditSeverity = elementAuditSeverities.get(box.id);
          const hasAuditIssue = auditSeverity != null;

          const ringBase = hasAuditIssue
            ? auditSeverity === "error"
              ? "ring-destructive"
              : "ring-warning"
            : isProofLink
              ? "ring-primary"
              : isDynamic
                ? "ring-success"
                : "ring-info";
          const ringHover = hasAuditIssue
            ? auditSeverity === "error"
              ? "hover:ring-destructive/80"
              : "hover:ring-warning/80"
            : isProofLink
              ? "hover:ring-primary/60"
              : isDynamic
                ? "hover:ring-success/60"
                : "hover:ring-info/60";
          const selectedFill = hasAuditIssue
            ? auditSeverity === "error"
              ? "bg-destructive/10"
              : "bg-warning/10"
            : isProofLink
              ? "bg-primary/10"
              : isDynamic
                ? "bg-success/10"
                : "bg-info/10";
          const badgeBase = hasAuditIssue
            ? auditSeverity === "error"
              ? "bg-destructive text-destructive-foreground"
              : "bg-warning text-warning-foreground"
            : isProofLink
              ? "bg-primary text-primary-foreground"
              : isDynamic
                ? "bg-success text-success-foreground"
                : "bg-info text-info-foreground";

          return (
            <div
              key={box.id}
              role="button"
              tabIndex={0}
              aria-label={
                hasAuditIssue
                  ? `${ariaLabel} — ${auditSeverity === "error" ? "error" : "warning"} flagged by audit`
                  : ariaLabel
              }
              className={cn(
                "group absolute border border-background/70",
                isEditing ? "pointer-events-none border-transparent ring-0" : "cursor-move",
                hasAuditIssue && !isEditing
                  ? cn(
                      "ring-2",
                      ringBase,
                      selectedFill,
                      auditSeverity === "error" ? "animate-pulse" : undefined
                    )
                  : isSelected && !isEditing
                    ? `ring-2 ${ringBase} ${selectedFill}`
                    : !isEditing
                      ? `hover:ring-1 ${ringHover}`
                      : ""
              )}
              style={{
                left: `${(box.left / cw) * 100}%`,
                top: `${(box.top / ch) * 100}%`,
                width: `${(box.width / cw) * 100}%`,
                height: `${(box.height / ch) * 100}%`,
                zIndex: 10,
              }}
              onMouseEnter={() => setHoveredBoxId(box.id)}
              onMouseLeave={() =>
                setHoveredBoxId((current) => (current === box.id ? null : current))
              }
              onMouseDown={(e) => handleOverlayMouseDown(e, box.id)}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {showTypeBadge || (hasAuditIssue && !isEditing) ? (
                <span
                  className={cn(
                    "pointer-events-none absolute -top-5 left-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide shadow-sm",
                    badgeBase
                  )}
                >
                  {hasAuditIssue ? (auditSeverity === "error" ? "Error" : "Warning") : label}
                </span>
              ) : null}
            </div>
          );
        })}

      {editingElement ? (
        <input
          ref={editInputRef}
          type="text"
          aria-label="Edit text content"
          value={editingElement.value ?? ""}
          onChange={(e) => onEditCommit(editingElement.id, e.target.value)}
          onBlur={handleEditInputBlur}
          onKeyDown={handleEditInputKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute z-20 border-0 bg-transparent p-0 outline-none ring-2 ring-info"
          style={{
            left: `${editingElement.x * 100}%`,
            top: `${editingElement.y * 100}%`,
            width: editingInputWidthPx != null ? `${editingInputWidthPx}px` : undefined,
            maxWidth: `${editingElement.maxWidthPct * 100}%`,
            transform: "translate(-50%, -50%)",
            fontFamily: `"${editingElement.fontFamily}"`,
            fontSize: `${editingElement.fontSize * fontScale}px`,
            fontStyle: editingElement.fontStyle,
            fontWeight: editingElement.fontWeight,
            textDecoration: editingElement.textDecoration,
            color: editingElement.color,
            textAlign: "center",
          }}
        />
      ) : null}
    </div>
  );

  if (fillContainer) {
    return (
      <div ref={containerRef} className="flex h-full w-full items-center justify-center">
        {canvasSurface}
      </div>
    );
  }

  return canvasSurface;
}
