"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DEMO_TOTAL_RECORDS,
  DemoBrowserChrome,
  DemoCertificate,
  DemoDataTable,
  DemoVariableInspector,
  PREVIEW_RECORDS,
  fieldMotion,
} from "@/components/landing/demo-mock";
import { Reveal } from "@/components/landing/reveal";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

const AUTO_CYCLE_MS = 3000;
const HIGHLIGHT_MS = 600;

export function LivePreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [highlightFields, setHighlightFields] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const highlightTimeoutRef = useRef<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const record = PREVIEW_RECORDS[activeIndex]!;
  const displayIndex = activeIndex + 1;
  const motionProps = reducedMotion ? {} : fieldMotion;

  const selectRecord = useCallback(
    (index: number) => {
      setActiveIndex(index);
      if (reducedMotion) return;

      setHighlightFields(true);
      if (highlightTimeoutRef.current != null) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightFields(false);
      }, HIGHLIGHT_MS);
    },
    [reducedMotion]
  );

  const goPrev = useCallback(() => {
    selectRecord((activeIndex - 1 + PREVIEW_RECORDS.length) % PREVIEW_RECORDS.length);
  }, [activeIndex, selectRecord]);

  const goNext = useCallback(() => {
    selectRecord((activeIndex + 1) % PREVIEW_RECORDS.length);
  }, [activeIndex, selectRecord]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current != null) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || isPaused) return;

    const id = window.setInterval(() => {
      setActiveIndex((i) => {
        const next = (i + 1) % PREVIEW_RECORDS.length;
        setHighlightFields(true);
        if (highlightTimeoutRef.current != null) {
          window.clearTimeout(highlightTimeoutRef.current);
        }
        highlightTimeoutRef.current = window.setTimeout(() => {
          setHighlightFields(false);
        }, HIGHLIGHT_MS);
        return next;
      });
    }, AUTO_CYCLE_MS);

    return () => window.clearInterval(id);
  }, [reducedMotion, isPaused]);

  return (
    <section id="preview" className="border-y border-border bg-secondary/40 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-subheading text-sm font-semibold uppercase tracking-widest text-primary">
            Live preview
          </p>
          <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            Real data, not{" "}
            <span className="font-mono text-2xl line-through decoration-2 sm:text-3xl">
              {"{{name}}"}
            </span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Click a record or use the arrows. Every bound field updates on the canvas — what you
            see is what you&apos;ll generate.
          </p>
        </Reveal>

        <Reveal className="mt-12 w-full" delay={0.1}>
          <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocusCapture={() => setIsPaused(true)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setIsPaused(false);
              }
            }}
          >
            <DemoBrowserChrome>
              <div className="flex min-h-0 flex-col lg:flex-row">
                <aside className="min-w-0 shrink-0 border-b p-4 lg:w-[280px] lg:border-r lg:border-b-0">
                  <DemoDataTable
                    records={PREVIEW_RECORDS}
                    activeIndex={activeIndex}
                    onSelect={selectRecord}
                  />
                </aside>

                <section className="flex min-w-0 flex-1 flex-col">
                  <div className="flex h-10 shrink-0 items-center justify-center gap-1.5 border-b px-3 lg:h-12">
                    <button
                      type="button"
                      onClick={goPrev}
                      aria-label="Previous record"
                      className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-background transition-colors hover:bg-muted/60"
                    >
                      <ChevronLeft className="size-3.5 text-muted-foreground" aria-hidden />
                    </button>
                    <div className="flex min-w-0 w-36 items-baseline justify-center gap-1 sm:w-44 lg:w-52">
                      <span className="relative min-w-0 flex-1 overflow-hidden text-center">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={record.name}
                            className="block truncate text-xs font-medium lg:text-sm"
                            {...motionProps}
                          >
                            {record.name}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                      <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                        ({displayIndex}/{DEMO_TOTAL_RECORDS})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={goNext}
                      aria-label="Next record"
                      className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <ChevronRight className="size-3.5" aria-hidden />
                    </button>
                  </div>

                  <div className="flex min-h-[280px] items-center justify-center bg-muted/30 p-4 sm:min-h-[320px] sm:p-6">
                    <DemoCertificate
                      record={record}
                      highlightFields={highlightFields}
                      reducedMotion={reducedMotion}
                      size="large"
                    />
                  </div>
                </section>

                <aside className="min-w-0 shrink-0 border-t p-4 lg:w-[280px] lg:border-t-0 lg:border-l">
                  <DemoVariableInspector
                    record={record}
                    highlightFields={highlightFields}
                    reducedMotion={reducedMotion}
                  />
                </aside>
              </div>
            </DemoBrowserChrome>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Showing {PREVIEW_RECORDS.length} of {DEMO_TOTAL_RECORDS} records in this demo
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
