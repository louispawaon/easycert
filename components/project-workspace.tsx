"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { FileUpload } from "@/components/file-upload/index";
import { CertificateDesigner } from "@/components/certificate-designer/index";
import { CertificateGenerator } from "@/components/certificate-designer/CertificateGenerator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GenerateStepWizard } from "@/components/generate-step-wizard";
import { useCertificateDesigner } from "@/hooks/useCertificateDesigner";
import { useDesignerUiStore, type WizardStepIndex } from "@/store/designer-ui-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import {
  applyImportedAppState,
  loadAppState,
  saveWizardStep,
  stashCurrentProjectAsRecovery,
} from "@/lib/db/app-state";
import { easyCertDb, type AppStateRecord } from "@/lib/db/easycert-db";
import { isRestorableProject } from "@/lib/db/session-utils";
import { readFileAsUtf8, downloadEasycertFile } from "@/lib/project/easycert-file";
import { Download, Upload } from "lucide-react";

export function ProjectWorkspace() {
  const designer = useCertificateDesigner();
  const wizardStep = useDesignerUiStore((s) => s.wizardStep);
  const setWizardStep = useDesignerUiStore((s) => s.setWizardStep);
  const hasHydratedWizardStepRef = useRef(false);
  const appRow = useLiveQuery(() => easyCertDb.appState.get("default"));

  const [mountKey, setMountKey] = useState(0);
  const [headerActionsEl, setHeaderActionsEl] = useState<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [overwriteOpen, setOverwriteOpen] = useState(false);
  const pendingAppRef = useRef<AppStateRecord | null>(null);

  const bumpMount = () => setMountKey((k) => k + 1);

  const { imageUrl, attendeesCount, namePlaceholdersCount } = designer;

  const canAdvanceFromUpload = Boolean(imageUrl) && attendeesCount > 0;
  const canAdvanceFromDesign =
    Boolean(imageUrl) && attendeesCount > 0 && namePlaceholdersCount > 0;

  const canGoNext = useMemo(() => {
    if (wizardStep === 0) return canAdvanceFromUpload;
    if (wizardStep === 1) return canAdvanceFromDesign;
    return false;
  }, [wizardStep, canAdvanceFromUpload, canAdvanceFromDesign]);

  const handleBack = useCallback(() => {
    if (wizardStep === 0) return;
    setWizardStep((wizardStep - 1) as WizardStepIndex);
  }, [wizardStep, setWizardStep]);

  const handleNext = useCallback(() => {
    if (!canGoNext || wizardStep >= 2) return;
    setWizardStep((wizardStep + 1) as WizardStepIndex);
  }, [canGoNext, wizardStep, setWizardStep]);

  const handleExport = useCallback(async () => {
    try {
      const row = await loadAppState();
      if (!row || !isRestorableProject(row)) {
        toast({
          title: "Nothing to export",
          description: "Add a template, attendees, or text before exporting.",
          variant: "destructive",
        });
        return;
      }
      downloadEasycertFile(row, "easycert-project");
      toast({
        title: "Project exported",
        description: "Your .easycert file has been downloaded.",
      });
    } catch (e) {
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [toast]);

  const runImport = useCallback(
    async (app: AppStateRecord) => {
      try {
        await applyImportedAppState(app);
        bumpMount();
        setWizardStep(0);
        toast({
          title: "Project imported",
          description: "Your workspace has been updated.",
        });
      } catch (e) {
        toast({
          title: "Import failed",
          description: e instanceof Error ? e.message : "Unknown error",
          variant: "destructive",
        });
      }
    },
    [toast, setWizardStep]
  );

  const finishImportIfNeeded = useCallback(
    async (app: AppStateRecord) => {
      const current = await loadAppState();
      if (isRestorableProject(current)) {
        pendingAppRef.current = app;
        setOverwriteOpen(true);
        return;
      }
      await runImport(app);
    },
    [runImport]
  );

  const onFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".easycert") && !lower.endsWith(".json")) {
        toast({
          title: "Unsupported file",
          description: "Choose a .easycert file (or a legacy backup .json).",
          variant: "destructive",
        });
        return;
      }
      const parsed = await readFileAsUtf8(file);
      if (!parsed.ok) {
        toast({ title: "Invalid file", description: parsed.error, variant: "destructive" });
        return;
      }
      await finishImportIfNeeded(parsed.app);
    },
    [finishImportIfNeeded, toast]
  );

  const wizardStepNav = (
    <>
      <Button type="button" variant="outline" disabled={wizardStep === 0} onClick={handleBack}>
        Back
      </Button>
      {wizardStep < 2 ? (
        <Button type="button" disabled={!canGoNext} onClick={handleNext}>
          Next
        </Button>
      ) : null}
    </>
  );

  const confirmOverwrite = useCallback(async () => {
    const app = pendingAppRef.current;
    pendingAppRef.current = null;
    setOverwriteOpen(false);
    if (!app) return;
    try {
      await stashCurrentProjectAsRecovery();
    } catch (e) {
      console.error(e);
    }
    await runImport(app);
  }, [runImport]);

  useEffect(() => {
    setHeaderActionsEl(document.getElementById("generate-header-actions"));
  }, []);

  useEffect(() => {
    if (appRow === undefined || hasHydratedWizardStepRef.current) return;
    const persisted = appRow.wizardStep;
    const nextStep: WizardStepIndex =
      persisted === 0 || persisted === 1 || persisted === 2 ? persisted : 0;
    setWizardStep(nextStep);
    hasHydratedWizardStepRef.current = true;
  }, [appRow, setWizardStep]);

  useEffect(() => {
    if (!hasHydratedWizardStepRef.current) return;
    void saveWizardStep(wizardStep);
  }, [wizardStep]);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".easycert,.json,application/json"
        onChange={onFileSelected}
      />
      {headerActionsEl
        ? createPortal(
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import .easycert
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => void handleExport()}
              >
                <Download className="h-4 w-4 mr-2" />
                Export .easycert
              </Button>
            </>,
            headerActionsEl
          )
        : null}

      <Dialog
        open={overwriteOpen}
        onOpenChange={(open) => {
          if (!open) pendingAppRef.current = null;
          setOverwriteOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace current project?</DialogTitle>
            <DialogDescription>
              This will replace your current project. Your previous work will be saved so you can restore it later.            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                pendingAppRef.current = null;
                setOverwriteOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void confirmOverwrite()}>
              Replace and import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div key={mountKey} className="grid gap-8">
        <div className="w-full">
          <GenerateStepWizard currentStepIndex={wizardStep} />
        </div>

        {wizardStep === 0 ? <FileUpload wizardFooter={wizardStepNav} /> : null}

        {wizardStep === 1 ? <CertificateDesigner {...designer} wizardFooter={wizardStepNav} /> : null}

        {wizardStep === 2 ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-semibold">Generate Certificates</CardTitle>
              <CardDescription className="text-sm sm:text-base lg:text-lg text-muted-foreground font-light">
                Generate certificates for all attendees in your list
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CertificateGenerator
                imageUrl={designer.imageUrl}
                attendeesCount={designer.attendeesCount}
                textElementsCount={designer.textElementsCount}
                namePlaceholdersCount={designer.namePlaceholdersCount}
                isGenerating={designer.isGenerating}
                pageSize={designer.pageSize}
                onPageSizeChange={designer.setPageSize}
                onGenerate={designer.generateCertificates}
                onGeneratePDF={designer.generateCertificatesPDF}
                onPrint={designer.printCertificates}
              />
            </CardContent>
            <CardFooter className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
              {wizardStepNav}
            </CardFooter>
          </Card>
        ) : null}
      </div>
    </>
  );
}
