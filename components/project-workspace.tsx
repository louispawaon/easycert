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
  resetDefaultProject,
  saveWizardStep,
  SESSION_LEGACY_FONTS_PARSE_FAILED_KEY,
} from "@/lib/db/app-state";
import { easyCertDb, type AppStateRecord } from "@/lib/db/easycert-db";
import { isRestorableProject } from "@/lib/db/session-utils";
import { readFileAsUtf8, downloadEasycertFile } from "@/lib/project/easycert-file";
import {
  readGenerateOnboardingStatus,
  writeGenerateOnboardingStatus,
} from "@/lib/generate-onboarding-storage";
import { MOBILE_GENERATE_RECOMMENDATION_DISMISSED_EVENT } from "@/lib/generate-onboarding-events";
import { MOBILE_GENERATE_RECOMMENDATION_SESSION_KEY } from "@/components/mobile-generate-recommendation-dialog";
import { GenerateOnboarding } from "@/components/generate-onboarding/GenerateOnboarding";
import { GenerateHelpHint } from "@/components/generate-help-hint";
import { CirclePlus, Download, Upload } from "lucide-react";

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
  const [startNewOpen, setStartNewOpen] = useState(false);
  const pendingAppRef = useRef<AppStateRecord | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingRemountKey, setOnboardingRemountKey] = useState(0);
  const pendingReopenAfterWizardRef = useRef(false);
  const prevWizardStepForTourRef = useRef(wizardStep);

  const bumpMount = useCallback(() => setMountKey((k) => k + 1), []);

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

  const wizardStepNav = useMemo(
    () => (
      <div
        id="easycert-onboarding-wizard-nav"
        className="flex w-full flex-wrap items-center justify-between gap-3"
      >
        <Button type="button" variant="outline" disabled={wizardStep === 0} onClick={handleBack}>
          Back
        </Button>
        {wizardStep < 2 ? (
          <Button type="button" disabled={!canGoNext} onClick={handleNext}>
            Next
          </Button>
        ) : null}
      </div>
    ),
    [wizardStep, canGoNext, handleBack, handleNext]
  );

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
        accept=".easycert,.json,application/json"
        onChange={onFileSelected}
      />
      {headerActionsEl
        ? createPortal(
            <>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-9 shrink-0 px-2 text-xs underline-offset-4 hover:underline sm:text-sm"
                onClick={openHowThisWorks}
                title="How this works"
              >
                <span className="sm:hidden">Help</span>
                <span className="hidden sm:inline">How this works</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 shrink-0 px-2 text-xs sm:px-3 sm:text-sm"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Import .easycert project file"
                title="Import .easycert project file"
              >
                <Upload className="h-4 w-4 sm:mr-2" aria-hidden />
                <span className="hidden sm:inline">Import .easycert</span>
                <span className="sm:hidden">Import</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 shrink-0 px-2 text-xs sm:px-3 sm:text-sm"
                onClick={() => void handleExport()}
                aria-label="Export project as .easycert file"
                title="Export .easycert"
              >
                <Download className="h-4 w-4 sm:mr-2" aria-hidden />
                <span className="hidden sm:inline">Export .easycert</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 shrink-0 px-2 text-xs sm:px-3 sm:text-sm"
                onClick={() => setStartNewOpen(true)}
                aria-label="Start a new project"
                title="Start new project"
              >
                <CirclePlus className="h-4 w-4 sm:mr-2" aria-hidden />
                <span className="hidden sm:inline">Start new</span>
                <span className="sm:hidden">New</span>
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
              This replaces your current project in this browser. Export a .easycert copy first if you want to keep what you have.
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
              This clears your template, attendee list, and design from this browser. Use Export if you need a backup first.
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

      <div key={`workspace-${mountKey}`} className="grid min-w-0 gap-8">
        <div className="w-full min-w-0">
          <GenerateStepWizard currentStepIndex={wizardStep} />
        </div>

        {wizardStep === 0 ? (
          <FileUpload wizardFooter={wizardStepNav} />
        ) : null}

        {wizardStep === 1 ? <CertificateDesigner {...designer} wizardFooter={wizardStepNav} /> : null}

        {wizardStep === 2 ? (
          <Card className="mb-8 min-w-0">
            <CardHeader className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <CardTitle className="text-xl font-semibold sm:text-2xl md:text-3xl lg:text-4xl">
                  Generate Certificates
                </CardTitle>
                <GenerateHelpHint label="Help: generate step">
                  <span>
                    When you are ready, download a ZIP of images or one PDF.
                    Large lists may take longer, so keep this tab open until download starts.
                  </span>
                </GenerateHelpHint>
              </div>
              <CardDescription className="text-sm sm:text-base lg:text-lg text-muted-foreground font-light">
                Generate certificates for all attendees in your list
              </CardDescription>
            </CardHeader>
            <CardContent className="min-w-0">
              <CertificateGenerator
                imageUrl={designer.imageUrl}
                attendeesCount={designer.attendeesCount}
                textElementsCount={designer.textElementsCount}
                namePlaceholdersCount={designer.namePlaceholdersCount}
                isGenerating={designer.isGenerating}
                activeGenerationKind={designer.activeGenerationKind}
                batchProgress={designer.batchProgress}
                onCancel={designer.cancelGeneration}
                pageSize={designer.pageSize}
                onPageSizeChange={designer.setPageSize}
                outputFileBaseName={designer.outputFileBaseName}
                onOutputFileBaseNameChange={designer.setOutputFileBaseName}
                onGenerate={designer.generateCertificates}
                onGeneratePDF={designer.generateCertificatesPDF}
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
