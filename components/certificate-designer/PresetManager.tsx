import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/useToast';
import { TextElement } from "@/types/types";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Only the styling properties we want to save/load
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

interface PresetManagerProps {
  currentConfig: { textElements: TextElement[] };
  onLoadPreset: (properties: TextProperties) => void;
}

export function PresetManager({ currentConfig, onLoadPreset }: PresetManagerProps) {
  const [presetName, setPresetName] = useState('');
  const { toast } = useToast();

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
      // Get properties from the first text element
      const firstElement = currentConfig.textElements[0];
      if (!firstElement) {
        toast({
          title: "Error",
          description: "Please add at least one text element before saving a preset.",
          variant: "destructive",
        });
        return;
      }

      const preset = {
        name: presetName,
        properties: extractTextProperties(firstElement),
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
    } catch (error) {
      console.error('Error saving preset:', error);
      toast({
        title: "Error",
        description: "Failed to save preset. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadPreset = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const preset = JSON.parse(event.target?.result as string);
          
          // Validate the properties
          const properties: TextProperties = {
            fontSize: preset.properties.fontSize ?? 24,
            fontFamily: preset.properties.fontFamily ?? 'Arial',
            color: preset.properties.color ?? '#000000',
            fontWeight: preset.properties.fontWeight ?? 'normal',
            fontStyle: preset.properties.fontStyle ?? 'normal',
            textDecoration: preset.properties.textDecoration ?? 'none',
            textAlign: preset.properties.textAlign ?? 'left',
            lineHeight: preset.properties.lineHeight ?? 1.2,
          };

          onLoadPreset(properties);
          toast({
            title: "Success",
            description: `Preset "${preset.name}" loaded successfully!`,
          });
        } catch (error) {
          console.error('Error loading preset:', error);
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
    <div className="flex flex-col gap-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            Save as Preset
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

      <div className="flex flex-col gap-2">
        <Input
          type="file"
          accept=".json"
          onChange={loadPreset}
          className="w-full cursor-pointer"
          placeholder="Load Preset"
        />
        <p className="text-sm text-muted-foreground">
          Upload a preset file to apply its properties
        </p>
      </div>
    </div>
  );
} 