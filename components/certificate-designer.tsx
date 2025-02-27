"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Download, Plus, Trash2, Move, Type, Palette, Save } from "lucide-react";
import JSZip from "jszip";

type TextElement = {
  id: string;
  type: 'name' | 'static';
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  isDragging: boolean;
};

export function CertificateDesigner() {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasScale] = useState(1);
  const [activeTab, setActiveTab] = useState("design");
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Load saved image URL and attendees from localStorage on component mount
  useEffect(() => {
    // Check for saved certificate image
    const savedImageUrl = localStorage.getItem('certificateImageUrl');
    if (savedImageUrl) {
      setImageUrl(savedImageUrl);
    }
    
    // Check for saved attendee list
    const savedAttendeeList = localStorage.getItem('attendeeList');
    if (savedAttendeeList) {
      const names = savedAttendeeList.split('\n').filter(line => line.trim());
      setAttendees(names);
    } else {
      // Load sample data for demo purposes
      const sampleAttendees = [
        "John Doe",
        "Jane Smith",
        "Michael Johnson",
        "Emily Williams",
        "Robert Brown"
      ];
      setAttendees(sampleAttendees);
    }
    
    // Listen for certificate image upload events
    const handleImageUpload = (event: CustomEvent) => {
      setImageUrl(event.detail.imageUrl);
    };
    
    // Listen for certificate image clear events
    const handleImageClear = () => {
      setImageUrl(null);
    };
    
    // Listen for attendee list upload/update events
    const handleAttendeeUpdate = (event: CustomEvent) => {
      setAttendees(event.detail.attendees);
    };
    
    // Listen for attendee list clear events
    const handleAttendeeClear = () => {
      setAttendees([]);
    };
    
    // Add event listeners
    window.addEventListener('certificate-image-uploaded', handleImageUpload as EventListener);
    window.addEventListener('certificate-image-cleared', handleImageClear);
    window.addEventListener('attendee-list-uploaded', handleAttendeeUpdate as EventListener);
    window.addEventListener('attendee-list-updated', handleAttendeeUpdate as EventListener);
    window.addEventListener('attendee-list-cleared', handleAttendeeClear);
    
    // Clean up event listeners on component unmount
    return () => {
      window.removeEventListener('certificate-image-uploaded', handleImageUpload as EventListener);
      window.removeEventListener('certificate-image-cleared', handleImageClear);
      window.removeEventListener('attendee-list-uploaded', handleAttendeeUpdate as EventListener);
      window.removeEventListener('attendee-list-updated', handleAttendeeUpdate as EventListener);
      window.removeEventListener('attendee-list-cleared', handleAttendeeClear);
    };
  }, []);

  // Add this function to generate the certificate image
  const generateCertificateImage = async (name: string) => {
    if (!canvasRef.current || !imageUrl) return null;

    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Load the certificate template image
    const img = new Image();
    img.src = imageUrl;
    await new Promise((resolve) => (img.onload = resolve));

    // Set canvas dimensions
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the certificate template
    ctx.drawImage(img, 0, 0);

    // Add text elements
    textElements.forEach((element) => {
      ctx.font = `${element.fontSize}px ${element.fontFamily}`;
      ctx.fillStyle = element.color;
      const text = element.type === 'name' ? name : element.text;
      ctx.fillText(text, element.x, element.y);
    });

    // Convert canvas to data URL
    return canvas.toDataURL('image/png');
  };

  // Modify the downloadCertificate function
  const downloadCertificate = async () => {
    if (!attendees[previewIndex]) return;

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
  };

  // Modify the generateCertificates function
  const generateCertificates = async () => {
    if (!imageUrl) {
      toast({
        title: "No certificate template",
        description: "Please upload a certificate template first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const zip = new JSZip();
      
      // Generate all certificates
      for (const name of attendees) {
        const imageData = await generateCertificateImage(name);
        if (!imageData) continue;
        
        // Convert data URL to binary string
        const base64Data = imageData.split(',')[1];
        const binaryString = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(binaryString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < binaryString.length; i++) {
          uint8Array[i] = binaryString.charCodeAt(i);
        }
        
        // Add file to ZIP
        zip.file(`certificate_${name}.png`, uint8Array, { binary: true });
      }

      // Generate and download the ZIP file
      const content = await zip.generateAsync({ type: 'blob' });
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

  const removeTextElement = (id: string) => {
    setTextElements(textElements.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  const handleElementDragStart = (id: string, e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Find the element
    const element = textElements.find(el => el.id === id);
    if (!element) return;
    
    // Mark as dragging
    setTextElements(
      textElements.map(el => 
        el.id === id ? { ...el, isDragging: true } : el
      )
    );
    
    // Get initial positions
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = element.x;
    const initialY = element.y;
    
    // Create mouse move handler
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;
      
      // Calculate the delta, accounting for scale
      const dx = (moveEvent.clientX - startX) / canvasScale;
      const dy = (moveEvent.clientY - startY) / canvasScale;
      
      // Update the element position
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
    
    // Create mouse up handler
    const handleMouseUp = () => {
      setTextElements(prevElements => 
        prevElements.map(el => 
          el.id === id ? { ...el, isDragging: false } : el
        )
      );
      
      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const updateElementProperty = (id: string, property: keyof TextElement, value: string | number) => {
    setTextElements(
      textElements.map(el => 
        el.id === id ? { ...el, [property]: value } : el
      )
    );
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // If switching to preview tab, enable preview mode
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
                  
                  <div 
                    ref={canvasRef}
                    className="relative border rounded-md overflow-hidden bg-white"
                    style={{ 
                      height: '500px',
                      width: `${(500 / imageDimensions.height) * imageDimensions.width}px`,
                      margin: '0 auto',
                      overflow: 'auto',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{ 
                        transform: `scale(${canvasScale})`,
                        transformOrigin: 'top left',
                        transition: 'transform 0.2s ease',
                        position: 'absolute',
                        width: '100%',
                        height: '100%'
                      }}
                    >
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt="Certificate Template" 
                          className="absolute top-0 left-0 w-full h-full object-contain"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-muted-foreground">
                            Upload a certificate template to get started
                          </p>
                        </div>
                      )}
                      
                      {textElements.map((element) => (
                        <div
                          key={element.id}
                          className={`absolute cursor-move ${
                            selectedElement === element.id ? 'ring-2 ring-primary' : ''
                          } ${element.isDragging ? 'opacity-70' : ''}`}
                          style={{
                            left: `${element.x}px`,
                            top: `${element.y}px`,
                            fontSize: `${element.fontSize}px`,
                            fontFamily: element.fontFamily,
                            color: element.color,
                            padding: '4px',
                            userSelect: 'none',
                            backgroundColor: selectedElement === element.id ? 'rgba(0,0,0,0.05)' : 'transparent',
                            zIndex: 10, // Ensure text is above the image
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedElement(element.id);
                          }}
                          onMouseDown={(e) => handleElementDragStart(element.id, e)}
                        >
                          {element.text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:w-1/4 space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-4">Add Elements</h3>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => addTextElement('name')} 
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Name Placeholder
                    </Button>
                    <Button 
                      onClick={() => addTextElement('static')} 
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Static Text
                    </Button>
                  </div>
                </div>
                
                {selectedElement && (
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Element Properties</h3>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => removeTextElement(selectedElement)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {textElements.find(el => el.id === selectedElement)?.type === 'static' && (
                      <div className="space-y-2 mb-4">
                        <Label htmlFor="text-content">Text Content</Label>
                        <Input
                          id="text-content"
                          value={textElements.find(el => el.id === selectedElement)?.text || ''}
                          onChange={(e) => updateElementProperty(selectedElement, 'text', e.target.value)}
                        />
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Type className="h-4 w-4" />
                          Font Settings
                        </Label>
                        <Select
                          value={textElements.find(el => el.id === selectedElement)?.fontFamily}
                          onValueChange={(value) => updateElementProperty(selectedElement, 'fontFamily', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select font" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Courier New">Courier New</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                            <SelectItem value="Verdana">Verdana</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="font-size">Font Size</Label>
                            <span className="text-sm text-muted-foreground">
                              {textElements.find(el => el.id === selectedElement)?.fontSize}px
                            </span>
                          </div>
                          <Slider
                            id="font-size"
                            min={10}
                            max={72}
                            step={1}
                            value={[textElements.find(el => el.id === selectedElement)?.fontSize || 24]}
                            onValueChange={(value) => updateElementProperty(selectedElement, 'fontSize', value[0])}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="text-color" className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Text Color
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="text-color"
                            type="color"
                            value={textElements.find(el => el.id === selectedElement)?.color || '#000000'}
                            onChange={(e) => updateElementProperty(selectedElement, 'color', e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={textElements.find(el => el.id === selectedElement)?.color || '#000000'}
                            onChange={(e) => updateElementProperty(selectedElement, 'color', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Move className="h-4 w-4" />
                          Position
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor="pos-x" className="text-xs">X Position</Label>
                            <Input
                              id="pos-x"
                              type="number"
                              value={textElements.find(el => el.id === selectedElement)?.x || 0}
                              onChange={(e) => updateElementProperty(selectedElement, 'x', Number(e.target.value))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="pos-y" className="text-xs">Y Position</Label>
                            <Input
                              id="pos-y"
                              type="number"
                              value={textElements.find(el => el.id === selectedElement)?.y || 0}
                              onChange={(e) => updateElementProperty(selectedElement, 'y', Number(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <div className="border rounded-md p-4 bg-muted/20">
              <div className="flex justify-between items-center mb-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">Certificate Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    Preview how your certificates will look with actual names
                  </p>
                </div>
                {attendees.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                      disabled={previewIndex === 0}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      {previewIndex + 1} of {attendees.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewIndex(Math.min(attendees.length - 1, previewIndex + 1))}
                      disabled={previewIndex === attendees.length - 1}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="relative border rounded-md overflow-hidden bg-white mx-auto" 
                style={{ 
                  height: '500px',
                  width: `${(500 / imageDimensions.height) * imageDimensions.width}px`
                }}
              >
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt="Certificate Template" 
                    className="absolute top-0 left-0 w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Upload a certificate template to preview
                    </p>
                  </div>
                )}
                
                {attendees.length > 0 && textElements.map((element) => (
                  <div
                    key={element.id}
                    className="absolute"
                    style={{
                      left: `${element.x}px`,
                      top: `${element.y}px`,
                      fontSize: `${element.fontSize}px`,
                      fontFamily: element.fontFamily,
                      color: element.color,
                      padding: '4px',
                      userSelect: 'none',
                      zIndex: 10, // Ensure text is above the image
                    }}
                  >
                    {element.type === 'name' ? attendees[previewIndex] : element.text}
                  </div>
                ))}
              </div>
              
              {attendees.length > 0 && textElements.some(el => el.type === 'name') && (
                <div className="mt-4 flex justify-end">
                  <Button onClick={downloadCertificate}>
                    <Download className="mr-2 h-4 w-4" />
                    Download This Certificate
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="generate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generate Certificates</CardTitle>
                <CardDescription>
                  Generate certificates for all attendees in your list
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Certificate Template</Label>
                    <span className="text-sm text-muted-foreground">
                      {imageUrl ? "Template uploaded" : "No template"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label>Attendee List</Label>
                    <span className="text-sm text-muted-foreground">
                      {attendees.length} attendees
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label>Text Elements</Label>
                    <span className="text-sm text-muted-foreground">
                      {textElements.length} elements ({textElements.filter(el => el.type === 'name').length} name placeholders)
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="filename">Output Filename</Label>
                      <p className="text-sm text-muted-foreground">
                        The name will be appended with the attendee name
                      </p>
                    </div>
                    <Input
                      id="filename"
                      defaultValue="Certificate"
                      className="w-[200px]"
                    />
                  </div>
                </div>
                
                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="zip-files" />
                    <Label htmlFor="zip-files">Package certificates as ZIP file</Label>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">
                  <Save className="mr-2 h-4 w-4" />
                  Save Project
                </Button>
                <Button 
                  onClick={generateCertificates}
                  disabled={isGenerating || !imageUrl || attendees.length === 0 || !textElements.some(el => el.type === 'name')}
                >
                  {isGenerating ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generate All Certificates
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}