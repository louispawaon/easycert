"use client";

import { TextElement } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Trash2, Save, Bold, Italic, Underline, ChevronDown, ChevronUp } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { getFontOptions } from '@/lib/fonts';
import { useFontLoader } from '@/hooks/useFontLoader';
import { useFontUpload } from '@/hooks/useFontUpload';
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { getCustomFonts } from '@/lib/fonts';
import type { TextProperties } from "@/hooks/useCertificateDesigner";

interface TextElementEditorProps {
  element: TextElement;
  onUpdate: (property: keyof TextElement, value: string | number) => void;
  onRemove: () => void;
}

/** One-shot guard: the blob-font warning should surface at most once per page session, regardless of editor mounts. */
let blobFontWarningShown = false;

function clampPct(value: number, min = 0, max = 1): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function pctToDisplay(value: number): string {
  return (value * 100).toFixed(1);
}

export function TextElementEditor({ element, onUpdate, onRemove }: TextElementEditorProps) {
  const { toast } = useToast();
  const [presetName, setPresetName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    fontFile,
    setFontFile,
    handleFontUpload
  } = useFontUpload();
  const [showFontUpload, setShowFontUpload] = useState(false);

  useFontLoader(element.fontFamily);

  useEffect(() => {
    if (blobFontWarningShown) return;
    const customFonts = getCustomFonts();
    const hasBlobFont = Object.values(customFonts).some(
      (url) => typeof url === 'string' && url.startsWith('blob:')
    );
    if (!hasBlobFont) return;
    blobFontWarningShown = true;
    toast({
      title: "Font Update Required",
      description: "Some custom fonts need to be re-uploaded due to browser session changes. Please re-upload your custom fonts.",
      variant: "destructive",
    });
  }, [toast]);

  const extractTextProperties = (el: TextElement): TextProperties => ({
    fontSize: el.fontSize,
    fontFamily: el.fontFamily,
    fontStyle: el.fontStyle,
    color: el.color,
    fontWeight: el.fontWeight,
    textDecoration: el.textDecoration,
    maxWidthPct: el.maxWidthPct,
  });

  const savePreset = async () => {
    try {
      const preset = {
        name: presetName,
        properties: extractTextProperties(element),
        createdAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${presetName.toLowerCase().replace(/\s+/g, '-')}-preset.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Preset has been saved successfully!",
      });

      setPresetName('');
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving preset:', error);
      toast({
        title: "Error",
        description: "Failed to save preset. Please try again.",
        variant: "destructive",
      });
    }
  };

  const xPctDisplay = pctToDisplay(element.x);
  const yPctDisplay = pctToDisplay(element.y);
  const fontOptions = getFontOptions();
  const hasFontValue = fontOptions.some((option) => option.value === element.fontFamily);

  return (
    <div className="border rounded-md p-3 sm:p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold">Element Properties</h3>
        <div className="flex flex-wrap gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" title="Save as Preset">
                <Save className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Preset</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <Input
                  placeholder="Enter preset name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                />
                <Button
                  onClick={savePreset}
                  disabled={!presetName.trim()}
                >
                  Save Preset
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="icon"
            onClick={onRemove}
            title="Remove Element"
            className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {element.type === 'static' && (
        <div className="space-y-2 mb-4">
          <Label htmlFor="text-content">Text Content</Label>
          <Input
            id="text-content"
            value={element.value ?? ''}
            onChange={(e) => onUpdate('value', e.target.value)}
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">Font Settings</Label>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setShowFontUpload(!showFontUpload)}
            >
              + Add Custom Font
              {showFontUpload ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showFontUpload && (
              <div className="space-y-2 p-2 border rounded-md">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    onChange={(e) => e.target.files && setFontFile(e.target.files[0])}
                  />
                  <Button
                    onClick={handleFontUpload}
                    disabled={!fontFile}
                    className="w-full sm:w-auto"
                  >
                    Upload Font
                  </Button>
                </div>
                {fontFile && (
                  <p className="text-sm text-muted-foreground">
                    Font name will be: {fontFile.name.replace(/\.[^/.]+$/, "")}
                  </p>
                )}
              </div>
            )}
          </div>

          <Select
            value={hasFontValue ? element.fontFamily : undefined}
            onValueChange={(value) => onUpdate('fontFamily', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {fontOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="font-size">Font Size</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(element.fontSize)}px
              </span>
            </div>
            <Slider
              id="font-size"
              min={10}
              max={400}
              step={1}
              value={[element.fontSize]}
              onValueChange={(value) => onUpdate('fontSize', value[0])}
            />
            <p className="text-xs text-muted-foreground">
              Long names auto-shrink to fit the max width below.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Font Style</Label>
          <div className="flex flex-wrap gap-2">
            <Toggle
              variant="outline"
              pressed={element.fontWeight === 'bold'}
              onPressedChange={(pressed) => onUpdate('fontWeight', pressed ? 'bold' : 'normal')}
              aria-label="Toggle bold"
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle
              variant="outline"
              pressed={element.fontStyle === 'italic'}
              onPressedChange={(pressed) => onUpdate('fontStyle', pressed ? 'italic' : 'normal')}
              aria-label="Toggle italic"
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle
              variant="outline"
              pressed={element.textDecoration === 'underline'}
              onPressedChange={(pressed) =>
                onUpdate('textDecoration', pressed ? 'underline' : 'none')
              }
              aria-label="Toggle underline"
              title="Underline"
            >
              <Underline className="h-4 w-4" />
            </Toggle>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="text-color" className="flex items-center gap-2">Text Color</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="text-color"
              type="color"
              value={element.color}
              onChange={(e) => onUpdate('color', e.target.value)}
              className="h-10 w-full sm:w-12 p-1"
            />
            <Input
              value={element.color}
              onChange={(e) => onUpdate('color', e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">Position (center anchor)</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="pos-x" className="text-xs">X (%)</Label>
              <Input
                id="pos-x"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={xPctDisplay}
                onChange={(e) => onUpdate('x', clampPct(Number(e.target.value) / 100))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pos-y" className="text-xs">Y (%)</Label>
              <Input
                id="pos-y"
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

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="max-width">Max Width</Label>
            <span className="text-sm text-muted-foreground">
              {Math.round(element.maxWidthPct * 100)}%
            </span>
          </div>
          <Slider
            id="max-width"
            min={10}
            max={100}
            step={1}
            value={[Math.round(element.maxWidthPct * 100)]}
            onValueChange={(value) => onUpdate('maxWidthPct', clampPct(value[0] / 100, 0.05, 1))}
          />
          <p className="text-xs text-muted-foreground">
            Maximum text width as a percentage of the canvas width. Names that exceed this width are auto-shrunk.
          </p>
        </div>
      </div>
    </div>
  );
}
