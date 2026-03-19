import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { TextElement } from "@/types/types"
import JSZip from "jszip"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function addEventListener(event: string, handler: EventListener): void {
  window.addEventListener(event, handler);
}

export function removeEventListener(event: string, handler: EventListener): void {
  window.removeEventListener(event, handler);
}

export function dispatchEvent(event: CustomEvent): void {
  window.dispatchEvent(event);
}

export function getLocalStorageItem(key: string): string | null {
  return localStorage.getItem(key);
}

export function setLocalStorageItem(key: string, value: string): void {
  localStorage.setItem(key, value);
}

export function removeLocalStorageItem(key: string): void {
  localStorage.removeItem(key);
}

export async function generateCertificateImage(
  imageUrl: string,
  textElements: TextElement[],
  imageDimensions: { width: number; height: number },
  name: string
): Promise<string | null> {
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

    // Helper function to wrap and draw text - moved after ctx check
    const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
      const words = text.split(' ');
      let line = '';
      let testLine = '';
      const lines: string[] = [];
      
      // First pass: determine line breaks
      for (let n = 0; n < words.length; n++) {
        testLine = line + words[n] + ' ';
        const metrics = ctx!.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      // Second pass: draw the lines
      let totalHeight = 0;
      lines.forEach((line, i) => {
        ctx!.fillText(line.trim(), x, y + (i * lineHeight));
        totalHeight = (i + 1) * lineHeight;
      });

      return totalHeight;
    };

    textElements.forEach((element) => {
      const adjustment = element.individualAdjustments?.[name] || { x: 0, y: 0 };
      
      const adjustedX = element.x * scaleX + adjustment.x * scaleX;
      const adjustedY = element.y * scaleY + adjustment.y * scaleY;
      
      const fontSize = element.fontSize * scaleY;
      ctx.font = `${element.fontStyle} ${element.fontWeight} ${fontSize}px ${element.fontFamily}`;
      ctx.fillStyle = element.color;
      ctx.textAlign = element.textAlign || 'left';
      
      const paddingOffset = 4 * scaleY;
      const baselineOffset = fontSize;
      const lineHeight = fontSize * (element.lineHeight || 1.2);
      
      // Calculate max width based on canvas size and position
      const maxWidth = canvas.width - adjustedX;
      
      // For name placeholders, only draw if we have a valid name
      if (element.type === 'name') {
        if (name && name.trim()) {
          wrapText(
            name,
            adjustedX,
            adjustedY + baselineOffset + paddingOffset,
            maxWidth,
            lineHeight
          );
        }
      } else {
        // For regular text elements, always render them
        wrapText(
          element.text,
          adjustedX,
          adjustedY + baselineOffset + paddingOffset,
          maxWidth,
          lineHeight
        );
      }
    });

    const dataUrl = canvas.toDataURL('image/png', 0.8);
    if (!dataUrl) throw new Error('Failed to generate image data URL');

    return dataUrl;
  } catch (error) {
    console.error('Certificate generation error:', error);
    throw error;
  }
}

export async function generateCertificates(
  imageUrl: string,
  attendees: string[],
  textElements: TextElement[],
  imageDimensions: { width: number; height: number }
): Promise<Blob> {
  if (!imageUrl || attendees.length === 0 || !textElements.some(el => el.type === 'name')) {
    throw new Error("Missing requirements: template, attendees, and name placeholder");
  }

  const certificates: string[] = [];
  for (const attendee of attendees) {
    const cert = await generateCertificateImage(imageUrl, textElements, imageDimensions, attendee);
    if (cert) certificates.push(cert);
  }

  const zip = new JSZip();
  let completed = 0;

  for (const cert of certificates) {
    const base64Data = cert.split(',')[1];
    const binaryString = atob(base64Data);
    const arrayBuffer = new ArrayBuffer(binaryString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    
    zip.file(`certificate_${attendees[completed]}.png`, uint8Array, { 
      binary: true,
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });
    completed++;
  }

  return await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  });
}
