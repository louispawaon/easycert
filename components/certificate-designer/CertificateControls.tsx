"use client";

import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { TextElement } from "@/types/types";
import { Input } from "@/components/ui/input";
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

interface CertificateControlsProps {
  onAddTextElement: (type: 'name' | 'static') => void;
  textElements: TextElement[];
  onLoadPreset: (properties: TextProperties) => void;
}

export function CertificateControls({ 
  onAddTextElement, 
  textElements,
  onLoadPreset 
}: CertificateControlsProps) {
  const { toast } = useToast();

  const loadPreset = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const preset = JSON.parse(event.target?.result as string);
          const properties = preset.properties as TextProperties;
          
          onLoadPreset(properties);
          toast({
            title: "Success",
            description: `Preset "${preset.name}" loaded successfully!`,
          });
        } catch (error) {
          console.error('Error parsing preset:', error);
          toast({
            title: "Error",
            description: "Invalid preset file format.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error loading preset:', error);
      toast({
        title: "Error",
        description: "Failed to load preset. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="border rounded-md p-4">
      <h3 className="text-lg font-medium mb-4">Add Elements</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={() => onAddTextElement('name')} 
            className="w-full justify-start"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Name Placeholder
          </Button>
          <Button 
            onClick={() => onAddTextElement('static')} 
            className="w-full justify-start"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Static Text
          </Button>
        </div>

        {textElements.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".json"
                onChange={loadPreset}
                className="flex-1"
                placeholder="Load Preset"
              />
              <Button variant="outline" size="icon" asChild>
                <label>
                  <Upload className="h-4 w-4" />
                  <input
                    type="file"
                    accept=".json"
                    onChange={loadPreset}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Load a preset to apply styles to selected text
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 