"use client";

import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { addCustomFont } from '@/lib/fonts';

export function useFontUpload() {
  const { toast } = useToast();
  const [fontFile, setFontFile] = useState<File | null>(null);

  const handleFontUpload = async () => {
    if (!fontFile) return;
    
    // Extract font name from file name (remove extension)
    const fontName = fontFile.name.replace(/\.[^/.]+$/, "");
    const fontUrl = URL.createObjectURL(fontFile);
    addCustomFont(fontName, fontUrl);
    setFontFile(null);
    
    toast({
      title: "Font Uploaded",
      description: `${fontName} has been successfully added to your font list.`,
    });
  };

  return {
    fontFile,
    setFontFile,
    handleFontUpload
  };
} 