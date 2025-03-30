"use client";

import { TextElement } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Image from 'next/image';
import { useFontLoader } from '@/hooks/useFontLoader';
import { CUSTOM_FONTS } from '@/lib/fonts';

interface CertificatePreviewProps {
  imageUrl: string | null;
  attendees: string[];
  previewIndex: number;
  textElements: TextElement[];
  onDownload: () => void;
  onPreviewChange: (index: number) => void;
  imageDimensions: { width: number; height: number };
  onPreviewAdjustment: (id: string, name: string, adjustment: { x: number; y: number }) => void;
}

export function CertificatePreview({
  imageUrl,
  attendees,
  previewIndex,
  textElements,
  onDownload,
  onPreviewChange,
  imageDimensions,
  onPreviewAdjustment
}: CertificatePreviewProps) {
  useFontLoader();

  return (
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
              onClick={() => onPreviewChange(Math.max(0, previewIndex - 1))}
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
              onClick={() => onPreviewChange(Math.min(attendees.length - 1, previewIndex + 1))}
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
          <Image 
            src={imageUrl} 
            alt="Certificate Template" 
            fill
            className="object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground">
              Upload a certificate template to preview
            </p>
          </div>
        )}
        
        {attendees.length > 0 && textElements.map((element) => {
          const adjustment = element.individualAdjustments?.[attendees[previewIndex]] || { x: 0, y: 0 };
          return (
            <div
              id={element.id}
              key={element.id}
              className="absolute cursor-move"
              style={{
                left: `${element.x + adjustment.x}px`,
                top: `${element.y + adjustment.y}px`,
                fontSize: `${element.fontSize}px`,
                fontFamily: CUSTOM_FONTS[element.fontFamily] 
                  ? element.fontFamily 
                  : `var(--font-${element.fontFamily.toLowerCase().replace(/ /g, '-')})`,
                color: element.color,
                padding: '4px',
                userSelect: 'none',
                zIndex: 10,
                fontWeight: element.fontWeight,
                fontStyle: element.fontStyle,
                textDecoration: element.textDecoration,
                textAlign: element.textAlign,
                lineHeight: element.lineHeight
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
                if (!parentRect) return;

                const startX = e.clientX;
                const startY = e.clientY;
                const startElementX = element.x + adjustment.x;
                const startElementY = element.y + adjustment.y;

                const handleMouseMove = (e: MouseEvent) => {
                  const target = document.getElementById(element.id) as HTMLElement;
                  if (!target) return;
                  
                  // Calculate position relative to parent container
                  const dx = e.clientX - startX;
                  const dy = e.clientY - startY;
                  
                  // Update the element's position in real-time
                  target.style.left = `${startElementX + dx}px`;
                  target.style.top = `${startElementY + dy}px`;
                };

                const handleMouseUp = (e: MouseEvent) => {
                  const dx = e.clientX - startX;
                  const dy = e.clientY - startY;
                  
                  // Save the final adjustment
                  onPreviewAdjustment(element.id, attendees[previewIndex], {
                    x: dx,
                    y: dy
                  });

                  // Clean up event listeners
                  window.removeEventListener('mousemove', handleMouseMove);
                  window.removeEventListener('mouseup', handleMouseUp);
                };

                window.addEventListener('mousemove', handleMouseMove);
                window.addEventListener('mouseup', handleMouseUp);
              }}
            >
              {element.type === 'name' ? attendees[previewIndex] : element.text}
            </div>
          );
        })}
      </div>
      
      {attendees.length > 0 && textElements.some(el => el.type === 'name') && (
        <div className="mt-4 flex justify-end">
          <Button onClick={onDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download This Certificate
          </Button>
        </div>
      )}
    </div>
  );
}