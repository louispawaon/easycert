"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { TextElement } from "@/types/types";
import { useAttendees } from "@/hooks/use-attendees";
import { useCertificateImage } from "@/hooks/use-certificate";
import JSZip from "jszip";
import { getLocalStorageItem } from "@/lib/utils";
import { addEventListener, removeEventListener } from "@/lib/utils";

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
  const generateCertificateImage = useCallback(async (name: string) => {
    try {
      if (!imageUrl) throw new Error('No certificate template available');

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = imageUrl;

      await new Promise((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          ctx.drawImage(img, 0, 0);
          resolve(true);
        };
        img.onerror = (err) => {
          console.error('Image loading error:', err);
          reject(new Error('Failed to load certificate template'));
        };
      });

      const previewWidth = (500 / imageDimensions.height) * imageDimensions.width;
      const scaleX = canvas.width / previewWidth;
      const scaleY = canvas.height / 500;

      textElements.forEach((element) => {
        ctx.font = `${element.fontSize * scaleY}px ${element.fontFamily}`;
        ctx.fillStyle = element.color;
        const text = element.type === 'name' ? name : element.text;
        ctx.fillText(text, element.x * scaleX, element.y * scaleY);
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      if (!dataUrl) throw new Error('Failed to generate image data URL');

      return dataUrl;
    } catch (error) {
      console.error('Certificate generation error:', error);
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
        description: "There was an error downloading the certificate.",
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
      const zip = new JSZip();
      const total = attendees.length;
      let completed = 0;

      for (const name of attendees) {
        const imageData = await generateCertificateImage(name);
        if (imageData) {
          const base64Data = imageData.split(',')[1];
          const binaryString = atob(base64Data);
          const arrayBuffer = new ArrayBuffer(binaryString.length);
          const uint8Array = new Uint8Array(arrayBuffer);
          
          for (let i = 0; i < binaryString.length; i++) {
            uint8Array[i] = binaryString.charCodeAt(i);
          }
          
          zip.file(`certificate_${name}.png`, uint8Array, { binary: true });
        }
        completed++;
        console.log(`Generated ${completed} of ${total} certificates`);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'certificates.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Certificates generated",
        description: `Successfully generated ${total} certificates.`,
      });
    } catch {
      toast({
        title: "Error generating certificates",
        description: "There was an error generating the certificates.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [imageUrl, attendees, textElements, generateCertificateImage, toast]);

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
    imageDimensions
  }), [imageUrl, attendees, previewIndex, textElements, downloadCertificate, imageDimensions]);

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
        "John Doe\nJane Smith\nMichael Johnson\nEmily Williams\nRobert Brown"
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
    canvasPreviewProps,
    certificatePreviewProps,
    attendeesCount,
    textElementsCount,
    namePlaceholdersCount
  };
}