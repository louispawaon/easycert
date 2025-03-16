import { useState } from "react";
import { useToast } from "@/hooks/useToast";

export function useFileUpload() {
  const { toast } = useToast();
  const [attendeeList, setAttendeeList] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Set uploading state immediately
      setIsUploading(true);
      
      if (!file.type.startsWith("image/")) {
        setIsUploading(false); // Reset if invalid
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
        setIsUploading(false);
        
        localStorage.setItem('certificateImageUrl', imageUrl);
        
        const uploadEvent = new CustomEvent('certificate-image-uploaded', { 
          detail: { imageUrl } 
        });
        window.dispatchEvent(uploadEvent);
      };
      
      reader.onerror = () => {
        setIsUploading(false);
        toast({
          title: "Upload failed",
          description: "There was an error processing your image.",
          variant: "destructive",
        });
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

  return {
    attendeeList,
    imagePreview,
    isUploading,
    handleCertificateUpload,
    handleAttendeeFileUpload,
    handleClearCertificate,
    handleClearAttendees,
    handleManualAttendeeChange
  };
}