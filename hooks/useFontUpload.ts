"use client";

import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { addCustomFont } from '@/lib/fonts';

export function useFontUpload() {
  const { toast } = useToast();
  const [fontFile, setFontFile] = useState<File | null>(null);

  const handleFontUpload = async (): Promise<string | null> => {
    if (!fontFile) return null;

    const fontName = fontFile.name.replace(/\.[^/.]+$/, "");

    try {
      const base64Url = await convertFileToBase64(fontFile);

      addCustomFont(fontName, base64Url);
      setFontFile(null);

      toast({
        title: "Font added",
        description: `${fontName} is in your font list and applied to this text element.`,
      });
      return fontName;
    } catch (error) {
      console.error("Error uploading font:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading the font. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Helper function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  };

  return {
    fontFile,
    setFontFile,
    handleFontUpload
  };
} 