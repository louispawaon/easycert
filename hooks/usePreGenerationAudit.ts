"use client";

import { useEffect, useRef, useState } from "react";
import { awaitFontsReady } from "@/lib/canvas/await-fonts";
import {
  computePreGenerationAudit,
  type AuditReport,
} from "@/lib/audit/pre-generation-audit";
import type { ProofLinkElement, TextElement } from "@/types/types";

export type UsePreGenerationAuditArgs = {
  enabled: boolean;
  textElements: TextElement[];
  proofLinkElements: ProofLinkElement[];
  displayLines: string[];
  records: Record<string, string>[] | null;
  headers: string[];
  canvasWidth: number | undefined;
  canvasHeight: number | undefined;
  hasTemplate: boolean;
};

export function usePreGenerationAudit({
  enabled,
  textElements,
  proofLinkElements,
  displayLines,
  records,
  headers,
  canvasWidth,
  canvasHeight,
  hasTemplate,
}: UsePreGenerationAuditArgs): {
  report: AuditReport | null;
  isAuditing: boolean;
} {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runIdRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setReport(null);
      setIsAuditing(false);
      return;
    }

    const runId = ++runIdRef.current;
    setIsAuditing(true);

    const run = async () => {
      try {
        await awaitFontsReady(textElements);

        if (runId !== runIdRef.current) return;

        if (!canvasRef.current) {
          canvasRef.current = document.createElement("canvas");
        }

        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) {
          setReport(null);
          return;
        }

        const nextReport = computePreGenerationAudit({
          ctx,
          textElements,
          proofLinkElements,
          records,
          displayLines,
          headers,
          canvasWidth: canvasWidth ?? 0,
          canvasHeight: canvasHeight ?? 0,
          hasTemplate,
        });

        if (runId !== runIdRef.current) return;
        setReport(nextReport);
      } finally {
        if (runId === runIdRef.current) {
          setIsAuditing(false);
        }
      }
    };

    void run();

    return () => {
      runIdRef.current += 1;
    };
  }, [
    enabled,
    textElements,
    proofLinkElements,
    displayLines,
    records,
    headers,
    canvasWidth,
    canvasHeight,
    hasTemplate,
  ]);

  return { report, isAuditing };
}
