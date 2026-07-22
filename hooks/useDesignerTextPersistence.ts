"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useToast } from "@/hooks/useToast";
import { dittoDb } from "@/lib/db/ditto-db";
import { saveDesignElements } from "@/lib/db/app-state";
import type { DesignElement } from "@/types/types";
import { isProofLinkElement } from "@/types/types";
import { normalizeProofLinkSizePct } from "@/lib/canvas/proof-link-render";

function normalizeLoadedDesignElements(elements: DesignElement[]): DesignElement[] {
  return elements.map((el) => {
    if (!isProofLinkElement(el)) return el;
    const sizePct = normalizeProofLinkSizePct(el.sizePct);
    return sizePct === el.sizePct ? el : { ...el, sizePct };
  });
}

export function useDesignerElementPersistence() {
  const { toast } = useToast();
  const [designElements, setDesignElements] = useState<DesignElement[]>([]);
  const appStateRow = useLiveQuery(() => dittoDb.appState.get("default"));
  const lastSyncedSavedAtRef = useRef<number | null>(null);
  const skipNextPersist = useRef(true);
  const debounceTimerRef = useRef<number | null>(null);
  const dirtyRef = useRef(false);
  const saveGenerationRef = useRef(0);
  const elementsRef = useRef<DesignElement[]>(designElements);

  useEffect(() => {
    elementsRef.current = designElements;
  }, [designElements]);

  const persistError = useCallback(
    (err: unknown, context: string) => {
      dirtyRef.current = true;
      console.error("[useDesignerElementPersistence]", context, err);
      toast({
        title: "Couldn't save design",
        description: "Your design layout may not be saved. Keep this tab open and try editing again.",
        variant: "destructive",
      });
    },
    [toast]
  );

  useEffect(() => {
    if (appStateRow === undefined) return;
    const rowSavedAt = appStateRow.savedAt ?? null;
    if (lastSyncedSavedAtRef.current === rowSavedAt) return;
    if (dirtyRef.current) return;
    lastSyncedSavedAtRef.current = rowSavedAt;
    setDesignElements(
      normalizeLoadedDesignElements(appStateRow.designElements ?? appStateRow.textElements ?? [])
    );
    skipNextPersist.current = true;
  }, [appStateRow]);

  const appStateReady = appStateRow !== undefined;

  useEffect(() => {
    if (!appStateReady) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    dirtyRef.current = true;
    saveGenerationRef.current += 1;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      const generationAtSave = saveGenerationRef.current;
      void saveDesignElements(elementsRef.current)
        .then(() => {
          if (saveGenerationRef.current === generationAtSave) {
            dirtyRef.current = false;
          }
        })
        .catch((err: unknown) => persistError(err, "debounced-save"));
    }, 400);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [designElements, persistError, appStateReady]);

  useEffect(() => {
    const flush = () => {
      if (document.visibilityState !== "hidden") return;
      if (!dirtyRef.current) return;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      const generationAtSave = saveGenerationRef.current;
      void saveDesignElements(elementsRef.current)
        .then(() => {
          if (saveGenerationRef.current === generationAtSave) {
            dirtyRef.current = false;
          }
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

  return { designElements, setDesignElements };
}
