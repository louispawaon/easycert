"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/hooks/useToast";
import type { TextElement, ProofLinkElement, ImageDimensions } from "@/types/types";
import { isProofLinkElement } from "@/types/types";
import { renderImage } from "@/lib/render-image";
import {
  generateOutputBatch,
  BatchAbortError,
  sanitizeOutputBasename,
  sanitizeRecordForFilename,
  type BatchProgress,
} from "@/lib/batch/batch-engine";
import { issueProofTokens } from "@/lib/proof/client";
import { buildProofUrl } from "@/lib/proof/url";
import { PROOF_TOKEN_PLACEHOLDER } from "@/lib/proof/url";
import type { RecordDrawContext } from "@/lib/canvas/draw-text-element";
import type { OutputSettings } from "@/lib/output/output-settings";
import { containerStemForPattern } from "@/lib/output/filename-pattern";
import type { AuditReport } from "@/lib/audit/pre-generation-audit";
import type { GenerationReport, FlaggedRecord } from "@/lib/output/generation-report";
import { saveLastGenerationReport } from "@/lib/db/app-state";

export type ActiveGenerationKind = "png" | "webp" | "pdf" | "png-pdf" | "webp-pdf";

export function useDesignerGeneration(params: {
  imageUrl: string | null;
  textElements: TextElement[];
  proofLinkElements: ProofLinkElement[];
  issuer: string;
  imageDimensions: ImageDimensions;
  recordDrawContexts: RecordDrawContext[];
  previewIndex: number;
  outputSettings: OutputSettings;
  setIsGenerating: (v: boolean) => void;
  auditReport?: AuditReport | null;
}) {
  const {
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
  } = params;

  const { toast } = useToast();
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [activeGenerationKind, setActiveGenerationKind] =
    useState<ActiveGenerationKind | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [generationReport, setGenerationReport] = useState<GenerationReport | null>(null);

  const dismissGenerationReport = useCallback(() => {
    setGenerationReport(null);
  }, []);

  const cancelGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const hasProofLink = proofLinkElements.length > 0;

  const issueTokens = useCallback(
    async (contexts: RecordDrawContext[]): Promise<string[]> => {
      const payloads = contexts.map((ctx, i) => {
        const name =
          (ctx.recordLabel ?? ctx.attendeeName)?.trim() || `Record ${i + 1}`;
        return {
          sub: name,
          name,
          issuer:
            issuer && issuer.trim().length > 0 ? issuer.trim() : undefined,
          iat: Math.floor(Date.now() / 1000),
          jti: crypto.randomUUID(),
        };
      });
      return issueProofTokens(payloads);
    },
    [issuer]
  );

  const generateSingleImage = useCallback(
    async (
      drawOpts: RecordDrawContext,
      proofUrl?: string
    ): Promise<string | null> => {
      try {
        if (!imageUrl) throw new Error("No design template available");
        const dataUrl = await renderImage(
          imageUrl,
          textElements,
          proofLinkElements,
          issuer,
          imageDimensions,
          drawOpts,
          proofUrl ?? buildProofUrl("preview")
        );
        return dataUrl;
      } catch (error) {
        toast({
          title: "Image generation failed",
          description:
            error instanceof Error
              ? error.message
              : "There was an error generating the image.",
          variant: "destructive",
        });
        return null;
      }
    },
    [imageUrl, textElements, proofLinkElements, issuer, imageDimensions, toast]
  );

  const generateImage = useCallback(
    async (
      drawOpts: RecordDrawContext,
      proofUrl?: string
    ): Promise<string | null> => {
      return generateSingleImage(drawOpts, proofUrl);
    },
    [generateSingleImage]
  );

  const downloadOutput = useCallback(async () => {
    const ctx = recordDrawContexts[previewIndex];
    const line = (ctx?.recordLabel ?? ctx?.attendeeName ?? "").trim();
    if (!ctx || line.length === 0) {
      toast({
        title: "No record selected",
        description: "Please select a record to download the image.",
        variant: "destructive",
      });
      return;
    }

    try {
      let proofUrl: string | undefined;
      if (hasProofLink) {
        const tokens = await issueTokens([ctx]);
        proofUrl = buildProofUrl(tokens[0]!);
      }

      const imageData = await generateImage(ctx, proofUrl);
      if (!imageData) return;

      const safeBase = sanitizeOutputBasename(
        containerStemForPattern(outputSettings.filenamePattern, "output")
      );
      const link = document.createElement("a");
      link.href = imageData;
      link.download = `${safeBase}_${sanitizeRecordForFilename(line, previewIndex)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Image downloaded",
        description: `Output for ${line} has been downloaded.`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error downloading the image.",
        variant: "destructive",
      });
    }
  }, [
    recordDrawContexts,
    previewIndex,
    hasProofLink,
    issueTokens,
    generateImage,
    toast,
    outputSettings.filenamePattern,
  ]);

  const runBatch = useCallback(async () => {
    if (
      !imageUrl ||
      recordDrawContexts.length === 0 ||
      !textElements.some(
        (el) => el.type === "dynamic-text" || el.type === "name"
      )
    ) {
      toast({
        title: "Missing requirements",
        description:
          "Please ensure you have a template, records, and at least one dynamic text element.",
        variant: "destructive",
      });
      return;
    }

    const settings = outputSettings;

    const kind: ActiveGenerationKind =
      settings.format === "pdf"
        ? "pdf"
        : settings.bundle === "with-pdf"
          ? settings.format === "webp"
            ? "webp-pdf"
            : "png-pdf"
          : settings.format === "webp"
            ? "webp"
            : "png";

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsGenerating(true);
    setActiveGenerationKind(kind);
    setBatchProgress({
      current: 0,
      total: recordDrawContexts.length,
      phase: "rendering",
    });

    try {
      let proofTokens: string[] | undefined;
      if (hasProofLink) {
        setBatchProgress({
          current: 0,
          total: recordDrawContexts.length,
          phase: "rendering",
        });
        proofTokens = await issueTokens(recordDrawContexts);
      }

      let downloadExt = "zip";
      if (settings.format === "pdf") {
        downloadExt = "pdf";
      } else if (settings.bundle === "with-pdf") {
        downloadExt = "zip";
      }

      const containerStem = containerStemForPattern(settings.filenamePattern);

      const content = await generateOutputBatch(settings, {
        imageUrl,
        recordDrawOptions: recordDrawContexts,
        textElements,
        proofLinkElements,
        issuer,
        proofTokens,
        imageDimensions,
        onProgress: setBatchProgress,
        signal: controller.signal,
      });

      const blobUrl = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${containerStem}.${downloadExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const label =
        settings.format === "pdf"
          ? "PDF generated"
          : "Outputs generated";
      const desc =
        settings.format === "pdf"
          ? `Successfully generated PDF with ${recordDrawContexts.length} pages.`
          : `Successfully generated ${recordDrawContexts.length} outputs.`;

      toast({ title: label, description: desc });

      if (auditReport && auditReport.totalRecords > 0) {
        const flaggedRecords: FlaggedRecord[] = [];
        for (const finding of auditReport.findings) {
          if (finding.severity === "warning" || finding.severity === "error") {
            const indices = finding.sampleRecordIndices ?? [];
            for (const idx of indices) {
              const ctx = recordDrawContexts[idx];
              if (!ctx) continue;
              const recLabel = (ctx.recordLabel ?? `Record ${idx + 1}`).trim();
              let existing = flaggedRecords.find((r) => r.index === idx);
              if (!existing) {
                existing = { index: idx, label: recLabel, issues: [] };
                flaggedRecords.push(existing);
              }
              existing.issues.push(finding.kind);
            }
          }
        }

        const report: GenerationReport = {
          generatedAt: Date.now(),
          totalRecords: auditReport.totalRecords,
          warningCount: flaggedRecords.length,
          outputFilename: `${containerStem}.${downloadExt}`,
          findings: auditReport.findings,
          flaggedRecords,
        };
        setGenerationReport(report);
        void saveLastGenerationReport(report);
      }
    } catch (error) {
      if (error instanceof BatchAbortError) {
        toast({
          title: "Generation cancelled",
          description: "The batch was cancelled.",
        });
      } else {
        toast({
          title: "Error generating outputs",
          description:
            error instanceof Error
              ? error.message
              : "There was an error generating the outputs.",
          variant: "destructive",
        });
      }
    } finally {
      abortControllerRef.current = null;
      setBatchProgress(null);
      setActiveGenerationKind(null);
      setIsGenerating(false);
    }
  }, [
    imageUrl,
    recordDrawContexts,
    textElements,
    proofLinkElements,
    issuer,
    hasProofLink,
    imageDimensions,
    toast,
    setIsGenerating,
    issueTokens,
    outputSettings,
    auditReport,
  ]);

  const generateOutputs = useCallback(async () => {
    return runBatch();
  }, [runBatch]);

  const generateOutputsPDF = useCallback(async () => {
    return runBatch();
  }, [runBatch]);

  return {
    batchProgress,
    cancelGeneration,
    generateImage,
    downloadOutput,
    generateOutputs,
    generateOutputsPDF,
    activeGenerationKind,
    generationReport,
    dismissGenerationReport,
  };
}
