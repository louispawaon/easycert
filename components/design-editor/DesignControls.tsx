"use client";

import { Button } from "@/components/ui/button";
import { Plus, Upload, Loader2, Link, User, Type } from "lucide-react";
import type { TextElement, DesignElement } from "@/types/types";
import type { TextProperties } from "@/hooks/useDesignerController";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { GenerateHelpHint } from "@/components/generate-help-hint";
import { LayersList } from "@/components/design-editor/LayersList";

interface DesignControlsProps {
  onInsertStatic: () => void;
  onInsertRecordName: () => void;
  onInsertFieldFromCsv: (columnKey: string) => void;
  onInsertQr: () => void;
  recordCsvHeaders: string[];
  /** When true (paste / TXT / JSON / single-column CSV), hide column picker UX. */
  recordLinesMode: boolean;
  placedElements: DesignElement[];
  textElements: TextElement[];
  onLoadPreset: (properties: Partial<TextProperties>) => void;
  imageUrl: string | null;
  selectedElement: string | null;
  onElementSelect: (id: string | null) => void;
}

export function DesignControls({
  onInsertStatic,
  onInsertRecordName,
  onInsertFieldFromCsv,
  onInsertQr,
  recordCsvHeaders,
  recordLinesMode,
  placedElements,
  textElements,
  onLoadPreset,
  imageUrl,
  selectedElement,
  onElementSelect,
}: DesignControlsProps) {
  const { toast } = useToast();
  const sidebarButtonClass =
    "h-auto min-h-9 w-full justify-start whitespace-normal py-2 leading-snug [&_svg]:shrink-0";
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [presetDropActive, setPresetDropActive] = useState(false);
  const presetFileInputRef = useRef<HTMLInputElement>(null);

  const csvFieldKeyStable = useMemo(
    () => recordCsvHeaders[0] ?? "",
    [recordCsvHeaders]
  );
  const [csvFieldKey, setCsvFieldKey] = useState(csvFieldKeyStable);

  useEffect(() => {
    setCsvFieldKey((cur) => (recordCsvHeaders.includes(cur) ? cur : csvFieldKeyStable));
  }, [recordCsvHeaders, csvFieldKeyStable]);

  const processPresetFile = (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const preset = JSON.parse(event.target?.result as string);
        const raw = (preset?.properties ?? {}) as Record<string, unknown>;
        const properties: Partial<TextProperties> = {};
        if (typeof raw.fontSize === "number") properties.fontSize = raw.fontSize;
        if (typeof raw.fontFamily === "string") properties.fontFamily = raw.fontFamily;
        if (raw.fontStyle === "italic" || raw.fontStyle === "normal") {
          properties.fontStyle = raw.fontStyle;
        }
        if (typeof raw.color === "string") properties.color = raw.color;
        if (raw.fontWeight === "bold" || raw.fontWeight === "normal") {
          properties.fontWeight = raw.fontWeight;
        }
        if (raw.textDecoration === "underline" || raw.textDecoration === "none") {
          properties.textDecoration = raw.textDecoration;
        }
        if (typeof raw.maxWidthPct === "number") {
          properties.maxWidthPct = Math.min(1, Math.max(0.05, raw.maxWidthPct));
        }

        onLoadPreset(properties);
        toast({
          title: "Success",
          description: `Preset "${preset.name}" loaded successfully!`,
        });

        if (presetFileInputRef.current) presetFileInputRef.current.value = "";
        setDialogOpen(false);
      } catch (error) {
        console.error("Error parsing preset:", error);
        toast({
          title: "Error",
          description: "Invalid preset file format.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read the preset file.",
        variant: "destructive",
      });
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const onPresetFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok =
      file.type === "application/json" || file.name.toLowerCase().endsWith(".json");
    if (!ok) {
      toast({
        title: "Invalid file",
        description: "Please choose a .json preset file.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }
    processPresetFile(file);
  };

  const onPresetDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setPresetDropActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const ok =
      file.type === "application/json" || file.name.toLowerCase().endsWith(".json");
    if (!ok) {
      toast({
        title: "Invalid file",
        description: "Please drop a .json preset file.",
        variant: "destructive",
      });
      return;
    }
    processPresetFile(file);
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="min-w-0 space-y-4">
        <div className="min-w-0 space-y-2">
          <div className="flex min-w-0 items-center gap-1">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-tight leading-none">Text</h3>
            <GenerateHelpHint label="Help: add text elements">
              <span>
                {recordLinesMode
                  ? "Add a name field for each record. You can also add fixed text like event title or date."
                  : "Pick a column from your file, then place it on the design as live text."}{" "}
                Upload your template image before placing text.
              </span>
            </GenerateHelpHint>
          </div>
          {recordLinesMode ? (
            <Button
              onClick={() => onInsertRecordName()}
              className={sidebarButtonClass}
              variant="outline"
              disabled={!imageUrl}
            >
              <User className="mr-2 h-4 w-4" />
              Insert Record Name
            </Button>
          ) : (
            <div className="min-w-0 space-y-2">
              <div className="min-w-0 space-y-2">
                <Label className="text-xs font-medium uppercase leading-snug text-muted-foreground">
                  Choose info to show
                </Label>
                <Select
                  value={csvFieldKey || csvFieldKeyStable}
                  onValueChange={setCsvFieldKey}
                  disabled={recordCsvHeaders.length === 0}
                >
                  <SelectTrigger className="min-w-0 w-full">
                    <SelectValue placeholder="Choose from your uploaded list" />
                  </SelectTrigger>
                  <SelectContent>
                    {recordCsvHeaders.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => onInsertFieldFromCsv(csvFieldKey || csvFieldKeyStable)}
                className={sidebarButtonClass}
                variant="outline"
                disabled={
                  !imageUrl || recordCsvHeaders.length === 0 || !(csvFieldKey || csvFieldKeyStable)
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Insert Selected Info
              </Button>
            </div>
          )}
          <Button
            onClick={() => onInsertStatic()}
            className={sidebarButtonClass}
            variant="outline"
            disabled={!imageUrl}
          >
            <Type className="mr-2 h-4 w-4" />
            Insert Subtext
          </Button>
        </div>

        <div className="min-w-0 space-y-2 border-t pt-4">
          <div className="flex min-w-0 items-center gap-1">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-tight leading-none">Proof</h3>
            <GenerateHelpHint label="Help: proof link">
              <span>
                Adds a shareable proof link that renders as a QR code. Each output gets a unique
                signed link that can be verified by scanning.
              </span>
            </GenerateHelpHint>
          </div>
          <Button
            onClick={() => onInsertQr()}
            className={sidebarButtonClass}
            variant="outline"
            disabled={!imageUrl}
          >
            <Link className="mr-2 h-4 w-4" />
            Insert Proof Link
          </Button>
        </div>


        {textElements.length > 0 && (
          <div className="border-t pt-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className={sidebarButtonClass}>
                  <Upload className="mr-2 h-4 w-4" />
                  Load Preset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Load Preset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid w-full items-center gap-2">
                    <div
                      className={cn(
                        "relative flex min-h-[140px] flex-col items-center justify-center rounded-md border border-dashed p-6 transition-colors",
                        presetDropActive && "border-primary bg-primary/5",
                        isLoading && "pointer-events-none opacity-60"
                      )}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setPresetDropActive(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          setPresetDropActive(false);
                        }
                      }}
                      onDrop={onPresetDrop}
                    >
                      <label
                        htmlFor="preset-file"
                        className="flex cursor-pointer flex-col items-center gap-2 text-center"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-colors hover:bg-primary/20">
                          <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          Click to browse or drop a preset file
                        </span>
                        <span className="text-xs text-muted-foreground">
                          JSON export from Save Preset (.json)
                        </span>
                        <Input
                          ref={presetFileInputRef}
                          id="preset-file"
                          type="file"
                          accept=".json,application/json"
                          onChange={onPresetFileChange}
                          className="sr-only"
                          disabled={isLoading}
                        />
                      </label>
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/60">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Applies saved typography and layout to the selected text element.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
        <div className="border-t pt-4">
          <div className="mb-3 flex min-w-0 items-center gap-1">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-tight leading-none">Placed elements</h3>
          </div>
          <LayersList
            elements={placedElements}
            textElements={textElements}
            selectedElement={selectedElement}
            onSelect={onElementSelect}
          />
        </div>
      </div>
    </div>
  );
} 