"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  certificateHeroShuffleNames,
  shuffleNameFontFamily,
} from "@/lib/certificate-hero-shuffle-names";
import { cn } from "@/lib/utils";

const SHUFFLE_EVERY_MS = 1000;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** True when device supports hover with a fine pointer (mouse / trackpad). */
function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return fine;
}

/** Previous value from last render (for detecting placeholder → first name, etc.). */
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  const prev = ref.current;
  ref.current = value;
  return prev;
}

function CertificateNameSlot() {
  const reducedMotion = usePrefersReducedMotion();
  const finePointer = useFinePointer();
  const [hovering, setHovering] = useState(false);
  const [shuffleIndex, setShuffleIndex] = useState(0);
  /** Touch / coarse: 0 = Name, 1..N = sample names (tap cycles). */
  const [touchCycle, setTouchCycle] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (tickRef.current != null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!finePointer || !hovering) {
      clearTick();
      return;
    }
    const step = () =>
      setShuffleIndex((i) => (i + 1) % certificateHeroShuffleNames.length);
    if (reducedMotion) {
      step();
      tickRef.current = setInterval(step, SHUFFLE_EVERY_MS * 1.75);
    } else {
      tickRef.current = setInterval(step, SHUFFLE_EVERY_MS);
    }
    return clearTick;
  }, [finePointer, hovering, reducedMotion, clearTick]);

  const touchSlot = touchCycle === 0 ? null : certificateHeroShuffleNames[touchCycle - 1];
  const hoverEntry = finePointer && hovering ? certificateHeroShuffleNames[shuffleIndex] : null;
  const entry = finePointer ? hoverEntry : touchSlot;

  const prevEntry = usePrevious(entry);
  const fromPlaceholder = Boolean(entry) && !prevEntry;

  /** Instant first frame after “Name” (hover or first tap). */
  const skipShuffleEnter = reducedMotion || fromPlaceholder;

  const fadeTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.14, ease: "easeOut" as const };

  const motionKey = entry
    ? finePointer
      ? `h-${shuffleIndex}-${entry.text}`
      : `t-${touchCycle}-${entry.text}`
    : "placeholder-name";

  const advanceTouch = useCallback(() => {
    setTouchCycle((c) => (c + 1) % (certificateHeroShuffleNames.length + 1));
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (finePointer) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      advanceTouch();
    }
  };

  const showShuffle = Boolean(entry);
  const ariaLabel = showShuffle
    ? "Sample recipient name preview"
    : "Name placeholder";

  return (
    <div className="w-full max-w-full px-1 sm:px-2">
      {!finePointer ? (
        <p className="mb-1 text-center text-[clamp(0.62rem,1.6dvh,0.8125rem)] text-muted-foreground">
          Tap to preview name styles
        </p>
      ) : null}
      <div
        role={finePointer ? undefined : "button"}
        tabIndex={finePointer ? undefined : 0}
        className={cn(
          "relative cursor-default select-none touch-manipulation rounded-md outline-none",
          !finePointer && "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label={ariaLabel}
        onPointerEnter={() => finePointer && setHovering(true)}
        onPointerLeave={() => {
          if (!finePointer) return;
          setHovering(false);
          setShuffleIndex(0);
          clearTick();
        }}
        onClick={() => {
          if (finePointer) return;
          advanceTouch();
        }}
        onKeyDown={onKeyDown}
      >
        <p
          className={cn(
            "relative mx-auto min-h-[clamp(3.5rem,9dvh,10rem)] w-full max-w-full text-center font-black leading-tight tracking-tight",
            /* Smaller caps on narrow viewports so sample names fit one line; full scale from lg up */
            "text-[clamp(1.2rem,min(3.75dvh,6.5vw),2.85rem)] sm:text-[clamp(1.35rem,min(4.1dvh,7vw),3.25rem)] md:text-[clamp(1.45rem,min(4.6dvh,7.5vw),4rem)] lg:text-[clamp(1.65rem,min(6dvh,12vw),8rem)]"
          )}
        >
          <AnimatePresence initial={false} mode="sync">
            {entry ? (
              <motion.span
                key={motionKey}
                initial={skipShuffleEnter ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: fadeTransition }}
                transition={fadeTransition}
                className="absolute inset-0 flex w-full min-w-0 items-center justify-center px-1 sm:px-2"
              >
                <span
                  className={cn(
                    "min-w-0 max-w-full text-center",
                    "max-lg:overflow-hidden max-lg:text-ellipsis max-lg:whitespace-nowrap",
                    "lg:overflow-visible lg:whitespace-normal",
                    entry.className
                  )}
                  style={{ fontFamily: shuffleNameFontFamily(entry.fontFamilyCssVar) }}
                >
                  {entry.text}
                </span>
              </motion.span>
            ) : (
              <motion.span
                key="placeholder-name"
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: fadeTransition }}
                transition={fadeTransition}
                className="absolute inset-0 flex w-full min-w-0 items-center justify-center px-1 not-italic sm:px-2"
              >
                <span className="max-w-full whitespace-nowrap">NAME</span>
              </motion.span>
            )}
          </AnimatePresence>
        </p>
      </div>
    </div>
  );
}

