"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  TextElement,
  DesignElement,
  createDynamicTextElement,
  createStaticElement,
  createProofLinkElement,
  isTextElement,
  isProofLinkElement,
} from "@/types/types";
import type { RecordDrawContext } from "@/lib/canvas/draw-text-element";
import { buildProofLinkUrlTemplate, buildProofSizingPlaceholderUrl } from "@/lib/proof/url";
import { computeRecommendedProofLinkSizePct } from "@/lib/canvas/proof-link-render";
import { saveIssuer, saveOutputSettings, clearLastGenerationReport } from "@/lib/db/app-state";
import {
  DEFAULT_OUTPUT_SETTINGS,
  normalizeOutputSettings,
  type OutputSettings,
} from "@/lib/output/output-settings";
import { useLiveQuery } from "dexie-react-hooks";
import { dittoDb } from "@/lib/db/ditto-db";
import { useRecords } from "@/hooks/useRecords";
import { useTemplateImageUrl } from "@/hooks/useTemplateImageUrl";
import { useTemplateImage } from "@/hooks/useTemplateImage";
import { useDesignerUiStore } from "@/store/designer-ui-store";
import { useDesignerElementPersistence } from "@/hooks/useDesignerTextPersistence";
import { useDesignerGeneration, type ActiveGenerationKind } from "@/hooks/useDesignerGeneration";
import { usePreGenerationAudit } from "@/hooks/usePreGenerationAudit";

export type { ActiveGenerationKind };

export interface TextProperties {
  fontSize: number;
  fontFamily: string;
  fontStyle: "normal" | "italic";
  color: string;
  fontWeight: "normal" | "bold";
  textDecoration: "none" | "underline";
  textAlign: "left" | "center" | "right";
  maxWidthPct: number;
}

const STYLE_KEYS: ReadonlyArray<keyof TextProperties> = [
  "fontSize",
  "fontFamily",
  "fontStyle",
  "color",
  "fontWeight",
  "textDecoration",
  "textAlign",
  "maxWidthPct",
];

