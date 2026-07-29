import { create } from "zustand";

export type WizardStepIndex = 0 | 1 | 2;

type DesignerUiState = {
  selectedElement: string | null;
  editingElementId: string | null;
  isGenerating: boolean;
  previewIndex: number;
  wizardStep: WizardStepIndex;
  setSelectedElement: (id: string | null) => void;
  setEditingElementId: (id: string | null) => void;
  setIsGenerating: (value: boolean) => void;
  setPreviewIndex: (value: number | ((prev: number) => number)) => void;
  setWizardStep: (step: WizardStepIndex) => void;
  reset: () => void;
};

const initial = {
  selectedElement: null as string | null,
  editingElementId: null as string | null,
  isGenerating: false,
  previewIndex: 0,
  wizardStep: 0 as WizardStepIndex,
};

export const useDesignerUiStore = create<DesignerUiState>((set) => ({
  ...initial,

  setSelectedElement: (id) => set({ selectedElement: id }),

  setEditingElementId: (id) => set({ editingElementId: id }),

  setIsGenerating: (value) => set({ isGenerating: value }),

  setPreviewIndex: (value) =>
    set((s) => ({
      previewIndex: typeof value === "function" ? (value as (p: number) => number)(s.previewIndex) : value,
    })),

  setWizardStep: (wizardStep) => set({ wizardStep }),

  reset: () => set(initial),
}));
