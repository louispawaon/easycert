"use client";

import { useEffect, useState } from "react";
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
  const { phase, current, total } = progress;
  const isBatchStart = phase === "rendering" && current === 0;
  const [cancelling, setCancelling] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [wasAtStart, setWasAtStart] = useState(isBatchStart);

  if (isBatchStart !== wasAtStart) {
    setWasAtStart(isBatchStart);
    if (isBatchStart) {
      setCancelling(false);
      setStartTime(null);
      setNow(null);
    }
  }

  useEffect(() => {
    if (phase !== "rendering") return;

    let cancelled = false;
    const markStart = (t: number) => {
      if (cancelled) return;
      setStartTime(t);
      setNow(t);
    };

    if (current === 0) {
      const t = Date.now();
      const id = requestAnimationFrame(() => markStart(t));
      return () => {
        cancelled = true;
        cancelAnimationFrame(id);
      };
    }

    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [phase, current]);

  const percent =
    total > 0
      ? Math.min(100, Math.round((current / total) * 100))
      : 0;

  const eta = (() => {
    if (phase !== "rendering") return null;
    if (startTime == null || now == null || current === 0) return null;
    const elapsedMs = now - startTime;
    const perItemMs = elapsedMs / current;
    const remainingMs = perItemMs * (total - current);
    return formatEta(remainingMs / 1000);
  })();

  const handleCancel = () => {
    if (!onCancel || cancelling) return;
    setCancelling(true);
    onCancel();
  };

  const showCancel = phase === "rendering" || phase === "zipping";

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
            <span className="font-semibold text-sm">{phaseLabel(phase)}</span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {current} / {total} ({percent}%)
            </span>
          </div>
          {progress.currentName && phase === "rendering" ? (
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
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={`${percent}% complete, ${current} of ${total} outputs`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-200 ease-out",
            phase === "cancelled" ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
