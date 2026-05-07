"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useToast } from "@/hooks/useToast";
import { easyCertDb } from "@/lib/db/easycert-db";
import { saveTextElements } from "@/lib/db/app-state";
import type { TextElement } from "@/types/types";

export function useDesignerTextPersistence() {
  const { toast } = useToast();
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const appStateRow = useLiveQuery(() => easyCertDb.appState.get("default"));
  const lastSyncedSavedAtRef = useRef<number | null>(null);
  const skipNextTextElementsPersist = useRef(true);
  const debounceTimerRef = useRef<number | null>(null);
  const dirtyTextRef = useRef(false);
  const textElementsRef = useRef<TextElement[]>(textElements);
  textElementsRef.current = textElements;

  const persistError = useCallback(
    (err: unknown, context: string) => {
      dirtyTextRef.current = true;
      console.error("[useDesignerTextPersistence]", context, err);
      toast({
        title: "Couldn’t save design",
        description: "Your certificate layout may not be saved. Keep this tab open and try editing again.",
        variant: "destructive",
      });
    },
    [toast]
  );

  useEffect(() => {
    if (appStateRow === undefined) return;
    const rowSavedAt = appStateRow.savedAt ?? null;
    if (lastSyncedSavedAtRef.current === rowSavedAt) return;
    if (dirtyTextRef.current) return;
    lastSyncedSavedAtRef.current = rowSavedAt;
    setTextElements(appStateRow.textElements ?? []);
    skipNextTextElementsPersist.current = true;
  }, [appStateRow]);
  
  useEffect(() => {
    if (appStateRow === undefined) return;
    if (skipNextTextElementsPersist.current) {
      skipNextTextElementsPersist.current = false;
      return;
    }
    dirtyTextRef.current = true;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      void saveTextElements(textElementsRef.current)
        .then(() => {
          dirtyTextRef.current = false;
        })
        .catch((err: unknown) => persistError(err, "debounced-save"));
    }, 400);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [textElements, persistError]);

  useEffect(() => {
    const flush = () => {
      if (document.visibilityState !== "hidden") return;
      if (!dirtyTextRef.current) return;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      void saveTextElements(textElementsRef.current)
        .then(() => {
          dirtyTextRef.current = false;
        })
        .catch((err: unknown) => persistError(err, "visibility-flush"));
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, [persistError]);

  return { textElements, setTextElements };
}
