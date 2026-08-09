"use client";

import { TextElement } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Trash2, Save, Bold, Italic, Underline, ChevronDown, ChevronUp, Upload } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { getFontOptions } from '@/lib/fonts';
import { useFontLoader } from '@/hooks/useFontLoader';
import { useFontUpload } from '@/hooks/useFontUpload';
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { normalizeHexColor } from "@/lib/utils";
import { GenerateHelpHint } from "@/components/generate-help-hint";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast, toast as showToast } from "@/hooks/useToast";
import { getCustomFonts } from '@/lib/fonts';
import type { TextProperties } from "@/hooks/useDesignerController";

interface TextElementEditorProps {
  element: TextElement;
  onUpdate: (property: string, value: string | number | undefined) => void;
  onRemove: () => void;
  recordCsvHeaders: string[];
  recordLinesMode: boolean;
}

const BIND_FIRST_COLUMN = "__ditto_first_column__";

function clampPct(value: number, min = 0, max = 1): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function pctToDisplay(value: number): string {
  return (value * 100).toFixed(1);
}

export function TextElementEditor({
  element,
  onUpdate,
  onRemove,
  recordCsvHeaders,
  recordLinesMode,
}: TextElementEditorProps) {
  const { toast } = useToast();
  const blobFontWarningShownRef = useRef(false);
  const [presetName, setPresetName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    fontFile,
    setFontFile,
    handleFontUpload
  } = useFontUpload();
  const [showFontUpload, setShowFontUpload] = useState(false);
  const [fontDropActive, setFontDropActive] = useState(false);
  const fontFileInputRef = useRef<HTMLInputElement>(null);

  const fontExtensions = /\.(ttf|otf|woff2?)$/i;
  const acceptFont = (file: File) =>
    fontExtensions.test(file.name) ||
    [
      "font/ttf",
      "font/otf",
      "font/woff",
      "font/woff2",
      "application/font-woff",
      "application/x-font-ttf",
      "application/x-font-otf",
    ].includes(file.type);

  const pickFontFile = (file: File | undefined) => {
    if (!file) return;
    if (!acceptFont(file)) {
      toast({
        title: "Unsupported file",
        description: "Use a .ttf, .otf, .woff, or .woff2 font file.",
        variant: "destructive",
      });
      if (fontFileInputRef.current) fontFileInputRef.current.value = "";
      return;
    }
    setFontFile(file);
  };

  const onFontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    pickFontFile(e.target.files?.[0]);
  };

  const onFontDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFontDropActive(false);
    pickFontFile(e.dataTransfer.files?.[0]);
  };

  const onFontUploadClick = async () => {
    const addedName = await handleFontUpload();
    if (fontFileInputRef.current) fontFileInputRef.current.value = "";
    if (addedName) {
      onUpdate("fontFamily", addedName);
      setShowFontUpload(false);
    }
  };

  useFontLoader(element.fontFamily);

  useEffect(() => {
    if (blobFontWarningShownRef.current) return;
    const customFonts = getCustomFonts();
    const hasBlobFont = Object.values(customFonts).some(
      (url) => typeof url === 'string' && url.startsWith('blob:')
    );
    if (!hasBlobFont) return;
    blobFontWarningShownRef.current = true;
    showToast({
      title: "Font Update Required",
      description: "Some custom fonts need to be re-uploaded due to browser session changes. Please re-upload your custom fonts.",
      variant: "destructive",
    });
  }, []);

  const extractTextProperties = (el: TextElement): TextProperties => ({
    fontSize: el.fontSize,
    fontFamily: el.fontFamily,
    fontStyle: el.fontStyle,
    color: el.color,
    fontWeight: el.fontWeight,
    textDecoration: el.textDecoration,
    textAlign: el.textAlign ?? "center",
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
    <div className="min-w-0 space-y-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-tight leading-none">Element Properties</h3>
          <GenerateHelpHint label="Help: text styling">
            <span>
              Edit font, size, color, and position for the selected text.
              These settings only affect the text box you clicked.
            </span>
          </GenerateHelpHint>
        </div>
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

      {(element.type === "dynamic-text" || element.type === "name") &&
        !recordLinesMode &&
        recordCsvHeaders.length > 1 && (
          <div className="min-w-0 space-y-2">
            <Label htmlFor="csv-column-bind">CSV column</Label>
            <Select
              value={(element.variable ?? element.variableColumn) ?? BIND_FIRST_COLUMN}
              onValueChange={(value) =>
                onUpdate(
                  "variable",
                  value === BIND_FIRST_COLUMN ? undefined : value
                )
              }
            >
              <SelectTrigger id="csv-column-bind" className="min-w-0 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={BIND_FIRST_COLUMN}>
                  First column (default)
                </SelectItem>
                {recordCsvHeaders.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

      <div className="min-w-0 space-y-4 border-t pt-4">
        <div className="min-w-0 space-y-2">
          <Label className="flex items-center gap-2 leading-snug">Position</Label>
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


        <div className="min-w-0 space-y-2 border-t pt-4">
          <Label className="leading-snug">Text Alignment</Label>
          <Select
            value={element.textAlign ?? "center"}
            onValueChange={(value) => onUpdate('textAlign', value as "left" | "center" | "right")}
          >
            <SelectTrigger className="min-w-0 w-full">
              <SelectValue placeholder="Select alignment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>


        <div className="min-w-0 space-y-2 border-t pt-4">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="max-width" className="leading-snug">Max Width</Label>
            <div className="flex items-center gap-1">
              <Input
                id="max-width-input"
                type="number"
                min={5}
                max={100}
                step={1}
                value={Math.round(element.maxWidthPct * 100)}
                onChange={(e) => onUpdate('maxWidthPct', clampPct(Number(e.target.value) / 100, 0.05, 1))}
                className="h-8 w-16 text-right"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <Slider
            id="max-width"
            min={10}
            max={100}
            step={1}
            value={[Math.round(element.maxWidthPct * 100)]}
            onValueChange={(value) => onUpdate('maxWidthPct', clampPct(value[0] / 100, 0.05, 1))}
          />
          <p className="text-xs leading-snug text-muted-foreground">
            Maximum text width as a percentage of the canvas width. Values that exceed this width are auto-shrunk.
          </p>
        </div>

        <div className="min-w-0 space-y-2 border-t pt-4">
          <Label className="flex items-center gap-2 leading-snug">Font Settings</Label>

          <div className="min-w-0 space-y-2">
            <Button
              variant="outline"
              className="h-auto min-h-9 w-full justify-between whitespace-normal py-2 leading-snug"
              onClick={() => setShowFontUpload(!showFontUpload)}
            >
              + Add Custom Font
              {showFontUpload ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showFontUpload && (
              <div className="space-y-3 rounded-md border p-3">
                <div
                  className={cn(
                    "relative flex min-h-30 flex-col items-center justify-center rounded-md border border-dashed px-4 py-5 transition-colors",
                    fontDropActive && "border-primary bg-primary/5"
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setFontDropActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setFontDropActive(false);
                    }
                  }}
                  onDrop={onFontDrop}
                >
                  <label
                    htmlFor="custom-font-file"
                    className="flex cursor-pointer flex-col items-center gap-2 text-center"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 transition-colors hover:bg-primary/20">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      Choose a font file or drop it here
                    </span>
                    <span className="text-xs text-muted-foreground">
                      TTF, OTF, WOFF, or WOFF2
                    </span>
                    <Input
                      ref={fontFileInputRef}
                      id="custom-font-file"
                      type="file"
                      accept=".ttf,.otf,.woff,.woff2"
                      onChange={onFontFileChange}
                      className="sr-only"
                    />
                  </label>
                </div>
                {fontFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">{fontFile.name}</span>
                    {" · "}
                    registers as{" "}
                    <span className="font-medium text-foreground">
                      {fontFile.name.replace(/\.[^/.]+$/, "")}
                    </span>
                  </p>
                )}
                <Button
                  onClick={onFontUploadClick}
                  disabled={!fontFile}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Add & use font
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Applies to the selected text element only.
                </p>
              </div>
            )}
          </div>

          <Select
            value={hasFontValue ? element.fontFamily : undefined}
            onValueChange={(value) => onUpdate('fontFamily', value)}
          >
            <SelectTrigger className="min-w-0 w-full">
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
              Long values auto-shrink to fit the max width below.
            </p>
          </div>
        </div>

        <div className="min-w-0 space-y-2 border-t pt-4">
          <Label className="leading-snug">Font Style</Label>
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

        <div className="min-w-0 space-y-2 border-t pt-4">
          <Label htmlFor="text-color" className="flex items-center gap-2 leading-snug">
            Text Color
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="text-color"
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
      </div>
    </div>
  );
}
