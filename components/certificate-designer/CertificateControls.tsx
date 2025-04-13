"use client";

import { Button } from "@/components/ui/button";
import { Plus, Upload, Loader2 } from "lucide-react";
import { TextElement } from "@/types/types";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

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

  const loadPreset = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
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

          // Reset the file input and close dialog
          e.target.value = '';
          setDialogOpen(false);
        } catch (error) {
          console.error('Error parsing preset:', error);
          toast({
            title: "Error",
            description: "Invalid preset file format.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
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
      setIsLoading(false);
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
            disabled={!imageUrl}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Name Placeholder
          </Button>
          <Button 
            onClick={() => onAddTextElement('static')} 
            className="w-full justify-start"
            variant="outline"
            disabled={!imageUrl}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Static Text
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
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <div className="relative">
                      <Input
                        id="preset-file"
                        type="file"
                        accept=".json"
                        onChange={loadPreset}
                        className="cursor-pointer"
                        disabled={isLoading}
                      />
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Choose a preset file to apply its properties to the selected text
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