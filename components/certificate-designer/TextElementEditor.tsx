"use client";

import { TextElement } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Trash2, Save } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Bold, Italic, Underline } from "lucide-react";
import { getFontOptions } from '@/lib/fonts';
import { useFontLoader } from '@/hooks/useFontLoader';
import { useFontUpload } from '@/hooks/useFontUpload';
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";

interface TextProperties {
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'bold' | 'lighter';
  fontStyle: string;
  textDecoration: string;
  textAlign: string;
  lineHeight: number;
}

interface TextElementEditorProps {
  element: TextElement;
  onUpdate: (property: keyof TextElement, value: string | number) => void;
  onRemove: () => void;
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

  const extractTextProperties = (element: TextElement): TextProperties => {
    return {
      fontSize: element.fontSize,
      fontFamily: element.fontFamily,
      color: element.color,
      fontWeight: typeof element.fontWeight === 'number' ? 'normal' : element.fontWeight,
      fontStyle: element.fontStyle,
      textDecoration: element.textDecoration,
      textAlign: element.textAlign,
      lineHeight: element.lineHeight,
    };
  };

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

  return (
    <div className="border rounded-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Element Properties</h3>
        <div className="flex gap-2">
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
          <Button variant="destructive" size="icon" onClick={onRemove} title="Remove Element">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {element.type === 'static' && (
        <div className="space-y-2 mb-4">
          <Label htmlFor="text-content">Text Content</Label>
          <Input
            id="text-content"
            value={element.text}
            onChange={(e) => onUpdate('text', e.target.value)}
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
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    onChange={(e) => e.target.files && setFontFile(e.target.files[0])}
                  />
                  <Button 
                    onClick={handleFontUpload}
                    disabled={!fontFile}
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
            value={element.fontFamily}
            onValueChange={(value) => onUpdate('fontFamily', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {getFontOptions().map((option) => (
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
                {element.fontSize}px
              </span>
            </div>
            <Slider
              id="font-size"
              min={10}
              max={72}
              step={1}
              value={[element.fontSize]}
              onValueChange={(value) => onUpdate('fontSize', value[0])}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Font Style</Label>
          <div className="flex gap-2">
            <Toggle
              pressed={element.fontWeight === 'bold'}
              onPressedChange={(pressed) => onUpdate('fontWeight', pressed ? 'bold' : 'normal')}
              aria-label="Toggle bold"
            >
              <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={element.fontStyle === 'italic'}
              onPressedChange={(pressed) => onUpdate('fontStyle', pressed ? 'italic' : 'normal')}
              aria-label="Toggle italic"
            >
              <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={element.textDecoration === 'underline'}
              onPressedChange={(pressed) => onUpdate('textDecoration', pressed ? 'underline' : 'none')}
              aria-label="Toggle underline"
            >
              <Underline className="h-4 w-4" />
            </Toggle>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="text-color" className="flex items-center gap-2">Text Color</Label>
          <div className="flex gap-2">
            <Input
              id="text-color"
              type="color"
              value={element.color}
              onChange={(e) => onUpdate('color', e.target.value)}
              className="w-12 h-10 p-1"
            />
            <Input
              value={element.color}
              onChange={(e) => onUpdate('color', e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="flex items-center gap-2">Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="pos-x" className="text-xs">X Position</Label>
              <Input
                id="pos-x"
                type="number"
                value={element.x}
                onChange={(e) => onUpdate('x', Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pos-y" className="text-xs">Y Position</Label>
              <Input
                id="pos-y"
                type="number"
                value={element.y}
                onChange={(e) => onUpdate('y', Number(e.target.value))}
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="line-height">Line Height</Label>
          <Slider
            id="line-height"
            min={0.8}
            max={3}
            step={0.1}
            value={[element.lineHeight]}
            onValueChange={(value) => onUpdate('lineHeight', value[0])}
          />
        </div>
      </div>
    </div>
  );
} 