"use client";

import { useState, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useToast } from "@/hooks/useToast";
import { easyCertDb } from "@/lib/db/easycert-db";
import {
  saveCertificateImage,
  saveAttendeeListText,
} from "@/lib/db/app-state";
import {
  notifyCertificateImageCleared,
  notifyCertificateImageUploaded,
} from "@/store/certificate-image-bridge";

export function useFileUpload() {
  const { toast } = useToast();
  const row = useLiveQuery(() => easyCertDb.appState.get("default"));
  const [attendeeList, setAttendeeList] = useState("");
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const syncedAttendeesFromDb = useRef(false);

  useEffect(() => {
    if (row === undefined || syncedAttendeesFromDb.current) return;
    syncedAttendeesFromDb.current = true;
    setAttendeeList(row.attendeeListText ?? "");
  }, [row]);

  const imagePreview = localImagePreview ?? row?.certificateImageUrl ?? null;

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);

      if (!file.type.startsWith("image/")) {
        setIsUploading(false);
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
        setLocalImagePreview(imageUrl);
        setIsUploading(false);
        notifyCertificateImageUploaded(imageUrl);
        void saveCertificateImage(imageUrl);
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
          let listText = content;

          if (file.name.endsWith(".json")) {
            const jsonData = JSON.parse(content) as unknown;
            if (Array.isArray(jsonData)) {
              listText = jsonData.join("\n");
            } else if (typeof jsonData === "object" && jsonData !== null) {
              const names = Object.values(jsonData).filter(
                (value): value is string => typeof value === "string"
              );
              listText = names.join("\n");
            }
          }

          setAttendeeList(listText);
          void saveAttendeeListText(listText);

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
    setLocalImagePreview(null);
    notifyCertificateImageCleared();
    void saveCertificateImage(null);
  };

  const handleClearAttendees = () => {
    setAttendeeList("");
    void saveAttendeeListText("");
  };

  const handleManualAttendeeChange = (value: string) => {
    setAttendeeList(value);
    void saveAttendeeListText(value);
  };

  return {
    attendeeList,
    imagePreview,
    isUploading,
    handleCertificateUpload,
    handleAttendeeFileUpload,
    handleClearCertificate,
    handleClearAttendees,
    handleManualAttendeeChange,
  };
}
