"use client";

import type { ProofLinkElement } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";
import { GenerateHelpHint } from "@/components/generate-help-hint";
import { normalizeHexColor } from "@/lib/utils";
import { buildProofSizingPlaceholderUrl } from "@/lib/proof/url";
import {
  computeProofLinkRenderDimensions,
  MIN_PROOF_LINK_RENDER_PX,
  PROOF_LINK_DEFAULT_SIZE_PCT,
  PROOF_LINK_REFERENCE_CANVAS_WIDTH,
} from "@/lib/canvas/proof-link-render";

interface ProofLinkElementEditorProps {
  element: ProofLinkElement;
  onUpdate: (property: string, value: unknown) => void;
  onRemove: () => void;
  issuer: string;
  onIssuerChange: (value: string) => void;
}

function clampPct(value: number, min = 0, max = 1): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function pctToDisplay(value: number): string {
  return (value * 100).toFixed(1);
}

export function ProofLinkElementEditor({
  element,
  onUpdate,
  onRemove,
  issuer,
  onIssuerChange,
}: ProofLinkElementEditorProps) {
  const xPctDisplay = pctToDisplay(element.x);
  const yPctDisplay = pctToDisplay(element.y);
  const sizingUrl = buildProofSizingPlaceholderUrl();
  const renderDimensions = computeProofLinkRenderDimensions(
    element.sizePct,
    PROOF_LINK_REFERENCE_CANVAS_WIDTH,
    sizingUrl
  );
  const minSizePct = Math.round(PROOF_LINK_DEFAULT_SIZE_PCT * 100);

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-tight leading-none">Proof Link Properties</h3>
          <GenerateHelpHint label="Help: proof link">
            <span>
              The proof link renders as a QR code. Recipient name and issuer are included
              in the link and are publicly readable when scanned.
            </span>
          </GenerateHelpHint>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onRemove}
          title="Remove proof link element"
          className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="min-w-0 space-y-2">
        <Label htmlFor="sidebar-issuer" className="flex items-center gap-2 leading-snug">
          Issuing organization
        </Label>
        <Input
          id="sidebar-issuer"
          placeholder="e.g. University of Technology"
          value={issuer}
          onChange={(e) => onIssuerChange(e.target.value)}
          className="min-w-0 w-full"
        />
        <p className="text-xs text-muted-foreground">
          This appears as &quot;Issued by&quot; on the proof page. Optional.
        </p>
      </div>

      <div className="min-w-0 space-y-2 border-t pt-4">
        <Label className="flex items-center gap-2 leading-snug">Position (center anchor)</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="proof-link-pos-x" className="text-xs">X (%)</Label>
            <Input
              id="proof-link-pos-x"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={xPctDisplay}
              onChange={(e) => onUpdate('x', clampPct(Number(e.target.value) / 100))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="proof-link-pos-y" className="text-xs">Y (%)</Label>
            <Input
              id="proof-link-pos-y"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={yPctDisplay}
              onChange={(e) => onUpdate('y', clampPct(Number(e.target.value) / 100))}
            />
          </div>
        </div>
      </div>

      <div className="min-w-0 space-y-2 border-t pt-4">
        <div className="flex justify-between">
          <Label htmlFor="proof-link-size" className="leading-snug">Size</Label>
          <span className="text-sm text-muted-foreground">
            {Math.max(minSizePct, Math.round(element.sizePct * 100))}%
          </span>
        </div>
        <Slider
          id="proof-link-size"
          min={minSizePct}
          max={30}
          step={1}
          value={[Math.max(minSizePct, Math.round(element.sizePct * 100))]}
          onValueChange={(value) =>
            onUpdate("sizePct", clampPct(value[0] / 100, PROOF_LINK_DEFAULT_SIZE_PCT, 0.3))
          }
        />
        <p className="text-xs text-muted-foreground">
          Minimum {MIN_PROOF_LINK_RENDER_PX}px. Roughly {renderDimensions.renderSize}px on a{" "}
          {PROOF_LINK_REFERENCE_CANVAS_WIDTH}px-wide template. Use a solid light background for best
          contrast.
        </p>
      </div>

      <div className="min-w-0 space-y-2 border-t pt-4">
        <Label htmlFor="proof-link-color" className="flex items-center gap-2 leading-snug">
          Foreground color
        </Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id="proof-link-color"
            type="color"
            value={element.color}
            onChange={(e) => onUpdate('color', normalizeHexColor(e.target.value))}
            className="h-10 w-full sm:w-12 p-1"
          />
          <Input
            value={element.color}
            onChange={(e) => onUpdate('color', normalizeHexColor(e.target.value))}
            className="min-w-0 flex-1 font-mono lowercase"
          />
        </div>
      </div>

      <div className="min-w-0 space-y-2 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="proof-link-bg" className="leading-snug">Background</Label>
          <div className="flex items-center gap-2">
            <Label htmlFor="proof-link-transparent" className="text-xs text-muted-foreground">
              Transparent
            </Label>
            <Switch
              id="proof-link-transparent"
              checked={element.transparentBg}
              onCheckedChange={(checked) => onUpdate('transparentBg', checked)}
            />
          </div>
        </div>
        {!element.transparentBg && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="proof-link-bg"
              type="color"
              value={element.bgColor}
              onChange={(e) => onUpdate('bgColor', normalizeHexColor(e.target.value))}
              className="h-10 w-full sm:w-12 p-1"
            />
            <Input
              value={element.bgColor}
              onChange={(e) => onUpdate('bgColor', normalizeHexColor(e.target.value))}
              className="min-w-0 flex-1 font-mono lowercase"
            />
          </div>
        )}
      </div>

      <div className="min-w-0 border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Each output gets a unique proof link at export time.
          The proof link renders as a QR code on the design.
        </p>
      </div>
    </div>
  );
}
