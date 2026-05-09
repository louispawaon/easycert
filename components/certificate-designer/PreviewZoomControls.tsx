"use client";

import { Button } from "@/components/ui/button";
import {
  PREVIEW_ZOOM_MAX,
  PREVIEW_ZOOM_MIN,
  PREVIEW_ZOOM_STEP,
  clampPreviewZoom,
} from "@/components/certificate-designer/previewSizing";

interface PreviewZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export function PreviewZoomControls({ zoom, onZoomChange }: PreviewZoomControlsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onZoomChange(clampPreviewZoom(zoom - PREVIEW_ZOOM_STEP))}
        disabled={zoom <= PREVIEW_ZOOM_MIN}
      >
        -
      </Button>
      <span className="w-14 text-right text-sm tabular-nums">{Math.round(zoom * 100)}%</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onZoomChange(1)}
        disabled={zoom === 1}
      >
        Reset
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onZoomChange(clampPreviewZoom(zoom + PREVIEW_ZOOM_STEP))}
        disabled={zoom >= PREVIEW_ZOOM_MAX}
      >
        +
      </Button>
    </div>
  );
}
