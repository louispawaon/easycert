import { create } from "zustand";

/** `undefined` = no optimistic override; mirrors prior CustomEvent + useState bridge. */
export type PendingCertificateImageUrl = string | null | undefined;

type CertificateImageBridgeState = {
  pendingCertificateImageUrl: PendingCertificateImageUrl;
  notifyCertificateImageUploaded: (imageUrl: string) => void;
  notifyCertificateImageCleared: () => void;
  clearPendingWhenSyncedWithRow: (rowUrl: string | null) => void;
};

export const useCertificateImageBridge = create<CertificateImageBridgeState>((set, get) => ({
  pendingCertificateImageUrl: undefined,

  notifyCertificateImageUploaded: (imageUrl) =>
    set({ pendingCertificateImageUrl: imageUrl }),

  notifyCertificateImageCleared: () => set({ pendingCertificateImageUrl: null }),

  clearPendingWhenSyncedWithRow: (rowUrl) => {
    const pending = get().pendingCertificateImageUrl;
    if (pending === undefined) return;
    if (pending !== null && rowUrl === pending) {
      set({ pendingCertificateImageUrl: undefined });
    }
    if (pending === null && rowUrl === null) {
      set({ pendingCertificateImageUrl: undefined });
    }
  },
}));

/** For non-React modules (e.g. IndexedDB helpers). */
export function notifyCertificateImageUploaded(imageUrl: string) {
  useCertificateImageBridge.getState().notifyCertificateImageUploaded(imageUrl);
}

export function notifyCertificateImageCleared() {
  useCertificateImageBridge.getState().notifyCertificateImageCleared();
}
