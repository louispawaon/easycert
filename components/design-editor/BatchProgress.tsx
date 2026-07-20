"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BatchProgress as BatchProgressType } from "@/lib/batch/batch-engine";
import { cn } from "@/lib/cn";

export interface BatchProgressProps {
  progress: BatchProgressType;
  onCancel?: () => void;
  className?: string;
}

function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "calculating...";
  if (seconds < 60) return `${Math.ceil(seconds)}s remaining`;
  const minutes = Math.floor(seconds / 60);
  const rem = Math.ceil(seconds % 60);
  return rem === 0 ? `${minutes}m remaining` : `${minutes}m ${rem}s remaining`;
}

function phaseLabel(phase: BatchProgressType["phase"]): string {
  switch (phase) {
    case "rendering":
      return "Rendering outputs";
    case "zipping":
      return "Compressing archive";
    case "done":
      return "Done";
    case "cancelled":
      return "Cancelled";
    default:
      return "";
  }
}

export function BatchProgress({ progress, onCancel, className }: BatchProgressProps) {
  const startTimeRef = useRef<number | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const isBatchStart =
      progress.phase === "rendering" && progress.current === 0;
    if (isBatchStart) {
      startTimeRef.current = Date.now();
      setCancelling(false);
    }
  }, [progress.phase, progress.current, progress.total]);

  const percent =
    progress.total > 0
      ? Math.min(100, Math.round((progress.current / progress.total) * 100))
      : 0;

  const eta = (() => {
    if (progress.phase !== "rendering") return null;
    if (!startTimeRef.current || progress.current === 0) return null;
    const elapsedMs = Date.now() - startTimeRef.current;
    const perItemMs = elapsedMs / progress.current;
    const remainingMs = perItemMs * (progress.total - progress.current);
    return formatEta(remainingMs / 1000);
  })();

  const handleCancel = () => {
    if (!onCancel || cancelling) return;
    setCancelling(true);
    onCancel();
  };

  const showCancel = progress.phase === "rendering" || progress.phase === "zipping";

  return (
    <div
      className={cn(
        "rounded-lg border bg-muted/40 p-4 space-y-3",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
            <span className="font-semibold text-sm">{phaseLabel(progress.phase)}</span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {progress.current} / {progress.total} ({percent}%)
            </span>
          </div>
          {progress.currentName && progress.phase === "rendering" ? (
            <p className="text-xs text-muted-foreground truncate">
              Generating for{" "}
              <span className="font-medium text-foreground">{progress.currentName}</span>
            </p>
          ) : null}
          {eta ? (
            <p className="text-xs text-muted-foreground">{eta}</p>
          ) : null}
        </div>

        {showCancel && onCancel ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <X className="mr-1.5 h-3 w-3" />
                Cancel
              </>
            )}
          </Button>
        ) : null}
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-label="Batch progress"
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.current}
        aria-valuetext={`${percent}% complete, ${progress.current} of ${progress.total} outputs`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-200 ease-out",
            progress.phase === "cancelled" ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
