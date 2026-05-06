"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/hooks/useToast";
import type { TextElement, ImageDimensions } from "@/types/types";
import type { PageSizeId } from "@/lib/page-size";
import { generateCertificateImage as generateCertificateImageUtil } from "@/lib/certificate-image";
import { generatePDF } from "@/lib/pdf";
import { buildPrintHtml } from "@/lib/print-html";
import {
  generateCertificatesBatch,
  generateCertificateImagesBatch,
  BatchAbortError,
  sanitizeOutputBasename,
  sanitizeAttendeeForFilename,
  type BatchProgress,
} from "@/lib/batch/batch-engine";

/** Which bulk export action is running — drives per-button loading UI. */
export type ActiveGenerationKind = "png" | "pdf" | "print";

export function useDesignerGeneration(params: {
  imageUrl: string | null;
  textElements: TextElement[];
  imageDimensions: ImageDimensions;
  attendees: string[];
  previewIndex: number;
  pageSize: PageSizeId;
  outputFileBaseName: string;
  setIsGenerating: (v: boolean) => void;
}) {
  const {
    imageUrl,
    textElements,
    imageDimensions,
    attendees,
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
    async (name: string): Promise<string | null> => {
      try {
        if (!imageUrl) throw new Error("No certificate template available");
        const dataUrl = await generateCertificateImageUtil(
          imageUrl,
          textElements,
          imageDimensions,
          name
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
    if (!attendees[previewIndex]) {
      toast({
        title: "No attendee selected",
        description: "Please select an attendee to download the certificate.",
        variant: "destructive",
      });
      return;
    }

    try {
      const imageData = await generateCertificateImage(attendees[previewIndex]);
      if (!imageData) return;

      const safeBase = sanitizeOutputBasename(outputFileBaseName);
      const link = document.createElement("a");
      link.href = imageData;
      link.download = `${safeBase}_${sanitizeAttendeeForFilename(attendees[previewIndex], previewIndex)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Certificate downloaded",
        description: `Certificate for ${attendees[previewIndex]} has been downloaded.`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "There was an error downloading the certificate.",
        variant: "destructive",
      });
    }
  }, [attendees, previewIndex, generateCertificateImage, toast, outputFileBaseName]);

  const generateCertificates = useCallback(async () => {
    if (!imageUrl || attendees.length === 0 || !textElements.some((el) => el.type === "name")) {
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
    setBatchProgress({ current: 0, total: attendees.length, phase: "rendering" });

    let blobUrl: string | null = null;
    const safeBase = sanitizeOutputBasename(outputFileBaseName);
    try {
      const content = await generateCertificatesBatch({
        imageUrl,
        attendees,
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
        description: `Successfully generated ${attendees.length} certificates.`,
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
  }, [imageUrl, attendees, textElements, imageDimensions, toast, setIsGenerating, outputFileBaseName]);

  const generateCertificatesPDF = useCallback(async () => {
    if (!imageUrl || attendees.length === 0 || !textElements.some((el) => el.type === "name")) {
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
    setBatchProgress({ current: 0, total: attendees.length, phase: "rendering" });

    try {
      const certificates = await generateCertificateImagesBatch({
        imageUrl,
        attendees,
        textElements,
        imageDimensions,
        onProgress: setBatchProgress,
        signal: controller.signal,
      });

      setBatchProgress({ current: attendees.length, total: attendees.length, phase: "zipping" });
      await generatePDF(certificates, `${sanitizeOutputBasename(outputFileBaseName)}.pdf`, { pageSize });

      toast({
        title: "PDF generated",
        description: `Successfully generated PDF with ${attendees.length} certificates.`,
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
    attendees,
    textElements,
    imageDimensions,
    toast,
    setIsGenerating,
    pageSize,
    outputFileBaseName,
  ]);

  const printCertificates = useCallback(async () => {
    if (!imageUrl || attendees.length === 0 || !textElements.some((el) => el.type === "name")) {
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
    setActiveGenerationKind("print");
    setBatchProgress({ current: 0, total: attendees.length, phase: "rendering" });

    try {
      const certificates = await generateCertificateImagesBatch({
        imageUrl,
        attendees,
        textElements,
        imageDimensions,
        onProgress: setBatchProgress,
        signal: controller.signal,
      });

      if (certificates.length === 0) {
        toast({
          title: "No certificates generated",
          description: "Failed to generate certificates for printing.",
          variant: "destructive",
        });
        return;
      }

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast({
          title: "Print failed",
          description: "Please allow pop-ups to print certificates.",
          variant: "destructive",
        });
        return;
      }

      const htmlContent = buildPrintHtml({
        certificates,
        attendees,
        pageSize,
        imageWidthPx: imageDimensions.width,
        imageHeightPx: imageDimensions.height,
      });

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      const images = printWindow.document.querySelectorAll("img");
      let settledImages = 0;
      let failedImageCount = 0;

      const schedulePrintWhenAllSettled = () => {
        if (settledImages !== images.length) return;
        if (failedImageCount > 0) {
          toast({
            title: "Some certificate images failed to load",
            description:
              "The print preview may be incomplete. Check your template and try again.",
            variant: "destructive",
          });
        }
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 1000);
      };

      const onImageSettled = (ok: boolean) => {
        settledImages++;
        if (!ok) failedImageCount++;
        schedulePrintWhenAllSettled();
      };

      images.forEach((img) => {
        if (img.complete) {
          onImageSettled(true);
        } else {
          img.onload = () => onImageSettled(true);
          img.onerror = () => onImageSettled(false);
        }
      });

      if (images.length === 0) {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 1000);
      }

      toast({
        title: "Print dialog opened",
        description: `Ready to print ${attendees.length} certificates.`,
      });
    } catch (error) {
      if (error instanceof BatchAbortError) {
        toast({
          title: "Generation cancelled",
          description: "The certificate batch was cancelled.",
        });
      } else {
        toast({
          title: "Print failed",
          description:
            error instanceof Error ? error.message : "There was an error preparing certificates for printing.",
          variant: "destructive",
        });
      }
    } finally {
      abortControllerRef.current = null;
      setBatchProgress(null);
      setActiveGenerationKind(null);
      setIsGenerating(false);
    }
  }, [imageUrl, attendees, textElements, toast, setIsGenerating, pageSize, imageDimensions]);

  return {
    batchProgress,
    cancelGeneration,
    generateCertificateImage,
    downloadCertificate,
    generateCertificates,
    generateCertificatesPDF,
    printCertificates,
    activeGenerationKind,
  };
}