export function useDesignerController(workspaceKey = 0) {
  const { imageUrl } = useTemplateImageUrl();
  const { records: displayRecords, recordRows, headers, recordLinesMode } =
    useRecords();
  const { designElements, setDesignElements } = useDesignerElementPersistence();
  const appStateRow = useLiveQuery(() => dittoDb.appState.get("default"));

  const selectedElement = useDesignerUiStore((s) => s.selectedElement);
  const setSelectedElement = useDesignerUiStore((s) => s.setSelectedElement);
  const editingElementId = useDesignerUiStore((s) => s.editingElementId);
  const setEditingElementId = useDesignerUiStore((s) => s.setEditingElementId);
  const isGenerating = useDesignerUiStore((s) => s.isGenerating);
  const setIsGenerating = useDesignerUiStore((s) => s.setIsGenerating);
  const previewIndex = useDesignerUiStore((s) => s.previewIndex);
  const setPreviewIndex = useDesignerUiStore((s) => s.setPreviewIndex);
  const wizardStep = useDesignerUiStore((s) => s.wizardStep);

  const { dimensions: imageDimensions } = useTemplateImage(imageUrl);

  const [outputSettings, setOutputSettings] = useState<OutputSettings>(DEFAULT_OUTPUT_SETTINGS);
  const [issuer, setIssuerState] = useState("");
  const hasHydratedIssuerRef = useRef(false);
  const hasHydratedSettingsRef = useRef(false);

  useEffect(() => {
    hasHydratedIssuerRef.current = false;
    hasHydratedSettingsRef.current = false;
  }, [workspaceKey]);

  useEffect(() => {
    if (appStateRow === undefined || hasHydratedIssuerRef.current) return;
    setIssuerState(appStateRow.issuer ?? "");
    hasHydratedIssuerRef.current = true;
  }, [appStateRow, workspaceKey]);

  useEffect(() => {
    if (appStateRow === undefined || hasHydratedSettingsRef.current) return;
    setOutputSettings(normalizeOutputSettings(appStateRow.outputSettings));
    hasHydratedSettingsRef.current = true;
  }, [appStateRow, workspaceKey]);

  const handleIssuerChange = useCallback((value: string) => {
    setIssuerState(value);
    void saveIssuer(value);
  }, []);

  const handleOutputSettingsChange = useCallback(
    (next: OutputSettings) => {
      const normalized = normalizeOutputSettings(next);
      setOutputSettings(normalized);
      void saveOutputSettings(normalized);
    },
    []
  );

  const textElements = useMemo(
    () => designElements.filter(isTextElement),
    [designElements]
  );
  const proofLinkElements = useMemo(
    () => designElements.filter(isProofLinkElement),
    [designElements]
  );

  const recordDrawContexts = useMemo((): RecordDrawContext[] => {
    return displayRecords.map((line, i) => ({
      recordLabel: line,
      record:
        recordRows !== null && recordRows[i] !== undefined ? recordRows[i]! : null,
      headers: recordRows !== null ? headers : [],
    }));
  }, [displayRecords, recordRows, headers]);

  const { report: auditReport, isAuditing } = usePreGenerationAudit({
    enabled: wizardStep === 1 || wizardStep === 2,
    textElements,
    proofLinkElements,
    displayLines: displayRecords,
    records: recordRows,
    headers,
    canvasWidth: imageDimensions?.width,
    canvasHeight: imageDimensions?.height,
    hasTemplate: Boolean(imageUrl),
  });

  const {
    batchProgress,
    cancelGeneration,
    generateImage,
    downloadOutput,
    generateOutputs,
    generateOutputsPDF,
    activeGenerationKind,
    generationReport,
    dismissGenerationReport,
  } = useDesignerGeneration({
    imageUrl,
    textElements,
    proofLinkElements,
    issuer,
    imageDimensions,
    recordDrawContexts,
    previewIndex,
    outputSettings,
    setIsGenerating,
    auditReport,
  });

  useEffect(() => {
    if (!selectedElement) return;
    if (designElements.some((el) => el.id === selectedElement)) return;
    setSelectedElement(null);
  }, [designElements, selectedElement, setSelectedElement]);

  useEffect(() => {
    if (!editingElementId) return;
    if (designElements.some((el) => el.id === editingElementId)) return;
    setEditingElementId(null);
  }, [designElements, editingElementId, setEditingElementId]);

  const dynamicTextElementsCount = useMemo(
    () => textElements.filter((el) => el.type === "dynamic-text" || el.type === "name").length,
    [textElements]
  );

  const proofLinkElementsCount = proofLinkElements.length;

  const persistedReport = appStateRow?.lastGenerationReport ?? null;

  const handleDismissReport = useCallback(() => {
    dismissGenerationReport();
    void clearLastGenerationReport();
  }, [dismissGenerationReport]);

  useEffect(() => {
    if (displayRecords.length === 0) {
      setPreviewIndex(0);
      return;
    }
    setPreviewIndex((i) => Math.min(i, displayRecords.length - 1));
  }, [displayRecords.length, setPreviewIndex]);

  const handleElementSelect = useCallback(
    (id: string | null) => {
      setSelectedElement(id);
    },
    [setSelectedElement]
  );

  const handleElementMove = useCallback((id: string, x: number, y: number) => {
    setDesignElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, x, y } : el))
    );
  }, [setDesignElements]);

  const handleElementUpdate = useCallback(
    (property: string, value: unknown) => {
      setDesignElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedElement) return el;
          if (isTextElement(el) && (property === "variable" || property === "variableColumn")) {
            if (
              value === undefined ||
              value === "" ||
              (typeof value === "string" && !value.trim())
            ) {
              const rest = { ...el } as TextElement & {
                variable?: string;
                variableColumn?: string;
              };
              delete rest.variable;
              delete rest.variableColumn;
              return rest as TextElement;
            }
          }
          if (property === "variableColumn") {
            return { ...el, variable: value as string } as DesignElement;
          }
          return { ...el, [property]: value } as DesignElement;
        })
      );
    },
    [selectedElement, setDesignElements]
  );

  const handleElementValueChange = useCallback(
    (id: string, value: string) => {
      setDesignElements((prev) =>
        prev.map((el) => (el.id === id && isTextElement(el) ? { ...el, value } : el))
      );
    },
    [setDesignElements]
  );

  const handleEditStart = useCallback(
    (id: string) => {
      setSelectedElement(id);
      setEditingElementId(id);
    },
    [setSelectedElement, setEditingElementId]
  );

  const handleEditEnd = useCallback(() => {
    setEditingElementId(null);
  }, [setEditingElementId]);

  const handleElementRemove = useCallback(() => {
    setDesignElements((prev) => prev.filter((el) => el.id !== selectedElement));
    setSelectedElement(null);
  }, [selectedElement, setSelectedElement, setDesignElements]);

  const handleAddTextElement = useCallback(
    (type: "dynamic-text" | "static", variableColumnForName?: string) => {
      const newElement: DesignElement =
        type === "dynamic-text"
          ? createDynamicTextElement(
              variableColumnForName !== undefined && variableColumnForName.trim() !== ""
                ? variableColumnForName
                : undefined
            )
          : createStaticElement();
      setDesignElements((prev) => [...prev, newElement]);
      setSelectedElement(newElement.id);
      if (type === "static") {
        setEditingElementId(newElement.id);
      }
      if (type === "dynamic-text" && displayRecords.length > 0) {
        setPreviewIndex(0);
      }
    },
    [setSelectedElement, setEditingElementId, displayRecords.length, setPreviewIndex, setDesignElements]
  );

  const handleAddProofLinkElement = useCallback(() => {
    const defaultSizePct = computeRecommendedProofLinkSizePct(
      imageDimensions.width,
      buildProofSizingPlaceholderUrl()
    );
    const newElement = createProofLinkElement(buildProofLinkUrlTemplate(), defaultSizePct);
    setDesignElements((prev) => [...prev, newElement]);
    setSelectedElement(newElement.id);
  }, [setDesignElements, setSelectedElement, imageDimensions.width]);

  const loadPreset = useCallback(
    (properties: Partial<TextProperties>) => {
      if (!selectedElement) return;
      setDesignElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedElement || !isTextElement(el)) return el;
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
    [selectedElement, setDesignElements]
  );

  const previewDrawContext: RecordDrawContext | null =
    textElements.some((el) => el.type === "dynamic-text" || el.type === "name") && recordDrawContexts.length > 0
      ? recordDrawContexts[previewIndex] ?? recordDrawContexts[0] ?? null
      : null;

  const canvasPreviewProps = useMemo(
    () => ({
      imageUrl,
      designElements,
      selectedElement,
      editingElementId,
      onElementSelect: handleElementSelect,
      onElementMove: handleElementMove,
      onEditStart: handleEditStart,
      onEditEnd: handleEditEnd,
      onEditCommit: handleElementValueChange,
      imageDimensions,
      previewDrawContext,
      auditReport,
      previewIndex,
    }),
    [
      imageUrl,
      designElements,
      selectedElement,
      editingElementId,
      handleElementSelect,
      handleElementMove,
      handleEditStart,
      handleEditEnd,
      handleElementValueChange,
      imageDimensions,
      previewDrawContext,
      auditReport,
      previewIndex,
    ]
  );

  const outputPreviewProps = useMemo(
    () => ({
      imageUrl,
      records: displayRecords,
      previewIndex,
      designElements,
      onDownload: downloadOutput,
      onPreviewChange: setPreviewIndex,
      imageDimensions,
      previewDrawContext,
    }),
    [
      imageUrl,
      displayRecords,
      previewIndex,
      designElements,
      downloadOutput,
      setPreviewIndex,
      imageDimensions,
      previewDrawContext,
    ]
  );

  return {
    imageUrl,
    records: displayRecords,
    designElements,
    textElements,
    proofLinkElements,
    /** @deprecated Use `proofLinkElements` instead. */
    qrElements: proofLinkElements,
    selectedElement,
    isGenerating,
    activeGenerationKind,
    batchProgress,
    cancelGeneration,
    auditReport,
    isAuditing,
    outputSettings,
    handleOutputSettingsChange,
    issuer,
    handleIssuerChange,
    previewIndex,
    imageDimensions,
    handleElementSelect,
    handleElementMove,
    handleElementUpdate,
    handleElementRemove,
    handleAddTextElement,
    handleAddProofLinkElement,
    /** @deprecated Use `handleAddProofLinkElement` instead. */
    handleAddQrElement: handleAddProofLinkElement,
    generateImage,
    downloadOutput,
    generateOutputs,
    generateOutputsPDF,
    canvasPreviewProps,
    outputPreviewProps,
    recordsCount: displayRecords.length,
    textElementsCount: designElements.length,
    dynamicTextElementsCount,
    proofLinkElementsCount,
    /** @deprecated Use `proofLinkElementsCount` instead. */
    qrElementsCount: proofLinkElementsCount,
    loadPreset,
    recordLinesMode,
    recordCsvHeaders: headers,
    generationReport: generationReport ?? persistedReport,
    dismissGenerationReport: handleDismissReport,
  };
}

export type DesignerController = ReturnType<typeof useDesignerController>;

/** @deprecated Use `useDesignerController` instead. */
export { useDesignerController as useCertificateDesigner };
/** @deprecated Use `DesignerController` instead. */
export type { DesignerController as CertificateDesignerController };
