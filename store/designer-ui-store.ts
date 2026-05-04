import { create } from "zustand";

type DesignerUiState = {
  selectedElement: string | null;
  isGenerating: boolean;
  previewIndex: number;
  activeTab: string;
  setSelectedElement: (id: string | null) => void;
  setIsGenerating: (value: boolean) => void;
  setPreviewIndex: (value: number | ((prev: number) => number)) => void;
  setActiveTab: (tab: string) => void;
  reset: () => void;
};

const initial = {
  selectedElement: null as string | null,
  isGenerating: false,
  previewIndex: 0,
  activeTab: "design",
};

export const useDesignerUiStore = create<DesignerUiState>((set) => ({
  ...initial,

  setSelectedElement: (id) => set({ selectedElement: id }),

  setIsGenerating: (value) => set({ isGenerating: value }),

  setPreviewIndex: (value) =>
    set((s) => ({
      previewIndex: typeof value === "function" ? (value as (p: number) => number)(s.previewIndex) : value,
    })),

  setActiveTab: (tab) => set({ activeTab: tab }),

  reset: () => set(initial),
}));
