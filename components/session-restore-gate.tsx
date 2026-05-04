"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { loadAppState, discardActiveSessionToRecovery } from "@/lib/db/app-state";
import {
  isRestorableProject,
  downloadProjectBackup,
} from "@/lib/db/session-utils";

type GatePhase = "checking" | "prompt" | "ready";

export function SessionRestoreGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<GatePhase>("checking");
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof loadAppState>>>(undefined);
  /** Bumped on Strict Mode effect cleanup so stale async work does not skip the only setPhase. */
  const loadGeneration = useRef(0);

  useEffect(() => {
    const myGen = ++loadGeneration.current;
    (async () => {
      try {
        const row = await loadAppState();
        if (myGen !== loadGeneration.current) return;
        if (isRestorableProject(row)) {
          setSnapshot(row);
          setPhase("prompt");
        } else {
          setPhase("ready");
        }
      } catch {
        if (myGen !== loadGeneration.current) return;
        setPhase("ready");
      }
    })();
    return () => {
      loadGeneration.current++;
    };
  }, []);

  const handleRestore = useCallback(() => {
    setPhase("ready");
  }, []);

  const handleDownloadOnly = useCallback(() => {
    if (snapshot) downloadProjectBackup(snapshot);
  }, [snapshot]);

  const handleStartFresh = useCallback(async () => {
    if (!snapshot) {
      setPhase("ready");
      return;
    }
    downloadProjectBackup(snapshot);
    try {
      await discardActiveSessionToRecovery(snapshot);
    } catch (e) {
      console.error(e);
    }
    setPhase("ready");
  }, [snapshot]);

  if (phase === "checking") {
    return (
      <div className="grid gap-8" aria-busy="true">
        <div className="rounded-md border border-dashed p-12 text-center text-sm text-muted-foreground">
          Loading your workspace…
        </div>
      </div>
    );
  }

  return (
    <>
      <Dialog open={phase === "prompt"} onOpenChange={() => {}}>
        <DialogContent
          className="[&>button]:hidden sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Restore session?</DialogTitle>
            <DialogDescription className="text-left space-y-2">
              <span className="block">
                We found a saved certificate project in this browser. You can continue where you
                left off, or start fresh.
              </span>
              <span className="block text-foreground">
                If you start fresh, we keep a backup in IndexedDB and download a JSON file so you
                don&apos;t lose your work.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button type="button" className="w-full" onClick={handleRestore}>
              Restore session
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleDownloadOnly}
            >
              Download backup only
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => void handleStartFresh()}
            >
              Start fresh (download + backup, then clear)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {phase === "ready" ? children : null}
    </>
  );
}
