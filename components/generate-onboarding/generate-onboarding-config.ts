import type { WizardStepIndex } from "@/store/designer-ui-store";

export interface OnboardingSubstep {
  id: string;
  wizardStep: WizardStepIndex;
  /** `document.getElementById` target for spotlight */
  targetElementId: string;
  title: string;
  description: string;
}

export const GENERATE_ONBOARDING_SUBSTEPS: OnboardingSubstep[] = [
  {
    id: "upload-template",
    wizardStep: 0,
    targetElementId: "ditto-onboarding-template-upload",
    title: "Add your design template",
    description:
      "Upload an image of your blank design (PNG or JPG works well). This picture is the background for every personalized output.",
  },
  {
    id: "upload-records",
    wizardStep: 0,
    targetElementId: "ditto-onboarding-record-upload",
    title: "Add records or CSV data",
    description:
      "Paste one value per line, upload a TXT or JSON list, or upload a CSV with a header row. With multiple columns you can choose which fields appear on your outputs in the design step.",
  },
  {
    id: "upload-next",
    wizardStep: 0,
    targetElementId: "ditto-onboarding-wizard-nav",
    title: "Move on when both are ready",
    description:
      "When your template and record list are in place, press Next to go to the design step. You can always come back with the Back button.",
  },
  {
    id: "design-canvas",
    wizardStep: 1,
    targetElementId: "ditto-onboarding-design-canvas",
    title: "Place text on the design",
    description:
      "Use the buttons on the left to add a dynamic text field or other text, then click on the picture where you want it. Drag the text to adjust position.",
  },
  {
    id: "design-controls",
    wizardStep: 1,
    targetElementId: "ditto-onboarding-design-controls",
    title: "Choose what to add",
    description:
      "Pick \"Insert Field from CSV\" to choose which column you place next, or Insert Record Name when you're only using simple lines or a single CSV column.",
  },
  {
    id: "design-properties",
    wizardStep: 1,
    targetElementId: "ditto-onboarding-design-properties",
    title: "Fine-tune the look",
    description:
      "Click a text box on the design to open styling options here—fonts, size, color, and more. Use the arrows above to preview different names.",
  },
  {
    id: "generate-summary",
    wizardStep: 2,
    targetElementId: "ditto-onboarding-generate-summary",
    title: "Quick checklist",
    description:
      "This area shows whether your template, records, and dynamic text fields are ready. All set means you can download everyone's files.",
  },
  {
    id: "generate-options",
    wizardStep: 2,
    targetElementId: "ditto-onboarding-generate-options",
    title: "File name and PDF page size",
    description:
      "Pick a base file name for downloads. For PDFs, choose a page size that matches how you will print or share.",
  },
  {
    id: "generate-export",
    wizardStep: 2,
    targetElementId: "ditto-onboarding-generate-export",
    title: "Create all outputs",
    description:
      "PNG/ZIP gives you one image per person. PDF puts many outputs in one file. Large lists may take a minute—stay on this page until it finishes.",
  },
];

export function substepsForWizardStep(wizardStep: WizardStepIndex): OnboardingSubstep[] {
  return GENERATE_ONBOARDING_SUBSTEPS.filter((s) => s.wizardStep === wizardStep);
}
