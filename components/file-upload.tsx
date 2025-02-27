"use client";

import { useState } from "react";
import { Upload, FileType, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function FileUpload() {
  const { toast } = useToast();
  const [attendeeList, setAttendeeList] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file for the certificate template.",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setImagePreview(imageUrl);
        
        // Store the image URL in localStorage to share with the certificate designer
        localStorage.setItem('certificateImageUrl', imageUrl);
        
        // Dispatch a custom event to notify the certificate designer
        const uploadEvent = new CustomEvent('certificate-image-uploaded', { 
          detail: { imageUrl } 
        });
        window.dispatchEvent(uploadEvent);
      };
      reader.readAsDataURL(file);
      
      toast({
        title: "Certificate template uploaded",
        description: "Your certificate template has been uploaded successfully.",
      });
    }
  };

  const handleAttendeeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          setAttendeeList(content);
          
          // Try to parse as JSON if it's a JSON file
          if (file.name.endsWith('.json')) {
            const jsonData = JSON.parse(content);
            if (Array.isArray(jsonData)) {
              setAttendeeList(jsonData.join('\n'));
            } else if (typeof jsonData === 'object') {
              // Extract names from JSON object
              const names = Object.values(jsonData).filter(value => typeof value === 'string');
              setAttendeeList(names.join('\n'));
            }
          }
          
          // Store the attendee list in localStorage
          localStorage.setItem('attendeeList', content);
          
          // Dispatch a custom event to notify other components
          const names = content.split('\n').filter(line => line.trim());
          const uploadEvent = new CustomEvent('attendee-list-uploaded', { 
            detail: { attendees: names } 
          });
          window.dispatchEvent(uploadEvent);
          
          toast({
            title: "Attendee list uploaded",
            description: "Your attendee list has been uploaded successfully.",
          });
        } catch {
          toast({
            title: "Error parsing file",
            description: "There was an error parsing the attendee file.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearCertificate = () => {
    setImagePreview(null);
    localStorage.removeItem('certificateImageUrl');
    
    // Notify certificate designer that image was cleared
    const clearEvent = new CustomEvent('certificate-image-cleared');
    window.dispatchEvent(clearEvent);
  };

  const handleClearAttendees = () => {
    setAttendeeList("");
    localStorage.removeItem('attendeeList');
    
    // Notify other components that attendee list was cleared
    const clearEvent = new CustomEvent('attendee-list-cleared');
    window.dispatchEvent(clearEvent);
  };

  const handleManualAttendeeChange = (value: string) => {
    setAttendeeList(value);
    
    // Store the attendee list in localStorage
    localStorage.setItem('attendeeList', value);
    
    // Dispatch a custom event to notify other components
    const names = value.split('\n').filter(line => line.trim());
    const updateEvent = new CustomEvent('attendee-list-updated', { 
      detail: { attendees: names } 
    });
    window.dispatchEvent(updateEvent);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Files</CardTitle>
        <CardDescription>
          Upload your certificate template and attendee list to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certificate">Certificate Template</Label>
              {imagePreview ? (
                <div className="relative rounded-md overflow-hidden border">
                  <img 
                    src={imagePreview} 
                    alt="Certificate Preview" 
                    className="w-full h-auto object-contain max-h-[300px]" 
                  />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={handleClearCertificate}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Drag and drop or click to upload
                  </p>
                  <Input
                    id="certificate"
                    type="file"
                    accept="image/*"
                    className="mt-4"
                    onChange={handleCertificateUpload}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Attendee List</Label>
              <Tabs defaultValue="upload">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload File</TabsTrigger>
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="space-y-4">
                  <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <FileType className="h-6 w-6 text-primary" />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Upload a .txt or .json file with attendee names
                    </p>
                    <Input
                      id="attendees"
                      type="file"
                      accept=".txt,.json"
                      className="mt-4"
                      onChange={handleAttendeeFileUpload}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="manual" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="manual-attendees">Enter attendee names (one per line)</Label>
                    <textarea
                      id="manual-attendees"
                      className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="John Doe&#10;Jane Smith&#10;Alex Johnson"
                      value={attendeeList}
                      onChange={(e) => handleManualAttendeeChange(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              {attendeeList && (
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {attendeeList.split('\n').filter(line => line.trim()).length} attendees loaded
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearAttendees}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}