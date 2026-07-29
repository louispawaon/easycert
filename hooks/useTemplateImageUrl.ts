"use client";

import { useCallback, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { dittoDb } from "@/lib/db/ditto-db";
import { saveTemplateImage } from "@/lib/db/app-state";
import {
  notifyTemplateImageCleared,
  notifyTemplateImageUploaded,
  useTemplateImageBridge,
} from "@/store/template-image-bridge";

export function useTemplateImageUrl() {
  const row = useLiveQuery(() => dittoDb.appState.get("default"));
  const rowUrl = row?.templateImageUrl ?? null;

  const pendingUrl = useTemplateImageBridge((s) => s.pendingTemplateImageUrl);

  useEffect(() => {
    useTemplateImageBridge.getState().clearPendingWhenSyncedWithRow(rowUrl);
  }, [rowUrl, pendingUrl]);

  const imageUrl = pendingUrl !== undefined ? pendingUrl : rowUrl;

  const setImageUrl = useCallback((url: string | null) => {
    if (url) {
      notifyTemplateImageUploaded(url);
    } else {
      notifyTemplateImageCleared();
    }
    void saveTemplateImage(url);
  }, []);

  return { imageUrl, setImageUrl };
}
