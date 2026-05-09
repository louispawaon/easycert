"use client";

import { useEffect, useRef, useState } from "react";
import { TextElement } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { PreviewZoomControls } from "@/components/certificate-designer/PreviewZoomControls";
import { useFontLoader } from "@/hooks/useFontLoader";
import { useCertificateTemplateImage } from "@/hooks/useCertificateTemplateImage";
import {
  drawCertificateToCanvas,
  type DrawCertificateOptions,
} from "@/lib/canvas/draw-text-element";
import { awaitFontsReady } from "@/lib/canvas/await-fonts";
import {
  CERTIFICATE_PREVIEW_HEIGHT,
  PREVIEW_ZOOM_DEFAULT,
  buildAdaptiveHeight,
  clampPreviewZoom,
} from "@/components/certificate-designer/previewSizing";

interface CertificatePreviewProps {
  imageUrl: string | null;
  attendees: string[];
  previewIndex: number;
  textElements: TextElement[];
  onDownload: () => void;
  onPreviewChange: (index: number) => void;
  imageDimensions: { width: number; height: number };
  previewDrawContext?: DrawCertificateOptions | null;
}

export function CertificatePreview({
  imageUrl,
  attendees,
  previewIndex,
  textElements,
  onDownload,
  onPreviewChange,
  imageDimensions,
  previewDrawContext = null,
}: CertificatePreviewProps) {
  useFontLoader();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { image: templateImg } = useCertificateTemplateImage(imageUrl);
  const [zoom, setZoom] = useState(PREVIEW_ZOOM_DEFAULT);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !templateImg) return;
    let cancelled = false;
    (async () => {
      await awaitFontsReady(textElements);
      if (cancelled) return;
      try {
        drawCertificateToCanvas(
          canvas,
          templateImg,
          textElements,
          previewDrawContext ?? {}
        );
      } catch (err) {
        console.error("Preview render failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [templateImg, textElements, previewDrawContext]);

  const aspect =
    imageDimensions.width && imageDimensions.height
      ? imageDimensions.width / imageDimensions.height
      : templateImg
        ? (templateImg.naturalWidth || 1) / (templateImg.naturalHeight || 1)
        : 1;
  const adaptiveHeight = buildAdaptiveHeight(
    CERTIFICATE_PREVIEW_HEIGHT.minPx,
    CERTIFICATE_PREVIEW_HEIGHT.viewport,
    CERTIFICATE_PREVIEW_HEIGHT.maxPx
  );

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

      <div className="space-y-2">
        <PreviewZoomControls
          zoom={zoom}
          onZoomChange={(nextZoom) => setZoom(clampPreviewZoom(nextZoom))}
        />
        <div className="overflow-auto rounded-md">
          <div className="flex justify-center p-1">
            <div
              className="origin-top transition-transform"
              style={{
                transform: `scale(${zoom})`,
                width: `calc(${adaptiveHeight} * ${aspect})`,
              }}
            >
              <div
                className="relative border rounded-md overflow-hidden bg-background mx-auto"
                style={{
                  height: adaptiveHeight,
                  width: `calc(${adaptiveHeight} * ${aspect})`,
                  maxWidth: "100%",
                }}
              >
                {imageUrl ? (
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                    style={{ display: "block" }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Upload a certificate template to preview
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {attendees.length > 0 && textElements.some((el) => el.type === "name") && (
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