const cornerTriangle =
  "polygon(100% 100%, 100% 0%, 0% 100%)" as const;

export function CertificateHero() {
  return (
    <div className="certificate-hero relative flex h-full min-h-0 w-full flex-col">
      {/* Left pillars: muted (outer) + border (inner, half width of outer) */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-0 flex h-full min-h-0"
        aria-hidden
      >
        <div className="shrink-0 bg-muted" style={{ width: "var(--pillar-outer)" }} />
        <div className="shrink-0 bg-border" style={{ width: "var(--pillar-inner)" }} />
      </div>

      {/* Right corner triangles */}
      <div
        className="certificate-hero-corner-wrap pointer-events-none absolute bottom-0 right-0 z-0"
        aria-hidden
      >
        <div
          className="absolute bottom-0 right-0 bg-muted"
          style={{
            width: "var(--corner-outer-w)",
            height: "var(--corner-outer-h)",
            clipPath: cornerTriangle,
          }}
        />
        <div
          className="absolute bottom-0 right-0 z-1 bg-border"
          style={{
            width: "var(--corner-inner-w)",
            height: "var(--corner-inner-h)",
            clipPath: cornerTriangle,
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center py-3 sm:py-4 pl-[calc(var(--pillar-total)+max(1rem,env(safe-area-inset-left,0)))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:pr-[max(1.5rem,env(safe-area-inset-right,0px))] md:pr-[max(2rem,env(safe-area-inset-right,0px))]">
        <div
          className={cn(
            "flex w-full max-w-full flex-col items-center text-center md:max-w-[min(calc(100vw-2rem),56rem)]",
            "translate-x-0 md:translate-x-[calc(var(--pillar-total)*-0.5)]",
            "gap-[clamp(1rem,min(2.6dvh,1.75rem),2.75rem)] sm:gap-[clamp(1.25rem,3dvh,2.25rem)] md:gap-[clamp(1.5rem,3.5dvh,3rem)] px-4 sm:px-6 md:px-8"
          )}
        >
          <div className="flex max-sm:flex-col max-sm:items-center max-sm:gap-2 flex-row flex-wrap items-center justify-center gap-2 sm:gap-3">
            <div className="relative shrink-0 size-[clamp(2.75rem,min(7dvh,12vw),4rem)]">
              <Image
                src="/easycert_logo.svg"
                alt=""
                width={64}
                height={64}
                className="size-full object-contain dark:invert"
                priority
              />
            </div>
            <span className="text-[clamp(2.75rem,min(7dvh,12vw),4rem)] font-black leading-none tracking-tight">
              EasyCert
            </span>
          </div>

          {/* Headline + name: grouped with comfortable vertical rhythm */}
          <div className="flex w-full max-w-full flex-col items-center gap-2 md:gap-3">
            <p className="text-[clamp(0.72rem,min(2dvh,3.8vw),1.5rem)] md:text-[clamp(0.78rem,min(2.1dvh,3.8vw),1.5rem)] font-normal uppercase tracking-[0.2em]">
              Certificate of Completion
            </p>

            <div className="flex flex-col gap-1 leading-[1.1] md:gap-1.5">
              <p className="text-[clamp(0.92rem,min(3.6dvh,5.8vw),2.75rem)] md:text-[clamp(1rem,min(3.8dvh,5.5vw),4rem)] font-normal not-italic">
                Your attendees deserve a certificate
              </p>
              <p className="text-[clamp(0.92rem,min(3.6dvh,5.8vw),2.75rem)] md:text-[clamp(1rem,min(3.8dvh,5.5vw),4rem)] italic">
                that has their
              </p>
            </div>

            <CertificateNameSlot />

            <p className="text-[clamp(0.92rem,min(3.6dvh,5.8vw),2.75rem)] md:text-[clamp(1rem,min(3.8dvh,5.5vw),4rem)] italic leading-[1.12]">
              on it.
            </p>
          </div>

          <div className="mx-auto flex w-full max-w-[min(100%,64rem)] flex-col  text-center text-[clamp(0.75rem,min(2.25dvh,4vw),1.75rem)] font-normal">
            <p className="leading-normal">
              Stop manually editing one certificate at a time.
            </p>
            <p className="md:whitespace-nowrap leading-normal">
              Upload your design once, drop in your list, and let{" "}
              <strong className="font-bold">EasyCert</strong> do the rest.
            </p>
            <p className="italic leading-normal">
              Every name, every certificate, in one click.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-[clamp(0.7rem,min(1.85dvh,3.2vw),1.25rem)] font-normal">
            <span>Free Forever</span>
            <span className="text-foreground/80" aria-hidden>
              ·
            </span>
            <span>No Account Needed</span>
          </div>

          <Button
            asChild
            size="lg"
            className="mt-1 h-11 w-full max-w-sm text-sm font-semibold shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] sm:h-12 sm:max-w-none sm:w-auto sm:text-base"
          >
            <Link href="/generate" className="gap-2">
              <span className="sm:hidden">Start free — open generator</span>
              <span className="hidden sm:inline">Start free — bulk certificates in one go</span>
              <ArrowRight className="size-5 shrink-0" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
