"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { useToast } from "@/hooks/useToast";
import { TextElement } from "@/types/types";
import { useAttendees } from "@/hooks/useAttendees";
import { useCertificateImage } from "@/hooks/useCertificate";
import { easyCertDb } from "@/lib/db/easycert-db";
import { saveTextElements } from "@/lib/db/app-state";
import { formatSavedAtLabel } from "@/lib/db/session-utils";
import { loadCertificateImageNaturalSize } from "@/lib/cert-image-dimensions";
import { generatePDF } from "@/lib/pdf";
import { generateCertificateImage as generateCertificateImageUtil } from "@/lib/utils";
import { generateCertificates as generateCertificatesUtil } from "@/lib/utils";
import { useDesignerUiStore } from "@/store/designer-ui-store";

interface TextProperties {
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'bold' | 'lighter';
  fontStyle: string;
  textDecoration: string;
  textAlign: string;
  lineHeight: number;
}

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

  const { data: imageDimensions = { width: 0, height: 0 } } = useQuery({
    queryKey: ["easycert", "cert-image-dims", imageUrl],
    queryFn: () => loadCertificateImageNaturalSize(imageUrl!),
    enabled: Boolean(imageUrl),
  });

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

  // Memoize expensive calculations
  const attendeesCount = useMemo(() => attendees.length, [attendees]);
  const textElementsCount = useMemo(() => textElements.length, [textElements]);
  const namePlaceholdersCount = useMemo(
    () => textElements.filter(el => el.type === 'name').length,
    [textElements]
  );

  // Event handlers
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
  }, []);

  const handleElementDragStart = useCallback((id: string, e: React.MouseEvent) => {
    const element = textElements.find(el => el.id === id);
    if (!element) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startElementX = element.x;
    const startElementY = element.y;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      setTextElements(prev => 
        prev.map(el => 
          el.id === id ? { ...el, x: startElementX + dx, y: startElementY + dy } : el
        )
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [textElements]);

  const handleElementUpdate = useCallback((property: keyof TextElement, value: string | number) => {
    setTextElements(prev => prev.map(el => 
      el.id === selectedElement ? { ...el, [property]: value } : el
    ));
  }, [selectedElement]);

  const handleElementRemove = useCallback(() => {
    setTextElements(prev => prev.filter(el => el.id !== selectedElement));
    setSelectedElement(null);
  }, [selectedElement]);

  const handleAddTextElement = useCallback((type: 'name' | 'static') => {
    const newElement: TextElement = {
      id: crypto.randomUUID(),
      type,
      text: type === 'name' ? 'Attendee Name' : 'Sample Text',
      x: 100,
      y: 100,
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#000000',
      isDragging: false,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'left',
      lineHeight: 1.2
    };
    setTextElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  }, []);

  // Certificate generation
  const generateCertificateImage = useCallback(async (name: string): Promise<string | null> => {
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
  }, [imageUrl, textElements, imageDimensions, toast]);

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
  }, [imageUrl, attendees, textElements, imageDimensions, toast]);

  const generateCertificatesPDF = useCallback(async () => {
    setIsGenerating(true);
    try {
      const certificates: string[] = [];
      for (const attendee of attendees) {
        const cert = await generateCertificateImage(attendee);
        if (cert) certificates.push(cert);
      }
      await generatePDF(certificates, 'Certificates.pdf');
    } finally {
      setIsGenerating(false);
    }
  }, [attendees, generateCertificateImage]);

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
      
      // Ensure we have certificates to print
      if (certificates.length === 0) {
        toast({
          title: "No certificates generated",
          description: "Failed to generate certificates for printing.",
          variant: "destructive",
        });
        return;
      }
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Print failed",
          description: "Please allow pop-ups to print certificates.",
          variant: "destructive",
        });
        return;
      }

      // Create HTML content for printing
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Certificates</title>
          <style>
            * {
              box-sizing: border-box;
            }
            @page {
              size: A4 landscape;
              margin: 0;
            }
            body { 
              margin: 0; 
              padding: 0; 
              background: white;
              font-family: Arial, sans-serif;
            }
            .certificate { 
              page-break-after: always; 
              text-align: center; 
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            .certificate:last-child { page-break-after: avoid; }
            img { 
              max-width: 100%; 
              max-height: 100vh;
              height: auto;
              width: auto;
              object-fit: contain;
              display: block;
            }
            @media print {
              body { 
                padding: 0; 
                margin: 0;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              .certificate { 
                margin: 0; 
                padding: 0;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              /* Remove browser headers and footers */
              @page {
                margin: 0;
                size: A4 landscape;
              }
              /* Hide any potential browser UI elements */
              html, body {
                -webkit-appearance: none;
                appearance: none;
              }
            }
          </style>
        </head>
        <body>
          ${certificates.map((cert, index) => `
            <div class="certificate">
              <img src="${cert}" alt="Certificate for ${attendees[index]}" />
            </div>
          `).join('')}
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for images to load before printing
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
          img.onerror = checkAllImagesLoaded; // Continue even if some images fail
        }
      });
      
      // Fallback if no images or all images are already loaded
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
  }, [imageUrl, attendees, textElements, generateCertificateImage, toast]);

  const handlePreviewAdjustment = useCallback((elementId: string, attendee: string, adjustment: { x: number; y: number }) => {
    console.log('Adjustment:', { elementId, attendee, adjustment });
    setTextElements(prev => prev.map(el => 
      el.id === elementId ? {
        ...el,
        individualAdjustments: {
          ...el.individualAdjustments,
          [attendee]: adjustment
        }
      } : el
    ));
  }, []);

  const loadPreset = useCallback((properties: TextProperties) => {
    if (selectedElement) {
      Object.entries(properties).forEach(([key, value]) => {
        handleElementUpdate(key as keyof TextElement, value);
      });
    }
  }, [selectedElement, handleElementUpdate]);

  // Memoize component props
  const canvasPreviewProps = useMemo(() => ({
    imageUrl,
    textElements,
    selectedElement,
    onElementSelect: handleElementSelect,
    onElementDragStart: handleElementDragStart,
    imageDimensions,
  }), [imageUrl, textElements, selectedElement, handleElementSelect, handleElementDragStart, imageDimensions]);

  const certificatePreviewProps = useMemo(
    () => ({
      imageUrl,
      attendees,
      previewIndex,
      textElements,
      onDownload: downloadCertificate,
      onPreviewChange: setPreviewIndex,
      imageDimensions,
      onPreviewAdjustment: handlePreviewAdjustment,
    }),
    [
      imageUrl,
      attendees,
      previewIndex,
      textElements,
      downloadCertificate,
      setPreviewIndex,
      imageDimensions,
      handlePreviewAdjustment,
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
    handleTabChange,
    handleElementSelect,
    handleElementDragStart,
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
    handlePreviewAdjustment,
    loadPreset,
    autosaveStatus,
  };
}