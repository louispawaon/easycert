"use client";

import { useCallback, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { easyCertDb } from "@/lib/db/easycert-db";
import { saveCertificateImage } from "@/lib/db/app-state";
import {
  notifyCertificateImageCleared,
  notifyCertificateImageUploaded,
  useCertificateImageBridge,
} from "@/store/certificate-image-bridge";

/**
 * Keeps certificate template URL in sync with IndexedDB while allowing the
 * upload panel to broadcast the data URL immediately (before the DB write
 * completes), so the designer canvas updates in the same frame as the upload UI.
 */
export function useCertificateImage() {
  const row = useLiveQuery(() => easyCertDb.appState.get("default"));
  const rowUrl = row?.certificateImageUrl ?? null;

  const pendingUrl = useCertificateImageBridge((s) => s.pendingCertificateImageUrl);

  useEffect(() => {
    useCertificateImageBridge.getState().clearPendingWhenSyncedWithRow(rowUrl);
  }, [rowUrl, pendingUrl]);

  const imageUrl = pendingUrl !== undefined ? pendingUrl : rowUrl;

  const setImageUrl = useCallback((url: string | null) => {
    if (url) {
      notifyCertificateImageUploaded(url);
    } else {
      notifyCertificateImageCleared();
    }
    void saveCertificateImage(url);
  }, []);

  return { imageUrl, setImageUrl };
}
