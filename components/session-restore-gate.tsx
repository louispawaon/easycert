"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  const [dismissedPrompt, setDismissedPrompt] = useState(false);

  const { data, isPending, isError } = useQuery({
    queryKey: ["easycert", "session-restore"],
    queryFn: loadAppState,
    staleTime: Infinity,
  });

  const restorable = !!(data && isRestorableProject(data));

  const phase = useMemo<GatePhase>(() => {
    if (isPending) return "checking";
    if (isError || !restorable || dismissedPrompt) return "ready";
    return "prompt";
  }, [isPending, isError, restorable, dismissedPrompt]);

  const snapshot = phase === "prompt" && data ? data : undefined;

  const handleRestore = useCallback(() => {
    setDismissedPrompt(true);
  }, []);

  const handleDownloadOnly = useCallback(() => {
    if (snapshot) downloadProjectBackup(snapshot);
  }, [snapshot]);

  const handleStartFresh = useCallback(async () => {
    if (!snapshot) {
      setDismissedPrompt(true);
      return;
    }
    downloadProjectBackup(snapshot);
    try {
      await discardActiveSessionToRecovery(snapshot);
    } catch (e) {
      console.error(e);
    }
    setDismissedPrompt(true);
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
