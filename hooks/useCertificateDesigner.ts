"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useToast } from "@/hooks/useToast";
import { TextElement, createNameElement, createStaticElement } from "@/types/types";
import { useAttendees } from "@/hooks/useAttendees";
import { useCertificateImage } from "@/hooks/useCertificate";
import { useCertificateTemplateImage } from "@/hooks/useCertificateTemplateImage";
import { easyCertDb } from "@/lib/db/easycert-db";
import { saveTextElements } from "@/lib/db/app-state";
import { formatSavedAtLabel } from "@/lib/db/session-utils";
import { generatePDF } from "@/lib/pdf";
import { generateCertificateImage as generateCertificateImageUtil } from "@/lib/utils";
import { generateCertificates as generateCertificatesUtil } from "@/lib/utils";
import { useDesignerUiStore } from "@/store/designer-ui-store";
import { buildPrintHtml } from "@/lib/print-html";

/**
 * Subset of `TextElement` that defines visual style. Used by the preset
 * load/save UI so users can copy styling between elements without copying
 * placement (x/y/maxWidthPct).
 */
export interface TextProperties {
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'bold';
  maxWidthPct: number;
}

const STYLE_KEYS: ReadonlyArray<keyof TextProperties> = [
  'fontSize',
  'fontFamily',
  'color',
  'fontWeight',
  'maxWidthPct',
];

