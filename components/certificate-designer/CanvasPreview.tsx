"use client";

import { TextElement } from "@/types/types";
import Image from 'next/image';
import { CUSTOM_FONTS } from '@/lib/fonts';
import { useFontLoader } from '@/hooks/useFontLoader';

interface CanvasPreviewProps {
  imageUrl: string | null;
  textElements: TextElement[];
  selectedElement: string | null;
  onElementSelect: (id: string) => void;
  onElementDragStart: (id: string, e: React.MouseEvent) => void;
  imageDimensions: { width: number; height: number };
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export function CanvasPreview({
  imageUrl,
  textElements,
  selectedElement,
  onElementSelect,
  onElementDragStart,
  imageDimensions,
  canvasRef
}: CanvasPreviewProps) {
  useFontLoader();

  return (
    <div className="relative border rounded-md overflow-hidden bg-white"
      ref={canvasRef}
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
          transform: `scale(1)`,
          transformOrigin: 'top left',
          transition: 'transform 0.2s ease',
          position: 'absolute',
          width: '100%',
          height: '100%'
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
              fontFamily: CUSTOM_FONTS[element.fontFamily] 
                ? element.fontFamily 
                : `var(--font-${element.fontFamily.toLowerCase().replace(/ /g, '-')})`,
              color: element.color,
              padding: '4px',
              userSelect: 'none',
              backgroundColor: selectedElement === element.id ? 'rgba(0,0,0,0.05)' : 'transparent',
              zIndex: 10,
              fontWeight: element.fontWeight,
              fontStyle: element.fontStyle,
              textDecoration: element.textDecoration,
              textAlign: element.textAlign,
              lineHeight: element.lineHeight
            }}
            onClick={(e) => {
              e.stopPropagation();
              onElementSelect(element.id);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onElementDragStart(element.id, e);
            }}
          >
            {element.text}
          </div>
        ))}
      </div>
    </div>
  );
} 