"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/hooks/useToast";
import type { TextElement, ImageDimensions } from "@/types/types";
import type { PageSizeId } from "@/lib/page-size";
import { generateCertificateImage as generateCertificateImageUtil } from "@/lib/certificate-image";
import { generatePDF } from "@/lib/pdf";
import {
  generateCertificatesBatch,
  generateCertificateImagesBatch,
  BatchAbortError,
  sanitizeOutputBasename,
  sanitizeAttendeeForFilename,
  type BatchProgress,
} from "@/lib/batch/batch-engine";

import type { DrawCertificateOptions } from "@/lib/canvas/draw-text-element";

/** Which bulk export action is running — drives per-button loading UI. */
export type ActiveGenerationKind = "png" | "pdf";

export function useDesignerGeneration(params: {
  imageUrl: string | null;
  textElements: TextElement[];
  imageDimensions: ImageDimensions;
  attendeeDrawContexts: DrawCertificateOptions[];
  previewIndex: number;
  pageSize: PageSizeId;
  outputFileBaseName: string;
  setIsGenerating: (v: boolean) => void;
}) {
  const {
    imageUrl,
    textElements,
    imageDimensions,
    attendeeDrawContexts,
    previewIndex,
    pageSize,
    outputFileBaseName,
    setIsGenerating,
  } = params;

  const { toast } = useToast();
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [activeGenerationKind, setActiveGenerationKind] =
    useState<ActiveGenerationKind | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const generateCertificateImage = useCallback(
    async (drawOpts: DrawCertificateOptions): Promise<string | null> => {
      try {
        if (!imageUrl) throw new Error("No certificate template available");
        const dataUrl = await generateCertificateImageUtil(
          imageUrl,
          textElements,
          imageDimensions,
          drawOpts
        );
        return dataUrl;
      } catch (error) {
        toast({
          title: "Image generation failed",
          description:
            error instanceof Error ? error.message : "There was an error generating the certificate image.",
          variant: "destructive",
        });
        return null;
      }
    },
    [imageUrl, textElements, imageDimensions, toast]
  );

  const downloadCertificate = useCallback(async () => {
    const ctx = attendeeDrawContexts[previewIndex];
    const line = (ctx?.attendeeName ?? "").trim();
    if (!ctx || line.length === 0) {
      toast({
        title: "No attendee selected",
        description: "Please select an attendee to download the certificate.",
        variant: "destructive",
      });
      return;
    }

    try {
      const imageData = await generateCertificateImage(ctx);
      if (!imageData) return;

      const safeBase = sanitizeOutputBasename(outputFileBaseName);
      const link = document.createElement("a");
      link.href = imageData;
      link.download = `${safeBase}_${sanitizeAttendeeForFilename(line, previewIndex)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Certificate downloaded",
        description: `Certificate for ${line} has been downloaded.`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "There was an error downloading the certificate.",
        variant: "destructive",
      });
    }
  }, [attendeeDrawContexts, previewIndex, generateCertificateImage, toast, outputFileBaseName]);

  const generateCertificates = useCallback(async () => {
    if (
      !imageUrl ||
      attendeeDrawContexts.length === 0 ||
      !textElements.some((el) => el.type === "name")
    ) {
      toast({
        title: "Missing requirements",
        description:
          "Please ensure you have a template, attendees, and at least one name placeholder.",
        variant: "destructive",
      });
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsGenerating(true);
    setActiveGenerationKind("png");
    setBatchProgress({ current: 0, total: attendeeDrawContexts.length, phase: "rendering" });

    let blobUrl: string | null = null;
    const safeBase = sanitizeOutputBasename(outputFileBaseName);
    try {
      const content = await generateCertificatesBatch({
        imageUrl,
        attendeeDrawOptions: attendeeDrawContexts,
        textElements,
        imageDimensions,
        pngFilenamePrefix: safeBase,
        onProgress: setBatchProgress,
        signal: controller.signal,
      });

      blobUrl = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${safeBase}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Certificates generated",
        description: `Successfully generated ${attendeeDrawContexts.length} certificates.`,
      });
    } catch (error) {
      if (error instanceof BatchAbortError) {
        toast({
          title: "Generation cancelled",
          description: "The certificate batch was cancelled.",
        });
      } else {
        toast({
          title: "Error generating certificates",
          description:
            error instanceof Error ? error.message : "There was an error generating the certificates.",
          variant: "destructive",
        });
      }
    } finally {
      if (blobUrl) {
        const url = blobUrl;
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
      abortControllerRef.current = null;
      setBatchProgress(null);
      setActiveGenerationKind(null);
      setIsGenerating(false);
    }
  }, [
    imageUrl,
    attendeeDrawContexts,
    textElements,
    imageDimensions,
    toast,
    setIsGenerating,
    outputFileBaseName,
  ]);

  const generateCertificatesPDF = useCallback(async () => {
    if (
      !imageUrl ||
      attendeeDrawContexts.length === 0 ||
      !textElements.some((el) => el.type === "name")
    ) {
      toast({
        title: "Missing requirements",
        description:
          "Please ensure you have a template, attendees, and at least one name placeholder.",
        variant: "destructive",
      });
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsGenerating(true);
    setActiveGenerationKind("pdf");
    setBatchProgress({ current: 0, total: attendeeDrawContexts.length, phase: "rendering" });

    try {
      const certificates = await generateCertificateImagesBatch({
        imageUrl,
        attendeeDrawOptions: attendeeDrawContexts,
        textElements,
        imageDimensions,
        onProgress: setBatchProgress,
        signal: controller.signal,
      });

      setBatchProgress({
        current: attendeeDrawContexts.length,
        total: attendeeDrawContexts.length,
        phase: "zipping",
      });
      await generatePDF(certificates, `${sanitizeOutputBasename(outputFileBaseName)}.pdf`, { pageSize });

      toast({
        title: "PDF generated",
        description: `Successfully generated PDF with ${attendeeDrawContexts.length} certificates.`,
      });
    } catch (error) {
      if (error instanceof BatchAbortError) {
        toast({
          title: "Generation cancelled",
          description: "The certificate batch was cancelled.",
        });
      } else {
        toast({
          title: "Error generating PDF",
          description: error instanceof Error ? error.message : "There was an error generating the PDF.",
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
    attendeeDrawContexts,
    textElements,
    imageDimensions,
    toast,
    setIsGenerating,
    pageSize,
    outputFileBaseName,
  ]);

  return {
    batchProgress,
    cancelGeneration,
    generateCertificateImage,
    downloadCertificate,
    generateCertificates,
    generateCertificatesPDF,
    activeGenerationKind,
  };
}
