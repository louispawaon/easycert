"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { TextElement, createNameElement, createStaticElement } from "@/types/types";
import type { DrawCertificateOptions } from "@/lib/canvas/draw-text-element";
import { useAttendees } from "@/hooks/useAttendees";
import { useCertificateImage } from "@/hooks/useCertificate";
import { useCertificateTemplateImage } from "@/hooks/useCertificateTemplateImage";
import { useDesignerUiStore } from "@/store/designer-ui-store";
import { useDesignerTextPersistence } from "@/hooks/useDesignerTextPersistence";
import { useDesignerGeneration, type ActiveGenerationKind } from "@/hooks/useDesignerGeneration";

export type { ActiveGenerationKind };

/**
 * Subset of `TextElement` that defines visual style. Used by the preset
 * load/save UI so users can copy styling between elements without copying
 * placement (x/y/maxWidthPct).
 */
export interface TextProperties {
  fontSize: number;
  fontFamily: string;
  fontStyle: "normal" | "italic";
  color: string;
  fontWeight: "normal" | "bold";
  textDecoration: "none" | "underline";
  maxWidthPct: number;
}

const STYLE_KEYS: ReadonlyArray<keyof TextProperties> = [
  "fontSize",
  "fontFamily",
  "fontStyle",
  "color",
  "fontWeight",
  "textDecoration",
  "maxWidthPct",
];

