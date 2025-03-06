"use client";

import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCertificateDesigner } from "@/hooks/use-certificateDesigner";
import { CanvasPreview } from "@/components/certificate-designer/CanvasPreview";
import { TextElementEditor } from "@/components/certificate-designer/TextElementEditor";
import { CertificateControls } from "@/components/certificate-designer/CertificateControls";
import { CertificatePreview } from "@/components/certificate-designer/CertificatePreview";
import { CertificateGenerator } from "@/components/certificate-designer/CertificateGenerator";

export function CertificateDesigner() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    imageUrl,
    textElements,
    selectedElement,
    isGenerating,
    activeTab,
    handleTabChange,
    handleElementUpdate,
    handleElementRemove,
    handleAddTextElement,
    canvasPreviewProps,
    certificatePreviewProps,
    attendeesCount,
    textElementsCount,
    namePlaceholdersCount,
    generateCertificates,
    generateCertificatesPDF
  } = useCertificateDesigner();

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
                    {...canvasPreviewProps}
                    canvasRef={canvasRef}
                  />
                </div>
              </div>
              
              <div className="md:w-1/4 space-y-4">
                <CertificateControls onAddTextElement={handleAddTextElement} />
                
                {selectedElement && (
                  <TextElementEditor
                    element={textElements.find(el => el.id === selectedElement)!}
                    onUpdate={handleElementUpdate}
                    onRemove={handleElementRemove}
                  />
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <CertificatePreview
              {...certificatePreviewProps}
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
                  attendeesCount={attendeesCount}
                  textElementsCount={textElementsCount}
                  namePlaceholdersCount={namePlaceholdersCount}
                  isGenerating={isGenerating}
                  onGenerate={generateCertificates}
                  onGeneratePDF={generateCertificatesPDF}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}