export function useCertificateDesigner() {
  const { toast } = useToast();
  const { imageUrl } = useCertificateImage();
  const { attendees } = useAttendees();
  const [textElements, setTextElements] = useState<TextElement[]>([]);

  const selectedElement = useDesignerUiStore((s) => s.selectedElement);
  const setSelectedElement = useDesignerUiStore((s) => s.setSelectedElement);
  const isGenerating = useDesignerUiStore((s) => s.isGenerating);
  const setIsGenerating = useDesignerUiStore((s) => s.setIsGenerating);
  const previewIndex = useDesignerUiStore((s) => s.previewIndex);
  const setPreviewIndex = useDesignerUiStore((s) => s.setPreviewIndex);
  const activeTab = useDesignerUiStore((s) => s.activeTab);
  const setActiveTab = useDesignerUiStore((s) => s.setActiveTab);
  const pageSize = useDesignerUiStore((s) => s.pageSize);
  const setPageSize = useDesignerUiStore((s) => s.setPageSize);

  const { dimensions: imageDimensions } = useCertificateTemplateImage(imageUrl);

  const appStateRow = useLiveQuery(() => easyCertDb.appState.get("default"));
  const didHydrateTextElements = useRef(false);
  const skipNextTextElementsPersist = useRef(true);
  const debounceTimerRef = useRef<number | null>(null);
  const dirtyTextRef = useRef(false);
  const textElementsRef = useRef<TextElement[]>(textElements);
  textElementsRef.current = textElements;

  const [autosaveClock, setAutosaveClock] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setAutosaveClock((c) => c + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const autosaveStatus = useMemo(
    () => formatSavedAtLabel(appStateRow?.savedAt),
    [appStateRow?.savedAt, autosaveClock]
  );

  useEffect(() => {
    if (appStateRow === undefined || didHydrateTextElements.current) return;
    didHydrateTextElements.current = true;
    if (appStateRow.textElements?.length) {
      setTextElements(appStateRow.textElements);
    }
    skipNextTextElementsPersist.current = true;
  }, [appStateRow]);

  useEffect(() => {
    if (appStateRow === undefined || !didHydrateTextElements.current) return;
    if (skipNextTextElementsPersist.current) {
      skipNextTextElementsPersist.current = false;
      return;
    }
    dirtyTextRef.current = true;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      void saveTextElements(textElementsRef.current).then(() => {
        dirtyTextRef.current = false;
      });
    }, 400);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [textElements, appStateRow]);

  useEffect(() => {
    const flush = () => {
      if (document.visibilityState !== "hidden") return;
      if (!dirtyTextRef.current) return;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      void saveTextElements(textElementsRef.current);
      dirtyTextRef.current = false;
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  const attendeesCount = useMemo(() => attendees.length, [attendees]);
  const textElementsCount = useMemo(() => textElements.length, [textElements]);
  const namePlaceholdersCount = useMemo(
    () => textElements.filter(el => el.type === 'name').length,
    [textElements]
  );

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      if (value === "preview" && textElements.some((el) => el.type === "name") && attendees.length > 0) {
        setPreviewIndex(0);
      }
    },
    [textElements, attendees, setActiveTab, setPreviewIndex]
  );

  const handleElementSelect = useCallback((id: string | null) => {
    setSelectedElement(id);
  }, [setSelectedElement]);

  const handleElementMove = useCallback((id: string, x: number, y: number) => {
    setTextElements(prev =>
      prev.map(el => (el.id === id ? { ...el, x, y } : el))
    );
  }, []);

  const handleElementUpdate = useCallback(
    (property: keyof TextElement, value: string | number) => {
      setTextElements(prev =>
        prev.map(el => (el.id === selectedElement ? { ...el, [property]: value } : el))
      );
    },
    [selectedElement]
  );

  const handleElementRemove = useCallback(() => {
    setTextElements(prev => prev.filter(el => el.id !== selectedElement));
    setSelectedElement(null);
  }, [selectedElement, setSelectedElement]);

  const handleAddTextElement = useCallback(
    (type: 'name' | 'static') => {
      const newElement = type === 'name' ? createNameElement() : createStaticElement();
      setTextElements(prev => [...prev, newElement]);
      setSelectedElement(newElement.id);
    },
    [setSelectedElement]
  );

  const generateCertificateImage = useCallback(
    async (name: string): Promise<string | null> => {
      try {
        if (!imageUrl) throw new Error('No certificate template available');
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
          description: error instanceof Error ? error.message : "There was an error generating the certificate image.",
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

      const link = document.createElement('a');
      link.href = imageData;
      link.download = `certificate_${attendees[previewIndex]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Certificate downloaded",
        description: `Certificate for ${attendees[previewIndex]} has been downloaded.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "There was an error downloading the certificate.",
        variant: "destructive",
      });
    }
  }, [attendees, previewIndex, generateCertificateImage, toast]);

  const generateCertificates = useCallback(async () => {
    if (!imageUrl || attendees.length === 0 || !textElements.some(el => el.type === 'name')) {
      toast({
        title: "Missing requirements",
        description: "Please ensure you have a template, attendees, and at least one name placeholder.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const content = await generateCertificatesUtil(
        imageUrl,
        attendees,
        textElements,
        imageDimensions
      );

      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'certificates.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Certificates generated",
        description: `Successfully generated ${attendees.length} certificates.`,
      });
    } catch (error) {
      toast({
        title: "Error generating certificates",
        description: error instanceof Error ? error.message : "There was an error generating the certificates.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [imageUrl, attendees, textElements, imageDimensions, toast, setIsGenerating]);

  const generateCertificatesPDF = useCallback(async () => {
    setIsGenerating(true);
    try {
      const certificates: string[] = [];
      for (const attendee of attendees) {
        const cert = await generateCertificateImage(attendee);
        if (cert) certificates.push(cert);
      }
      await generatePDF(certificates, 'Certificates.pdf', { pageSize });
    } finally {
      setIsGenerating(false);
    }
  }, [attendees, generateCertificateImage, setIsGenerating, pageSize]);

  const printCertificates = useCallback(async () => {
    if (!imageUrl || attendees.length === 0 || !textElements.some(el => el.type === 'name')) {
      toast({
        title: "Missing requirements",
        description: "Please ensure you have a template, attendees, and at least one name placeholder.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const certificates: string[] = [];
      for (const attendee of attendees) {
        const cert = await generateCertificateImage(attendee);
        if (cert) certificates.push(cert);
      }

      if (certificates.length === 0) {
        toast({
          title: "No certificates generated",
          description: "Failed to generate certificates for printing.",
          variant: "destructive",
        });
        return;
      }

      const printWindow = window.open('', '_blank');
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

      const images = printWindow.document.querySelectorAll('img');
      let loadedImages = 0;

      const checkAllImagesLoaded = () => {
        loadedImages++;
        if (loadedImages === images.length) {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 1000);
        }
      };

      images.forEach(img => {
        if (img.complete) {
          checkAllImagesLoaded();
        } else {
          img.onload = checkAllImagesLoaded;
          img.onerror = checkAllImagesLoaded;
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
      toast({
        title: "Print failed",
        description: error instanceof Error ? error.message : "There was an error preparing certificates for printing.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [imageUrl, attendees, textElements, generateCertificateImage, toast, setIsGenerating, pageSize, imageDimensions]);

  const loadPreset = useCallback(
    (properties: Partial<TextProperties>) => {
      if (!selectedElement) return;
      for (const key of STYLE_KEYS) {
        const value = properties[key];
        if (value === undefined) continue;
        handleElementUpdate(key as keyof TextElement, value as string | number);
      }
    },
    [selectedElement, handleElementUpdate]
  );

  const canvasPreviewProps = useMemo(
    () => ({
      imageUrl,
      textElements,
      selectedElement,
      onElementSelect: handleElementSelect,
      onElementMove: handleElementMove,
      imageDimensions,
    }),
    [imageUrl, textElements, selectedElement, handleElementSelect, handleElementMove, imageDimensions]
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
    }),
    [
      imageUrl,
      attendees,
      previewIndex,
      textElements,
      downloadCertificate,
      setPreviewIndex,
      imageDimensions,
    ]
  );

  return {
    imageUrl,
    attendees,
    textElements,
    selectedElement,
    isGenerating,
    previewIndex,
    activeTab,
    imageDimensions,
    pageSize,
    setPageSize,
    handleTabChange,
    handleElementSelect,
    handleElementMove,
    handleElementUpdate,
    handleElementRemove,
    handleAddTextElement,
    generateCertificateImage,
    downloadCertificate,
    generateCertificates,
    generateCertificatesPDF,
    printCertificates,
    canvasPreviewProps,
    certificatePreviewProps,
    attendeesCount,
    textElementsCount,
    namePlaceholdersCount,
    loadPreset,
    autosaveStatus,
  };
}
