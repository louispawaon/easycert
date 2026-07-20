"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { FileUpload } from "@/components/file-upload/index";
import { DesignEditor } from "@/components/design-editor/index";
import { GenerateEditorShell } from "@/components/design-editor/generate-editor-shell";
import { Button } from "@/components/ui/button";
import { GenerateStepWizard } from "@/components/generate-step-wizard";
import { useDesignerController } from "@/hooks/useDesignerController";
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
  resetDefaultProject,
  saveWizardStep,
  SESSION_LEGACY_FONTS_PARSE_FAILED_KEY,
} from "@/lib/db/app-state";
import { dittoDb, type AppStateRecord } from "@/lib/db/ditto-db";
import { isRestorableProject } from "@/lib/db/session-utils";
import { readFileAsUtf8, downloadProjectFile } from "@/lib/project/ditto-file";
import {
  readGenerateOnboardingStatus,
  writeGenerateOnboardingStatus,
} from "@/lib/generate-onboarding-storage";
import { MOBILE_GENERATE_RECOMMENDATION_DISMISSED_EVENT } from "@/lib/generate-onboarding-events";
import { MOBILE_GENERATE_RECOMMENDATION_SESSION_KEY } from "@/components/mobile-generate-recommendation-dialog";
import { GenerateOnboarding } from "@/components/generate-onboarding/GenerateOnboarding";
import { Footer } from "@/components/footer";
import { CirclePlus, ChevronDown, Download, FolderOpen, HelpCircle, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MOBILE_MQ = "(max-width: 767px)";

function mobileRecommendationDismissed(): boolean {
  try {
    return sessionStorage.getItem(MOBILE_GENERATE_RECOMMENDATION_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function canAutoStartOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia(MOBILE_MQ);
  if (mq.matches) return mobileRecommendationDismissed();
  return true;
}

export function ProjectWorkspace() {
  const [mountKey, setMountKey] = useState(0);
  const designer = useDesignerController(mountKey);
  const wizardStep = useDesignerUiStore((s) => s.wizardStep);
  const setWizardStep = useDesignerUiStore((s) => s.setWizardStep);
  const hasHydratedWizardStepRef = useRef(false);
  const appRow = useLiveQuery(() => dittoDb.appState.get("default"));

  const [headerActionsEl, setHeaderActionsEl] = useState<HTMLElement | null>(null);
  const [wizardEl, setWizardEl] = useState<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [overwriteOpen, setOverwriteOpen] = useState(false);
  const [startNewOpen, setStartNewOpen] = useState(false);
  const pendingAppRef = useRef<AppStateRecord | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingRemountKey, setOnboardingRemountKey] = useState(0);
  const pendingReopenAfterWizardRef = useRef(false);
  const prevWizardStepForTourRef = useRef(wizardStep);

  const bumpMount = useCallback(() => setMountKey((k) => k + 1), []);

  const { imageUrl, recordsCount, dynamicTextElementsCount } = designer;

  const canAdvanceFromUpload = Boolean(imageUrl) && recordsCount > 0;
  const canAdvanceFromDesign =
    Boolean(imageUrl) && recordsCount > 0 && dynamicTextElementsCount > 0;

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
          description: "Add a template, records, or text before exporting.",
          variant: "destructive",
        });
        return;
      }
      downloadProjectFile(row, "ditto-project");
      toast({
        title: "Project exported",
        description: "Your project file has been downloaded.",
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
    [toast, setWizardStep, bumpMount]
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
      if (!lower.endsWith(".ditto") && !lower.endsWith(".easycert") && !lower.endsWith(".json")) {
        toast({
          title: "Unsupported file",
          description: "Choose a .ditto or .easycert project file (or a legacy backup .json).",
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

  const wizardBackButton = (
    <Button type="button" variant="outline" size="sm" disabled={wizardStep === 0} onClick={handleBack}>
      Back
    </Button>
  );

  const wizardNextButton =
    wizardStep < 2 ? (
      <Button type="button" size="sm" disabled={!canGoNext} onClick={handleNext}>
        Next
      </Button>
    ) : null;

  const confirmOverwrite = useCallback(async () => {
    const app = pendingAppRef.current;
    pendingAppRef.current = null;
    setOverwriteOpen(false);
    if (!app) return;
    await runImport(app);
  }, [runImport]);

  const confirmStartNew = useCallback(async () => {
    setStartNewOpen(false);
    try {
      await resetDefaultProject();
      bumpMount();
      setWizardStep(0);
      toast({
        title: "New project",
        description: "Your workspace has been cleared.",
      });
    } catch (e) {
      toast({
        title: "Could not reset",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [bumpMount, setWizardStep, toast]);

  useEffect(() => {
    setHeaderActionsEl(document.getElementById("generate-header-actions"));
    setWizardEl(document.getElementById("generate-step-wizard"));
  }, []);

  useEffect(() => {
    const tryOpen = () => {
      if (readGenerateOnboardingStatus()) return;
      if (!canAutoStartOnboarding()) return;
      setOnboardingOpen(true);
    };
    tryOpen();
    window.addEventListener(MOBILE_GENERATE_RECOMMENDATION_DISMISSED_EVENT, tryOpen);
    return () => window.removeEventListener(MOBILE_GENERATE_RECOMMENDATION_DISMISSED_EVENT, tryOpen);
  }, []);

  useEffect(() => {
    const prev = prevWizardStepForTourRef.current;
    prevWizardStepForTourRef.current = wizardStep;
    if (readGenerateOnboardingStatus()) {
      pendingReopenAfterWizardRef.current = false;
      return;
    }
    if (pendingReopenAfterWizardRef.current && prev !== wizardStep) {
      pendingReopenAfterWizardRef.current = false;
      if (canAutoStartOnboarding()) {
        setOnboardingRemountKey((k) => k + 1);
        setOnboardingOpen(true);
      }
    }
  }, [wizardStep]);

  const onSkipTour = useCallback(() => {
    writeGenerateOnboardingStatus("skipped");
    pendingReopenAfterWizardRef.current = false;
    setOnboardingOpen(false);
  }, []);

  const onFinishedLastGenerateSubstep = useCallback(() => {
    writeGenerateOnboardingStatus("done");
    pendingReopenAfterWizardRef.current = false;
    setOnboardingOpen(false);
  }, []);

  const onFinishedSegmentSubstep = useCallback(() => {
    pendingReopenAfterWizardRef.current = true;
    setOnboardingOpen(false);
  }, []);

  const openHowThisWorks = useCallback(() => {
    pendingReopenAfterWizardRef.current = false;
    setOnboardingRemountKey((k) => k + 1);
    setOnboardingOpen(true);
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_LEGACY_FONTS_PARSE_FAILED_KEY) === "1") {
        sessionStorage.removeItem(SESSION_LEGACY_FONTS_PARSE_FAILED_KEY);
        toast({
          title: "Legacy fonts backup couldn’t be migrated",
          description:
            "The old browser backup for custom fonts wasn’t valid JSON. Custom fonts from that backup were skipped.",
          variant: "destructive",
        });
      }
    } catch {
      /* ignore */
    }
  }, [toast]);

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
        accept=".ditto,.easycert,.json,application/json"
        onChange={onFileSelected}
      />
      {wizardEl
        ? createPortal(
            <GenerateStepWizard variant="compact" currentStepIndex={wizardStep} />,
            wizardEl
          )
        : null}

      {headerActionsEl
        ? createPortal(
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 lg:hidden"
                onClick={openHowThisWorks}
                title="How this works"
                aria-label="How this works"
              >
                <HelpCircle className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="hidden h-9 shrink-0 px-2 text-xs underline-offset-4 hover:underline lg:inline-flex lg:text-sm"
                onClick={openHowThisWorks}
                title="How this works"
              >
                How this works
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0 px-2 text-xs lg:px-3 lg:text-sm"
                    aria-label="Project actions"
                    title="Project actions"
                  >
                    <FolderOpen className="h-4 w-4 lg:mr-2" aria-hidden />
                    <span className="hidden lg:inline">Project</span>
                    <ChevronDown className="hidden h-4 w-4 opacity-60 lg:inline" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4" aria-hidden />
                    Import Project
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleExport()}>
                    <Download className="h-4 w-4" aria-hidden />
                    Export Project
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setStartNewOpen(true)}
                  >
                    <CirclePlus className="h-4 w-4" aria-hidden />
                    Start new
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              This replaces your current project in this browser. Export a copy first if you want to keep what you have.
            </DialogDescription>
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

      <Dialog open={startNewOpen} onOpenChange={setStartNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a new project?</DialogTitle>
            <DialogDescription>
              This clears your template, record list, and design from this browser. Use Export if you need a backup first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStartNewOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmStartNew()}>
              Clear and start new
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GenerateOnboarding
        key={`onboarding-${onboardingRemountKey}`}
        open={onboardingOpen}
        wizardStep={wizardStep}
        onSkipTour={onSkipTour}
        onFinishedLastGenerateSubstep={onFinishedLastGenerateSubstep}
        onFinishedSegmentSubstep={onFinishedSegmentSubstep}
      />

      <div className="flex h-full min-h-0 flex-col">
      {wizardStep === 0 ? (
        <FileUpload
          key={`workspace-${mountKey}`}
          className="min-h-0 flex-1"
        />
      ) : null}

      {wizardStep === 1 ? (
        <DesignEditor
          key={`workspace-${mountKey}`}
          {...designer}
          className="min-h-0 flex-1"
        />
      ) : null}

      {wizardStep === 2 ? (
        <GenerateEditorShell
          key={`workspace-${mountKey}`}
          className="min-h-0 flex-1"
          imageUrl={designer.imageUrl}
          recordsCount={designer.recordsCount}
          textElementsCount={designer.textElementsCount}
          dynamicTextElementsCount={designer.dynamicTextElementsCount}
          proofLinkElementsCount={designer.proofLinkElementsCount}
          issuer={designer.issuer}
          isGenerating={designer.isGenerating}
          activeGenerationKind={designer.activeGenerationKind}
          batchProgress={designer.batchProgress}
          onCancel={designer.cancelGeneration}
          outputSettings={designer.outputSettings}
          onOutputSettingsChange={designer.handleOutputSettingsChange}
          onGenerate={designer.generateOutputs}
          auditReport={designer.auditReport}
          isAuditing={designer.isAuditing}
          generationReport={designer.generationReport}
          onDismissReport={designer.dismissGenerationReport}
        />
      ) : null}
      <Footer leading={wizardBackButton} trailing={wizardNextButton} />
      </div>
    </>
  );
}
