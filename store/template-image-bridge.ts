import { create } from "zustand";

/** `undefined` = no optimistic override; mirrors prior CustomEvent + useState bridge. */
export type PendingTemplateImageUrl = string | null | undefined;

type TemplateImageBridgeState = {
  pendingTemplateImageUrl: PendingTemplateImageUrl;
  notifyTemplateImageUploaded: (imageUrl: string) => void;
  notifyTemplateImageCleared: () => void;
  clearPendingWhenSyncedWithRow: (rowUrl: string | null) => void;
};

export const useTemplateImageBridge = create<TemplateImageBridgeState>((set, get) => ({
  pendingTemplateImageUrl: undefined,

  notifyTemplateImageUploaded: (imageUrl) =>
    set({ pendingTemplateImageUrl: imageUrl }),

  notifyTemplateImageCleared: () => set({ pendingTemplateImageUrl: null }),

  clearPendingWhenSyncedWithRow: (rowUrl) => {
    const pending = get().pendingTemplateImageUrl;
    if (pending === undefined) return;
    if (pending !== null && rowUrl === pending) {
      set({ pendingTemplateImageUrl: undefined });
    }
    if (pending === null && rowUrl === null) {
      set({ pendingTemplateImageUrl: undefined });
    }
  },
}));

/** For non-React modules (e.g. IndexedDB helpers). */
export function notifyTemplateImageUploaded(imageUrl: string) {
  useTemplateImageBridge.getState().notifyTemplateImageUploaded(imageUrl);
}

export function notifyTemplateImageCleared() {
  useTemplateImageBridge.getState().notifyTemplateImageCleared();
}
