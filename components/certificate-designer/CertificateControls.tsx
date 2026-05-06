"use client";

import { Button } from "@/components/ui/button";
import { Plus, Upload, Loader2 } from "lucide-react";
import { TextElement } from "@/types/types";
import type { TextProperties } from "@/hooks/useCertificateDesigner";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface CertificateControlsProps {
  onAddTextElement: (type: 'name' | 'static') => void;
  textElements: TextElement[];
  onLoadPreset: (properties: Partial<TextProperties>) => void;
  imageUrl: string | null;
}

export function CertificateControls({ 
  onAddTextElement, 
  textElements,
  onLoadPreset,
  imageUrl 
}: CertificateControlsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [presetDropActive, setPresetDropActive] = useState(false);
  const presetFileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="border rounded-md p-3 sm:p-4">
      <h3 className="mb-3 text-base sm:text-lg font-semibold">Add Elements</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={() => onAddTextElement('name')} 
            className="w-full justify-start"
            variant="outline"
            disabled={!imageUrl}
          >
            <Plus className="mr-2 h-4 w-4" />
            Insert Attendee Name
          </Button>
          <Button 
            onClick={() => onAddTextElement('static')} 
            className="w-full justify-start"
            variant="outline"
            disabled={!imageUrl}
          >
            <Plus className="mr-2 h-4 w-4" />
            Insert Subtext
          </Button>
        </div>

        {textElements.length > 0 && (
          <div className="pt-2 border-t">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
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
      </div>
    </div>
  );
} 