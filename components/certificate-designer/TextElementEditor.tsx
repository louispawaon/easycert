"use client";

import { TextElement } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Trash2 } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Bold, Italic, Underline } from "lucide-react";
import { FONT_OPTIONS } from '@/lib/fonts';

interface TextElementEditorProps {
  element: TextElement;
  onUpdate: (property: keyof TextElement, value: string | number) => void;
  onRemove: () => void;
}

export function TextElementEditor({ element, onUpdate, onRemove }: TextElementEditorProps) {
  return (
    <div className="border rounded-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Element Properties</h3>
        <Button variant="destructive" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
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
          <Select
            value={element.fontFamily}
            onValueChange={(value) => onUpdate('fontFamily', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((option) => (
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