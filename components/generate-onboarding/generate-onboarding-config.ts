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
    targetElementId: "easycert-onboarding-certificate-upload",
    title: "Add your certificate picture",
    description:
      "Upload an image of your blank certificate (PNG or JPG works well). This picture is the background for every person’s certificate.",
  },
  {
    id: "upload-attendees",
    wizardStep: 0,
    targetElementId: "easycert-onboarding-attendee-upload",
    title: "Add the list of names",
    description:
      "Type or paste one name per line, or upload a simple text file. These names are who will receive a certificate.",
  },
  {
    id: "upload-next",
    wizardStep: 0,
    targetElementId: "easycert-onboarding-wizard-nav",
    title: "Move on when both are ready",
    description:
      "When your picture and name list are in place, press Next to go to the design step. You can always come back with the Back button.",
  },
  {
    id: "design-canvas",
    wizardStep: 1,
    targetElementId: "easycert-onboarding-design-canvas",
    title: "Place text on the certificate",
    description:
      "Use the buttons on the right to add a name field or other text, then click on the picture where you want it. Drag the text to adjust position.",
  },
  {
    id: "design-controls",
    wizardStep: 1,
    targetElementId: "easycert-onboarding-design-controls",
    title: "Choose what to add",
    description:
      "Add a “name” field so each person’s certificate shows their own name. You can add extra text for dates, titles, or other wording.",
  },
  {
    id: "design-sidebar",
    wizardStep: 1,
    targetElementId: "easycert-onboarding-design-sidebar",
    title: "Fine-tune the look",
    description:
      "Click a text box on the certificate to open styling options here—fonts, size, color, and more. Use the arrows above to preview different names.",
  },
  {
    id: "generate-summary",
    wizardStep: 2,
    targetElementId: "easycert-onboarding-generate-summary",
    title: "Quick checklist",
    description:
      "This area shows whether your template, names, and name fields are ready. All set means you can download everyone’s files.",
  },
  {
    id: "generate-options",
    wizardStep: 2,
    targetElementId: "easycert-onboarding-generate-options",
    title: "File name and PDF page size",
    description:
      "Pick a base file name for downloads. For PDFs, choose a page size that matches how you will print or share.",
  },
  {
    id: "generate-export",
    wizardStep: 2,
    targetElementId: "easycert-onboarding-generate-export",
    title: "Create all certificates",
    description:
      "PNG/ZIP gives you one image per person. PDF puts many certificates in one file. Large lists may take a minute—stay on this page until it finishes.",
  },
];

export function substepsForWizardStep(wizardStep: WizardStepIndex): OnboardingSubstep[] {
  return GENERATE_ONBOARDING_SUBSTEPS.filter((s) => s.wizardStep === wizardStep);
}
