"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CertificateDesignerController } from "@/hooks/useCertificateDesigner";
import { CanvasPreview } from "@/components/certificate-designer/CanvasPreview";
import { TextElementEditor } from "@/components/certificate-designer/TextElementEditor";
import { CertificateControls } from "@/components/certificate-designer/CertificateControls";
import { Download } from "lucide-react";
import { shouldIgnoreDesignerKeyboardTarget } from "@/lib/designer-keyboard";
import { AutosaveStatus } from "@/components/AutosaveStatus";

export function CertificateDesigner(
  props: CertificateDesignerController & { wizardFooter?: ReactNode }
) {
  const { wizardFooter, ...designer } = props;
  const {
    imageUrl,
    textElements,
    selectedElement,
    handleElementUpdate,
    handleElementRemove,
    handleElementSelect,
    handleAddTextElement,
    canvasPreviewProps,
    certificatePreviewProps,
    loadPreset,
  } = designer;

  const { attendees, previewIndex, onPreviewChange, onDownload } = certificatePreviewProps;
  const previewingName = attendees[previewIndex] ?? "Attendee Name";

  const hasNamePlaceholder = textElements.some((el) => el.type === "name");
  const selectedTextElement =
    selectedElement != null ? textElements.find((el) => el.id === selectedElement) : undefined;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (shouldIgnoreDesignerKeyboardTarget(e.target)) return;

      if (e.key === "Escape") {
        if (selectedElement == null) return;
        e.preventDefault();
        handleElementSelect(null);
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElement == null) return;
        e.preventDefault();
        handleElementRemove();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedElement, handleElementRemove, handleElementSelect]);

  return (
    <Card className="mb-8">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1.5">
            <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-semibold">
              Design your certificate
            </CardTitle>
            <CardDescription className="text-sm sm:text-base lg:text-lg text-muted-foreground font-light ">
            Click an element type, then click the canvas to place it.
            </CardDescription>
          </div>
          <AutosaveStatus />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4 min-w-0">
            <div className="border rounded-md p-3 sm:p-4 bg-muted/20">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                <div className="space-y-1 min-w-0">
                  <h3 className="text-lg font-medium">Previewing: {previewingName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Drag elements to position them on your certificate
                  </p>
                </div>
                {attendees.length > 0 && (
                  <div className="grid w-full max-w-sm shrink-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:max-w-none sm:items-center sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => onPreviewChange(Math.max(0, previewIndex - 1))}
                      disabled={previewIndex === 0}
                      className="w-full sm:w-auto"
                    >
                      Previous
                    </Button>
                    <span className="col-span-2 text-center text-sm tabular-nums sm:col-auto sm:text-left">
                      {previewIndex + 1} of {attendees.length}
                    </span>
                    <Button
                      size="sm"
                      type="button"
                      onClick={() =>
                        onPreviewChange(Math.min(attendees.length - 1, previewIndex + 1))
                      }
                      disabled={previewIndex === attendees.length - 1}
                      className="w-full sm:w-auto"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>

              <CanvasPreview {...canvasPreviewProps} />
            </div>

            {attendees.length > 0 && hasNamePlaceholder && (
              <div className="flex justify-stretch sm:justify-end">
                <Button type="button" onClick={onDownload} className="w-full sm:w-auto font-semibold">
                  <Download className="mr-2 h-4 w-4" />
                  Download This Certificate
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4 min-w-0">
            <CertificateControls
              onAddTextElement={handleAddTextElement}
              textElements={textElements}
              imageUrl={imageUrl}
              onLoadPreset={loadPreset}
            />

            {selectedTextElement ? (
              <TextElementEditor
                element={selectedTextElement}
                onUpdate={handleElementUpdate}
                onRemove={handleElementRemove}
              />
            ) : null}
          </div>
        </div>
      </CardContent>
      {wizardFooter ? (
        <CardFooter className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          {wizardFooter}
        </CardFooter>
      ) : null}
    </Card>
  );
}
