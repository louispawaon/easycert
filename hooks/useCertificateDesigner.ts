"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { TextElement } from "@/types/types";
import { useAttendees } from "@/hooks/useAttendees";
import { useCertificateImage } from "@/hooks/useCertificate";
import { getLocalStorageItem } from "@/lib/utils";
import { addEventListener, removeEventListener } from "@/lib/utils";
import { generatePDF } from "@/lib/utils";
import { generateCertificateImage as generateCertificateImageUtil } from "@/lib/utils";
import { generateCertificates as generateCertificatesUtil } from "@/lib/utils";

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
  const { imageUrl, setImageUrl } = useCertificateImage();
  const { attendees, setAttendees } = useAttendees();
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("design");
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Memoize expensive calculations
  const attendeesCount = useMemo(() => attendees.length, [attendees]);
  const textElementsCount = useMemo(() => textElements.length, [textElements]);
  const namePlaceholdersCount = useMemo(
    () => textElements.filter(el => el.type === 'name').length,
    [textElements]
  );

  // Event handlers
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    if (value === "preview" && textElements.some(el => el.type === 'name') && attendees.length > 0) {
      setPreviewIndex(0);
    }
  }, [textElements, attendees]);

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

  const certificatePreviewProps = useMemo(() => ({
    imageUrl,
    attendees,
    previewIndex,
    textElements,
    onDownload: downloadCertificate,
    onPreviewChange: setPreviewIndex,
    imageDimensions,
    onPreviewAdjustment: handlePreviewAdjustment
  }), [imageUrl, attendees, previewIndex, textElements, downloadCertificate, imageDimensions, handlePreviewAdjustment]);

  // Load saved data and set up event listeners
  useEffect(() => {
    const savedImageUrl = getLocalStorageItem('certificateImageUrl');
    const savedAttendeeList = getLocalStorageItem('attendeeList');

    if (savedImageUrl) setImageUrl(savedImageUrl);
    if (savedAttendeeList) {
      const names = savedAttendeeList.split('\n').filter(line => line.trim());
      setAttendees(names);
    } else {
      setAttendees([
        "John Doe",
        "Jane Smith",
        "Michael Johnson",
        "Emily Williams",
        "Robert Brown"
      ]);
    }

    const handleImageUpload = (event: CustomEvent) => setImageUrl(event.detail.imageUrl);
    const handleImageClear = () => setImageUrl(null);
    const handleAttendeeUpdate = (event: CustomEvent) => setAttendees(event.detail.attendees);
    const handleAttendeeClear = () => setAttendees([]);

    addEventListener('certificate-image-uploaded', handleImageUpload as EventListener);
    addEventListener('certificate-image-cleared', handleImageClear);
    addEventListener('attendee-list-uploaded', handleAttendeeUpdate as EventListener);
    addEventListener('attendee-list-updated', handleAttendeeUpdate as EventListener);
    addEventListener('attendee-list-cleared', handleAttendeeClear);

    return () => {
      removeEventListener('certificate-image-uploaded', handleImageUpload as EventListener);
      removeEventListener('certificate-image-cleared', handleImageClear);
      removeEventListener('attendee-list-uploaded', handleAttendeeUpdate as EventListener);
      removeEventListener('attendee-list-updated', handleAttendeeUpdate as EventListener);
      removeEventListener('attendee-list-cleared', handleAttendeeClear);
    };
  }, [setAttendees, setImageUrl]);

  // Update image dimensions
  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
    }
  }, [imageUrl]);

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
    canvasPreviewProps,
    certificatePreviewProps,
    attendeesCount,
    textElementsCount,
    namePlaceholdersCount,
    handlePreviewAdjustment,
    loadPreset,
  };
}