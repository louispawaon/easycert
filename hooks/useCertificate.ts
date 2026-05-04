"use client";

import { useCallback, useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { easyCertDb } from "@/lib/db/easycert-db";
import { saveCertificateImage } from "@/lib/db/app-state";

/**
 * Keeps certificate template URL in sync with IndexedDB while allowing the
 * upload panel to broadcast the data URL immediately (before the DB write
 * completes), so the designer canvas updates in the same frame as the upload UI.
 */
export function useCertificateImage() {
  const row = useLiveQuery(() => easyCertDb.appState.get("default"));
  const rowUrl = row?.certificateImageUrl ?? null;

  /** `undefined` = no in-flight override; otherwise mirror upload/clear until DB matches */
  const [pendingUrl, setPendingUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const onUpload = (e: Event) => {
      const url = (e as CustomEvent<{ imageUrl: string }>).detail.imageUrl;
      setPendingUrl(url);
    };
    const onClear = () => setPendingUrl(null);
    window.addEventListener("certificate-image-uploaded", onUpload);
    window.addEventListener("certificate-image-cleared", onClear);
    return () => {
      window.removeEventListener("certificate-image-uploaded", onUpload);
      window.removeEventListener("certificate-image-cleared", onClear);
    };
  }, []);

  useEffect(() => {
    if (pendingUrl === undefined) return;
    if (pendingUrl !== null && rowUrl === pendingUrl) setPendingUrl(undefined);
    if (pendingUrl === null && rowUrl === null) setPendingUrl(undefined);
  }, [rowUrl, pendingUrl]);

  const imageUrl = pendingUrl !== undefined ? pendingUrl : rowUrl;

  const setImageUrl = useCallback((url: string | null) => {
    if (url) {
      window.dispatchEvent(
        new CustomEvent("certificate-image-uploaded", { detail: { imageUrl: url } })
      );
    } else {
      window.dispatchEvent(new CustomEvent("certificate-image-cleared"));
    }
    void saveCertificateImage(url);
  }, []);

  return { imageUrl, setImageUrl };
}