export function useCertificateDesigner() {
  const { imageUrl } = useCertificateImage();
  const { attendees, attendeeRows, tableHeadersOrdered, linesMode } =
    useAttendees();
  const { textElements, setTextElements } = useDesignerTextPersistence();

  const selectedElement = useDesignerUiStore((s) => s.selectedElement);
  const setSelectedElement = useDesignerUiStore((s) => s.setSelectedElement);
  const isGenerating = useDesignerUiStore((s) => s.isGenerating);
  const setIsGenerating = useDesignerUiStore((s) => s.setIsGenerating);
  const previewIndex = useDesignerUiStore((s) => s.previewIndex);
  const setPreviewIndex = useDesignerUiStore((s) => s.setPreviewIndex);
  const pageSize = useDesignerUiStore((s) => s.pageSize);
  const setPageSize = useDesignerUiStore((s) => s.setPageSize);

  const { dimensions: imageDimensions } = useCertificateTemplateImage(imageUrl);

  const [outputFileBaseName, setOutputFileBaseName] = useState("Certificate");

  const attendeeDrawContexts = useMemo((): DrawCertificateOptions[] => {
    return attendees.map((line, i) => ({
      attendeeName: line,
      attendeeRow:
        attendeeRows !== null && attendeeRows[i] !== undefined ? attendeeRows[i]! : null,
      tableHeadersOrdered: attendeeRows !== null ? tableHeadersOrdered : [],
    }));
  }, [attendees, attendeeRows, tableHeadersOrdered]);

  const {
    batchProgress,
    cancelGeneration,
    generateCertificateImage,
    downloadCertificate,
    generateCertificates,
    generateCertificatesPDF,
    activeGenerationKind,
  } = useDesignerGeneration({
    imageUrl,
    textElements,
    imageDimensions,
    attendeeDrawContexts,
    previewIndex,
    pageSize,
    outputFileBaseName,
    setIsGenerating,
  });

  useEffect(() => {
    if (!selectedElement) return;
    if (textElements.some((el) => el.id === selectedElement)) return;
    setSelectedElement(null);
  }, [textElements, selectedElement, setSelectedElement]);

  const namePlaceholdersCount = useMemo(
    () => textElements.filter((el) => el.type === "name").length,
    [textElements]
  );

  useEffect(() => {
    if (attendees.length === 0) {
      setPreviewIndex(0);
      return;
    }
    setPreviewIndex((i) => Math.min(i, attendees.length - 1));
  }, [attendees.length, setPreviewIndex]);

  const handleElementSelect = useCallback(
    (id: string | null) => {
      setSelectedElement(id);
    },
    [setSelectedElement]
  );

  const handleElementMove = useCallback((id: string, x: number, y: number) => {
    setTextElements((prev) => prev.map((el) => (el.id === id ? { ...el, x, y } : el)));
  }, [setTextElements]);

  const handleElementUpdate = useCallback(
    (property: keyof TextElement, value: string | number | undefined) => {
      setTextElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedElement) return el;
          if (
            property === "variableColumn" &&
            (value === undefined ||
              value === "" ||
              (typeof value === "string" && !value.trim()))
          ) {
            const { variableColumn: _omit, ...rest } = el;
            return rest as TextElement;
          }
          return { ...el, [property]: value } as TextElement;
        })
      );
    },
    [selectedElement, setTextElements]
  );

  const handleElementRemove = useCallback(() => {
    setTextElements((prev) => prev.filter((el) => el.id !== selectedElement));
    setSelectedElement(null);
  }, [selectedElement, setSelectedElement, setTextElements]);

  const handleAddTextElement = useCallback(
    (type: "name" | "static", variableColumnForName?: string) => {
      const newElement =
        type === "name"
          ? createNameElement(
              variableColumnForName !== undefined && variableColumnForName.trim() !== ""
                ? variableColumnForName
                : undefined
            )
          : createStaticElement();
      setTextElements((prev) => [...prev, newElement]);
      setSelectedElement(newElement.id);
      if (type === "name" && attendees.length > 0) {
        setPreviewIndex(0);
      }
    },
    [setSelectedElement, attendees.length, setPreviewIndex, setTextElements]
  );

  const loadPreset = useCallback(
    (properties: Partial<TextProperties>) => {
      if (!selectedElement) return;
      setTextElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedElement) return el;
          const patch: Partial<TextElement> = {};
          for (const key of STYLE_KEYS) {
            const value = properties[key];
            if (value === undefined) continue;
            Object.assign(patch, { [key]: value });
          }
          return Object.keys(patch).length === 0 ? el : ({ ...el, ...patch } as TextElement);
        })
      );
    },
    [selectedElement, setTextElements]
  );

  const previewDrawContext: DrawCertificateOptions | null =
    textElements.some((el) => el.type === "name") && attendeeDrawContexts.length > 0
      ? attendeeDrawContexts[previewIndex] ?? attendeeDrawContexts[0] ?? null
      : null;

  const canvasPreviewProps = useMemo(
    () => ({
      imageUrl,
      textElements,
      selectedElement,
      onElementSelect: handleElementSelect,
      onElementMove: handleElementMove,
      imageDimensions,
      previewDrawContext,
    }),
    [
      imageUrl,
      textElements,
      selectedElement,
      handleElementSelect,
      handleElementMove,
      imageDimensions,
      previewDrawContext,
    ]
  );

  const certificatePreviewProps = useMemo(
    () => ({
      imageUrl,
      attendees,
      previewIndex,
      textElements,
      onDownload: downloadCertificate,
      onPreviewChange: setPreviewIndex,
      imageDimensions,
      previewDrawContext,
    }),
    [
      imageUrl,
      attendees,
      previewIndex,
      textElements,
      downloadCertificate,
      setPreviewIndex,
      imageDimensions,
      previewDrawContext,
    ]
  );

  return {
    imageUrl,
    attendees,
    textElements,
    selectedElement,
    isGenerating,
    activeGenerationKind,
    batchProgress,
    cancelGeneration,
    outputFileBaseName,
    setOutputFileBaseName,
    previewIndex,
    imageDimensions,
    pageSize,
    setPageSize,
    handleElementSelect,
    handleElementMove,
    handleElementUpdate,
    handleElementRemove,
    handleAddTextElement,
    generateCertificateImage,
    downloadCertificate,
    generateCertificates,
    generateCertificatesPDF,
    canvasPreviewProps,
    certificatePreviewProps,
    attendeesCount: attendees.length,
    textElementsCount: textElements.length,
    namePlaceholdersCount,
    loadPreset,
    attendeesLinesMode: linesMode,
    attendeeCsvHeaders: tableHeadersOrdered,
  };
}

export type CertificateDesignerController = ReturnType<typeof useCertificateDesigner>;
