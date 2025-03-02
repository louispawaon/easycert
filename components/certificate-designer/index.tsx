"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TextElement } from "@/types/types";
import { useAttendees } from "@/hooks/use-attendees";
import { useCertificateImage } from "@/hooks/use-certificate";
import JSZip from "jszip";
import { getLocalStorageItem } from "@/lib/utils";
import { addEventListener, removeEventListener } from "@/lib/utils";
import { CanvasPreview } from "./CanvasPreview";
import { TextElementEditor } from "./TextElementEditor";
import { CertificateControls } from "./CertificateControls";
import { CertificatePreview } from "./CertificatePreview";
import { CertificateGenerator } from "./CertificateGenerator";

export function CertificateDesigner() {
  const { toast } = useToast();
  const { imageUrl, setImageUrl } = useCertificateImage();
  const { attendees, setAttendees } = useAttendees();
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasScale] = useState(1);
  const [activeTab, setActiveTab] = useState("design");
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

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

  // Generate certificate image
  const generateCertificateImage = async (name: string) => {
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
  };

  // Download single certificate
  const downloadCertificate = async () => {
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
  };

  // Generate all certificates
  const generateCertificates = async () => {
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
  };

  // Add text element
  const addTextElement = (type: 'name' | 'static') => {
    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      type,
      text: type === 'name' ? '[Attendee Name]' : 'Static Text',
      x: 50,
      y: 50,
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#000000',
      isDragging: false,
    };
    
    setTextElements([...textElements, newElement]);
    setSelectedElement(newElement.id);
    
    toast({
      title: `${type === 'name' ? 'Name placeholder' : 'Static text'} added`,
      description: "You can drag it to position on the certificate.",
    });
  };

  // Remove text element
  const removeTextElement = (id: string) => {
    setTextElements(textElements.filter(el => el.id !== id));
    if (selectedElement === id) setSelectedElement(null);
  };

  // Handle element drag start
  const handleElementDragStart = (id: string, e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const element = textElements.find(el => el.id === id);
    if (!element) return;
    
    setTextElements(textElements.map(el => 
      el.id === id ? { ...el, isDragging: true } : el
    ));
    
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = element.x;
    const initialY = element.y;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;
      
      const dx = (moveEvent.clientX - startX) / canvasScale;
      const dy = (moveEvent.clientY - startY) / canvasScale;
      
      setTextElements(prevElements => 
        prevElements.map(el => 
          el.id === id 
            ? { 
                ...el, 
                x: Math.max(0, Math.min(canvasRect.width / canvasScale - 20, initialX + dx)),
                y: Math.max(0, Math.min(canvasRect.height / canvasScale - 20, initialY + dy))
              } 
            : el
        )
      );
    };
    
    const handleMouseUp = () => {
      setTextElements(prevElements => 
        prevElements.map(el => 
          el.id === id ? { ...el, isDragging: false } : el
        )
      );
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Update element property
  const updateElementProperty = (id: string, property: keyof TextElement, value: string | number) => {
    setTextElements(textElements.map(el => 
      el.id === id ? { ...el, [property]: value } : el
    ));
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "preview" && textElements.some(el => el.type === 'name') && attendees.length > 0) {
      setPreviewIndex(0);
    }
  };

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

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Certificate Designer</CardTitle>
        <CardDescription>
          Design your certificate by adding and positioning text elements.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="design" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="generate">Generate</TabsTrigger>
          </TabsList>
          
          <TabsContent value="design" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-3/4 space-y-4">
                <div className="border rounded-md p-4 bg-muted/20">
                  <div className="flex justify-between items-center mb-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium">Certificate Canvas</h3>
                      <p className="text-sm text-muted-foreground">
                        Drag elements to position them on your certificate
                      </p>
                    </div>
                  </div>
                  
                  <CanvasPreview
                    imageUrl={imageUrl}
                    textElements={textElements}
                    selectedElement={selectedElement}
                    onElementSelect={setSelectedElement}
                    onElementDragStart={(id, e) => handleElementDragStart(id, e)}
                    imageDimensions={imageDimensions}
                    canvasRef={canvasRef}
                  />
                </div>
              </div>
              
              <div className="md:w-1/4 space-y-4">
                <CertificateControls onAddTextElement={addTextElement} />
                
                {selectedElement && (
                  <TextElementEditor
                  element={textElements.find(el => el.id === selectedElement)!}
                  onUpdate={(property, value) => updateElementProperty(selectedElement!, property, value)}
                  onRemove={() => removeTextElement(selectedElement)}
                />
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <CertificatePreview
              imageUrl={imageUrl}
              attendees={attendees}
              previewIndex={previewIndex}
              textElements={textElements}
              onDownload={downloadCertificate}
              onPreviewChange={setPreviewIndex}
              imageDimensions={imageDimensions}
            />
          </TabsContent>
          
          <TabsContent value="generate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generate Certificates</CardTitle>
                <CardDescription>
                  Generate certificates for all attendees in your list
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CertificateGenerator
                  imageUrl={imageUrl}
                  attendeesCount={attendees.length}
                  textElementsCount={textElements.length}
                  namePlaceholdersCount={textElements.filter(el => el.type === 'name').length}
                  isGenerating={isGenerating}
                  onGenerate={generateCertificates}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}