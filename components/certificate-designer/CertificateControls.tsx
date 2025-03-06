"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CertificateControlsProps {
  onAddTextElement: (type: 'name' | 'static') => void;
}

export function CertificateControls({ onAddTextElement }: CertificateControlsProps) {
  return (
    <div className="border rounded-md p-4">
      <h3 className="text-lg font-medium mb-4">Add Elements</h3>
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
    </div>
  );
} 