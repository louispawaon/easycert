import { create } from "zustand";
import { DEFAULT_PAGE_SIZE, type PageSizeId } from "@/lib/page-size";

type DesignerUiState = {
  selectedElement: string | null;
  isGenerating: boolean;
  previewIndex: number;
  activeTab: string;
  pageSize: PageSizeId;
  setSelectedElement: (id: string | null) => void;
  setIsGenerating: (value: boolean) => void;
  setPreviewIndex: (value: number | ((prev: number) => number)) => void;
  setActiveTab: (tab: string) => void;
  setPageSize: (pageSize: PageSizeId) => void;
  reset: () => void;
};

const initial = {
  selectedElement: null as string | null,
  isGenerating: false,
  previewIndex: 0,
  activeTab: "design",
  pageSize: DEFAULT_PAGE_SIZE,
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

  setPageSize: (pageSize) => set({ pageSize }),

  reset: () => set(initial),
}));
