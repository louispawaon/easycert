"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { WizardStepIndex } from "@/store/designer-ui-store";
import { substepsForWizardStep, type OnboardingSubstep } from "./generate-onboarding-config";

const PADDING = 8;

export interface GenerateOnboardingProps {
  open: boolean;
  wizardStep: WizardStepIndex;
  onSkipTour: () => void;
  onFinishedLastGenerateSubstep: () => void;
  onFinishedSegmentSubstep: () => void;
}

function measureTarget(el: HTMLElement | null): { top: number; left: number; width: number; height: number } | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PADDING,
    left: r.left - PADDING,
    width: r.width + PADDING * 2,
    height: r.height + PADDING * 2,
  };
}

export function GenerateOnboarding({
  open,
  wizardStep,
  onSkipTour,
  onFinishedLastGenerateSubstep,
  onFinishedSegmentSubstep,
}: GenerateOnboardingProps) {
  const steps = substepsForWizardStep(wizardStep);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const safeIndex = Math.min(index, Math.max(0, steps.length - 1));
  const current: OnboardingSubstep | undefined = steps[safeIndex];
  const isLast = steps.length > 0 && safeIndex === steps.length - 1;
  const targetElementId = current?.targetElementId;

  const updateRect = useCallback(() => {
    if (!open || !targetElementId) {
      setRect(null);
      return;
    }
    const el = document.getElementById(targetElementId);
    setRect(measureTarget(el));
  }, [open, targetElementId]);

  useLayoutEffect(() => {
    updateRect();
  }, [updateRect, safeIndex, wizardStep]);

  useLayoutEffect(() => {
    if (!open || !targetElementId) return;
    const el = document.getElementById(targetElementId);
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [open, targetElementId, safeIndex]);

  useEffect(() => {
    if (!open || !targetElementId) return;
    const onResize = () => updateRect();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            requestAnimationFrame(updateRect);
          })
        : null;
    const el = document.getElementById(targetElementId);
    if (el && ro) ro.observe(el);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      ro?.disconnect();
    };
  }, [open, targetElementId, updateRect]);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open, wizardStep]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onSkipTour();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onSkipTour]);

  const goBack = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(steps.length - 1, i + 1));

  const handlePrimary = () => {
    if (!isLast) {
      goNext();
      return;
    }
    if (wizardStep === 2) {
      onFinishedLastGenerateSubstep();
    } else {
      onFinishedSegmentSubstep();
    }
  };

  if (!open || !current || steps.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-100 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ditto-onboarding-title"
      aria-describedby="ditto-onboarding-desc"
    >
      {rect ? (
        <div
          className="pointer-events-none fixed z-101 rounded-lg ring-2 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] transition-[top,left,width,height] duration-200 ease-out dark:shadow-[0_0_0_9999px_rgba(0,0,0,0.62)]"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      ) : (
        <div className="pointer-events-none fixed inset-0 z-101 bg-background/75 dark:bg-background/80" />
      )}

      <Card className="pointer-events-auto relative z-102 max-h-[min(90dvh,32rem)] w-full max-w-md overflow-y-auto shadow-lg">
        <CardHeader className="space-y-2 pb-2">
          <p className="text-xs font-medium text-muted-foreground">
            Step {safeIndex + 1} of {steps.length}
          </p>
          <CardTitle id="ditto-onboarding-title" className="text-xl leading-snug">
            {current.title}
          </CardTitle>
          <CardDescription id="ditto-onboarding-desc" className="text-base leading-relaxed">
            {current.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">Press Esc to skip the tour.</p>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={onSkipTour}>
            Skip tour
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={safeIndex === 0} onClick={goBack}>
              Back
            </Button>
            <Button type="button" size="sm" onClick={handlePrimary}>
              {isLast ? (wizardStep === 2 ? "Done" : "Got it") : "Next"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
