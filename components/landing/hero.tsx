"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoBrowserChrome } from "@/components/landing/demo-mock";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

const TOTAL_RECORDS = 312;
const PREVIEW_CYCLE_MS = 2800;
const USER_INACTIVITY_MS = 10000;

const ACT_DURATIONS = {
  makeOne: 1200,
  dataBinds: 1400,
  dittoRest: 1800,
  idle: 8000,
} as const;

type HeroAct = "makeOne" | "dataBinds" | "dittoRest" | "idle";

const ACT_SEQUENCE: HeroAct[] = ["makeOne", "dataBinds", "dittoRest", "idle"];

const SAMPLE_ROWS = [
  { name: "Ana Reyes", serial: "BSTC-001", role: "Training Lead" },
  { name: "Kwame Osei", serial: "BSTC-002", role: "Engineer" },
  { name: "François Dubois", serial: "BSTC-003", role: "Designer" },
  { name: "Priya Sharma", serial: "BSTC-004", role: "Manager" },
  { name: "Zoë Müller", serial: "BSTC-005", role: "Director" },
] as const;

const PLACED_LAYERS = [
  { id: "static-title", label: "Subtext", kind: "static" as const },
  { id: "name", label: "name", kind: "dynamic" as const },
  { id: "serial", label: "serial", kind: "dynamic" as const },
  { id: "role", label: "role", kind: "dynamic" as const },
] as const;

type LayerId = (typeof PLACED_LAYERS)[number]["id"];

type SampleRow = (typeof SAMPLE_ROWS)[number];

const CLONE_OFFSETS = [
  { x: -28, y: 14, rotate: -4, opacity: 0.45 },
  { x: 26, y: 10, rotate: 3, opacity: 0.38 },
  { x: 4, y: 22, rotate: -1.5, opacity: 0.32 },
] as const;

function layerRingClasses(layerId: LayerId, selectedLayerId: LayerId, kind: "static" | "dynamic") {
  if (layerId !== selectedLayerId) return "";
  return kind === "static"
    ? "rounded px-1 py-0.5 ring-2 ring-info bg-info/10"
    : "rounded px-1 py-0.5 ring-2 ring-success bg-success/10";
}

const LAYER_PROPERTIES: Record<
  LayerId,
  { variable?: string; font: string; size: string; weight: string }
> = {
  "static-title": { font: "Playfair Display", size: "24 px", weight: "Italic" },
  name: { variable: "name", font: "Playfair Display", size: "32 px", weight: "Bold" },
  serial: { variable: "serial", font: "IBM Plex Mono", size: "10 px", weight: "Regular" },
  role: { variable: "role", font: "Inter", size: "10 px", weight: "Regular" },
};

const nameMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const instantVariants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
};

const certPartVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function HeroBackground({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      <div
        className={cn(
          "ditto-hero-grid absolute inset-0",
          !reducedMotion && "ditto-hero-grid--animated"
        )}
      />
      <div className="ditto-hero-aurora ditto-hero-aurora--primary" />
      <div className="ditto-hero-aurora ditto-hero-aurora--secondary" />
    </div>
  );
}

function DittoHeadline() {
  return <span className="ditto-headline-shimmer relative inline-block">Ditto</span>;
}

type CertificateCardProps = {
  record: SampleRow;
  selectedLayerId: LayerId;
  showRings: boolean;
  reducedMotion: boolean;
  act: HeroAct;
  animateEntrance?: boolean;
  className?: string;
};

function CertificateCard({
  record,
  selectedLayerId,
  showRings,
  reducedMotion,
  act,
  animateEntrance = false,
  className,
}: CertificateCardProps) {
  const isStoryAct = act !== "idle";
  const useEntrance = animateEntrance && isStoryAct;
  const MotionTag = useEntrance ? motion.p : "p";
  const MotionDiv = useEntrance ? motion.div : "div";

  const companyEl = (
    <MotionTag
      {...(useEntrance
        ? { custom: 0, variants: certPartVariants, initial: "hidden" as const, animate: "visible" as const }
        : {})}
      className="text-center text-[clamp(0.5625rem,2.4cqw,0.6875rem)] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
    >
      Northwind Co.
    </MotionTag>
  );

  const titleEl = (
    <div className="mt-[3%] flex justify-center">
      <MotionDiv
        {...(useEntrance
          ? { custom: 1, variants: certPartVariants, initial: "hidden" as const, animate: "visible" as const }
          : {})}
        className={showRings ? layerRingClasses("static-title", selectedLayerId, "static") : undefined}
      >
        <p className="text-center font-display text-[clamp(1.0625rem,5.5cqw,1.625rem)] italic leading-tight text-foreground">
          Certificate of Completion
        </p>
      </MotionDiv>
    </div>
  );

  const ruleEl = (
    <MotionDiv
      {...(useEntrance
        ? { custom: 2, variants: certPartVariants, initial: "hidden" as const, animate: "visible" as const }
        : {})}
      className="mx-auto mt-[2%] h-0.5 w-[18%] min-w-12 bg-amber-500"
    />
  );

  const nameEl = (
    <MotionDiv
      {...(useEntrance
        ? { custom: 4, variants: certPartVariants, initial: "hidden" as const, animate: "visible" as const }
        : {})}
      className="relative flex justify-center"
    >
      <motion.div
        key={selectedLayerId === "name" ? record.name : "name-static"}
        className={cn(
          showRings && layerRingClasses("name", selectedLayerId, "dynamic"),
          showRings && selectedLayerId === "name" && !reducedMotion && "animate-[fadeIn_0.3s_ease-out]"
        )}
        animate={
          reducedMotion || selectedLayerId !== "name" || act !== "idle"
            ? undefined
            : { scale: [1, 1.02, 1] }
        }
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={record.name}
            className="text-center font-display text-[clamp(1.125rem,6.5cqw,1.875rem)] font-bold tracking-tight text-foreground"
            {...(reducedMotion || act !== "idle" ? {} : nameMotion)}
          >
            {record.name}
          </motion.p>
        </AnimatePresence>
      </motion.div>
    </MotionDiv>
  );

  const descEl = (
    <MotionTag
      key={useEntrance ? undefined : `${record.name}-desc`}
      {...(useEntrance
        ? { custom: 5, variants: certPartVariants, initial: "hidden" as const, animate: "visible" as const }
        : {})}
      className={cn(
        "text-center text-[clamp(0.625rem,2.8cqw,0.8125rem)] leading-relaxed text-muted-foreground",
        act === "idle" && !reducedMotion && "animate-[fadeIn_0.3s_ease-out]"
      )}
    >
      For outstanding performance as {record.role} at Acme Corp.
    </MotionTag>
  );

  const footerEl = (
    <MotionDiv
      key={useEntrance ? undefined : `${record.name}-footer`}
      {...(useEntrance
        ? { custom: 6, variants: certPartVariants, initial: "hidden" as const, animate: "visible" as const }
        : {})}
      className={cn(
        "mt-auto flex items-end justify-between border-t border-border/40 pt-[0.4rem] text-[clamp(0.5625rem,2.4cqw,0.6875rem)] text-muted-foreground",
        act === "idle" && !reducedMotion && "animate-[fadeIn_0.3s_ease-out]"
      )}
    >
      <span
        className={cn(
          "font-mono",
          showRings && layerRingClasses("serial", selectedLayerId, "dynamic")
        )}
      >
        {record.serial}
      </span>
      <span className={showRings ? layerRingClasses("role", selectedLayerId, "dynamic") : ""}>
        {record.role}
      </span>
    </MotionDiv>
  );

  return (
    <div
      className={cn(
        "@container/cert flex h-full w-full flex-col rounded-md border bg-background p-[5%] shadow-sm",
        className
      )}
    >
      {companyEl}
      {titleEl}
      {ruleEl}

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-[0.35rem] py-[3%]">
        <MotionTag
          {...(useEntrance
            ? { custom: 3, variants: certPartVariants, initial: "hidden" as const, animate: "visible" as const }
            : {})}
          className="text-center text-[clamp(0.5625rem,2.4cqw,0.6875rem)] uppercase tracking-widest text-muted-foreground"
        >
          Presented to
        </MotionTag>
        {nameEl}
        {descEl}
      </div>

      {footerEl}
    </div>
  );
}

function OdometerCounter({ value, total }: { value: number; total: number }) {
  return (
    <span className="inline-flex shrink-0 items-baseline gap-0.5 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
      <motion.span
        key={value}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="font-medium text-foreground"
      >
        {value}
      </motion.span>
      <span>/{total}</span>
    </span>
  );
}

type WelcomePanelProps = {
  motionVariants: typeof itemVariants | typeof instantVariants;
  motionContainer: typeof containerVariants | typeof instantVariants;
};

function WelcomePanel({ motionVariants, motionContainer }: WelcomePanelProps) {
  return (
    <motion.aside
      className="flex min-w-0 shrink-0 flex-col justify-center border-b p-4 sm:p-5 md:col-start-1 md:row-start-1 md:border-b-0 md:border-r lg:w-[min(38vw,520px)] lg:border-r lg:border-b-0 lg:p-8 xl:w-[min(42vw,600px)] xl:p-10 2xl:w-[min(44vw,680px)] 2xl:p-12"
      variants={motionContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={motionVariants}>
        <a
          href="#shift"
          className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          From EasyCert to Ditto
          <ArrowUpRight
            className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </a>
      </motion.div>

      <motion.h1
        variants={motionVariants}
        className="mt-4 max-w-none font-display text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-[2.5rem] md:leading-[1.08] lg:mt-5 lg:text-5xl xl:text-6xl 2xl:text-7xl"
      >
        You made one.
        <br />
        <DittoHeadline /> the rest.
      </motion.h1>

      <motion.p
        variants={motionVariants}
        className="mt-3 line-clamp-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:line-clamp-none lg:mt-4 lg:text-lg xl:mt-6 xl:text-xl"
      >
        One finished design plus your structured data becomes hundreds of personalized versions.
        No design editor. No repetitive edits.
      </motion.p>

      <motion.div
        variants={motionVariants}
        className="mt-4 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:mt-6 xl:mt-8"
      >
        <Button asChild size="sm" className="h-10 w-full rounded-lg px-5 text-sm shadow-sm sm:w-auto xl:h-11 xl:px-6 xl:text-base">
          <Link href="/generate" className="group gap-2">
            Start free
            <ArrowRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-10 w-full rounded-lg border-border bg-background px-5 text-sm sm:w-auto xl:h-11 xl:px-6 xl:text-base"
        >
          <a href="#how-it-works">See how it works</a>
        </Button>
      </motion.div>

      <motion.p variants={motionVariants} className="mt-3 text-[11px] text-muted-foreground">
        Free forever. Upload a design, paste names, generate.
      </motion.p>

      <motion.div
        variants={motionVariants}
        className="mt-3 flex flex-row flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground lg:mt-4 lg:flex-col lg:gap-2.5 lg:text-sm xl:gap-3 xl:text-base"
      >
        <span className="inline-flex items-center gap-2">
          <Layers className="size-3.5 shrink-0" aria-hidden />
          Bring your own design
        </span>
        <span className="inline-flex items-center gap-2">
          <Wand2 className="size-3.5 shrink-0" aria-hidden />
          Generate hundreds at once
        </span>
      </motion.div>
    </motion.aside>
  );
}

type DataRailProps = {
  act: HeroAct;
  previewIndex: number;
  selectedLayerId: LayerId;
  counter: number;
  record: SampleRow;
  reducedMotion: boolean;
  onSelectRecord: (index: number) => void;
  onSelectLayer: (layerId: LayerId) => void;
};

function DataRail({
  act,
  previewIndex,
  selectedLayerId,
  counter,
  record,
  reducedMotion,
  onSelectRecord,
  onSelectLayer,
}: DataRailProps) {
  const selectedLayer = PLACED_LAYERS.find((layer) => layer.id === selectedLayerId)!;
  const properties = LAYER_PROPERTIES[selectedLayerId];
  const isIdle = act === "idle";
  const motionProps = reducedMotion ? {} : nameMotion;

  return (
    <aside
      className={cn(
        "min-w-0 shrink-0 border-t p-4 sm:p-5 md:col-span-2 md:row-start-2 md:border-t lg:col-span-1 lg:row-start-auto lg:w-[min(26vw,320px)] lg:border-t-0 lg:border-l xl:p-6",
        act === "dataBinds" && "bg-primary/5"
      )}
    >
      <div className="space-y-4 md:grid md:grid-cols-[1.2fr_1fr] md:items-start md:gap-4 md:space-y-0 lg:block lg:space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-xs font-semibold uppercase tracking-tight">
              Data source
            </h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono tabular-nums">
              {SAMPLE_ROWS.length} rows
            </span>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <div className="grid grid-cols-3 gap-px bg-border text-[10px] font-medium uppercase text-muted-foreground">
              <span className="bg-muted/60 px-2 py-1 lg:py-1.5">name</span>
              <span className="bg-muted/60 px-2 py-1 lg:py-1.5">serial</span>
              <span className="bg-muted/60 px-2 py-1 lg:py-1.5">role</span>
            </div>
            {SAMPLE_ROWS.map((row, i) => {
              const isActive = i === previewIndex;
              return (
                <button
                  key={row.serial}
                  type="button"
                  onClick={() => onSelectRecord(i)}
                  aria-pressed={isActive}
                  aria-label={`Preview record ${row.name}`}
                  className={cn(
                    "grid w-full grid-cols-3 gap-px bg-border text-left text-xs transition-colors",
                    isActive ? "relative z-10" : "hover:bg-muted/30",
                    act !== "idle" && act !== "dataBinds" && "pointer-events-none opacity-80"
                  )}
                >
                  <span
                    className={cn(
                      "truncate bg-background px-2 py-1 lg:py-1.5",
                      isActive &&
                        "bg-success/15 font-semibold text-success ring-1 ring-inset ring-success/40"
                    )}
                  >
                    {row.name}
                  </span>
                  <span
                    className={cn(
                      "truncate bg-background px-2 py-1 font-mono text-[10px] lg:py-1.5",
                      isActive && "bg-success/5"
                    )}
                  >
                    {row.serial}
                  </span>
                  <span
                    className={cn(
                      "truncate bg-background px-2 py-1 text-muted-foreground lg:py-1.5",
                      isActive && "bg-success/5"
                    )}
                  >
                    {row.role}
                  </span>
                </button>
              );
            })}
          </div>
          {act === "dataBinds" ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] text-muted-foreground"
            >
              Variable <span className="font-mono text-foreground">name</span> bound to design
            </motion.p>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="font-subheading text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {act === "dittoRest" ? "Batch output" : "Bound variables"}
          </p>

          {act === "dittoRest" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 text-xs"
            >
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-[10px] font-medium uppercase text-primary">Generating</p>
                <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">
                  {counter}
                </p>
                <p className="mt-0.5 text-muted-foreground">personalized outputs</p>
              </div>
              <p className="text-[10px] text-muted-foreground">
                One design. {TOTAL_RECORDS} records. Zero manual edits.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 lg:hidden">
                {(["name", "serial", "role"] as const).map((key) => (
                  <div
                    key={key}
                    className={cn(
                      "rounded-lg border border-border bg-background px-2 py-1.5 text-xs",
                      isIdle && selectedLayerId === key && "border-success/30 bg-success/5"
                    )}
                  >
                    <p className="text-[10px] font-medium uppercase text-muted-foreground">{key}</p>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.p
                        key={record[key]}
                        className={cn("mt-0.5 truncate font-medium", key === "serial" && "font-mono")}
                        {...motionProps}
                      >
                        {record[key]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <div className="hidden space-y-2 lg:block">
                {(["name", "serial", "role"] as const).map((key) => (
                  <div
                    key={key}
                    className={cn(
                      "rounded-lg border border-border bg-background px-3 py-2 text-xs",
                      isIdle && selectedLayerId === key && "border-success/30 bg-success/5"
                    )}
                  >
                    <p className="text-[10px] font-medium uppercase text-muted-foreground">{key}</p>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.p
                        key={record[key]}
                        className={cn("mt-0.5 truncate font-medium", key === "serial" && "font-mono")}
                        {...motionProps}
                      >
                        {record[key]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {isIdle ? (
                <>
                  <div className="pt-1 lg:hidden">
                    <p className="text-[10px] font-medium uppercase text-muted-foreground">Layers</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {PLACED_LAYERS.map((layer) => {
                        const isSelected = layer.id === selectedLayerId;
                        return (
                          <button
                            key={layer.id}
                            type="button"
                            onClick={() => onSelectLayer(layer.id)}
                            className={cn(
                              "rounded-md px-2 py-1 text-xs transition-colors",
                              isSelected
                                ? "bg-accent text-accent-foreground"
                                : "border border-border bg-background text-foreground hover:bg-muted/60"
                            )}
                            aria-pressed={isSelected}
                          >
                            {layer.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="hidden space-y-1 pt-1 lg:block">
                    <p className="text-[10px] font-medium uppercase text-muted-foreground">Layers</p>
                    <ul className="space-y-0.5">
                      {PLACED_LAYERS.map((layer) => {
                        const isSelected = layer.id === selectedLayerId;
                        return (
                          <li key={layer.id}>
                            <button
                              type="button"
                              onClick={() => onSelectLayer(layer.id)}
                              className={cn(
                                "flex w-full min-w-0 items-center rounded-md px-2 py-1 text-left text-xs transition-colors",
                                isSelected
                                  ? "bg-accent text-accent-foreground"
                                  : "text-foreground hover:bg-muted/60"
                              )}
                              aria-pressed={isSelected}
                            >
                              <span className="min-w-0 flex-1 truncate">{layer.label}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="space-y-2 pt-1 text-xs">
                  {properties.variable ? (
                    <div>
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">
                        Variable
                      </p>
                      <p className="mt-0.5 font-mono">{properties.variable}</p>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-[10px] font-medium uppercase text-muted-foreground">Selected</p>
                    <p className="mt-0.5">{selectedLayer.label}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export function LandingHero() {
  const reducedMotion = usePrefersReducedMotion();
  const motionVariants = reducedMotion ? instantVariants : itemVariants;
  const motionContainer = reducedMotion ? instantVariants : containerVariants;

  const containerRef = useRef<HTMLDivElement>(null);
  const inactivityTimeoutRef = useRef<number | null>(null);

  const [act, setAct] = useState<HeroAct>(reducedMotion ? "idle" : "makeOne");
  const [previewIndex, setPreviewIndex] = useState(0);
  const [selectedLayerId, setSelectedLayerId] = useState<LayerId>("name");
  const [counter, setCounter] = useState(1);
  const [showFlyingToken, setShowFlyingToken] = useState(false);
  const [userDriven, setUserDriven] = useState(false);
  const [enableTilt, setEnableTilt] = useState(false);

  const record = SAMPLE_ROWS[previewIndex]!;
  const displayIndex = previewIndex + 1;
  const isIdle = act === "idle";
  const counterValue = act === "dittoRest" ? counter : displayIndex;

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 120, damping: 20 });
  const springY = useSpring(pointerY, { stiffness: 120, damping: 20 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [3, -3]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-3, 3]);

  const clearInactivityTimeout = useCallback(() => {
    if (inactivityTimeoutRef.current != null) {
      window.clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
  }, []);

  const scheduleAutoplayResume = useCallback(() => {
    if (reducedMotion) return;
    clearInactivityTimeout();
    inactivityTimeoutRef.current = window.setTimeout(() => {
      setUserDriven(false);
      setAct("makeOne");
    }, USER_INACTIVITY_MS);
  }, [clearInactivityTimeout, reducedMotion]);

  const engageUser = useCallback(() => {
    if (reducedMotion) return;
    setUserDriven(true);
    setAct("idle");
    scheduleAutoplayResume();
  }, [reducedMotion, scheduleAutoplayResume]);

  const selectRecord = useCallback(
    (index: number) => {
      engageUser();
      setPreviewIndex(index);
      setSelectedLayerId("name");
    },
    [engageUser]
  );

  const selectLayer = useCallback(
    (layerId: LayerId) => {
      engageUser();
      setSelectedLayerId(layerId);
    },
    [engageUser]
  );

  const goPrev = useCallback(() => {
    engageUser();
    setPreviewIndex((i) => (i - 1 + SAMPLE_ROWS.length) % SAMPLE_ROWS.length);
    setSelectedLayerId("name");
  }, [engageUser]);

  const goNext = useCallback(() => {
    engageUser();
    setPreviewIndex((i) => (i + 1) % SAMPLE_ROWS.length);
    setSelectedLayerId("name");
  }, [engageUser]);

  const handleGenerateDemo = useCallback(() => {
    if (reducedMotion || act === "dittoRest") return;
    setUserDriven(false);
    setAct("dittoRest");
  }, [act, reducedMotion]);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion || !enableTilt || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      pointerX.set(x);
      pointerY.set(y);
    },
    [pointerX, pointerY, reducedMotion, enableTilt]
  );

  const handlePointerLeave = useCallback(() => {
    pointerX.set(0);
    pointerY.set(0);
    if (userDriven && !reducedMotion) {
      scheduleAutoplayResume();
    }
  }, [pointerX, pointerY, userDriven, reducedMotion, scheduleAutoplayResume]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const update = () => setEnableTilt(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    return () => {
      clearInactivityTimeout();
    };
  }, [clearInactivityTimeout]);

  useEffect(() => {
    if (reducedMotion || userDriven) {
      if (reducedMotion) setAct("idle");
      return;
    }

    const duration = ACT_DURATIONS[act];
    const id = window.setTimeout(() => {
      setAct((current) => {
        const idx = ACT_SEQUENCE.indexOf(current);
        return ACT_SEQUENCE[(idx + 1) % ACT_SEQUENCE.length]!;
      });
    }, duration);

    return () => window.clearTimeout(id);
  }, [act, reducedMotion, userDriven]);

  useEffect(() => {
    if (act === "dataBinds" && !reducedMotion && !userDriven) {
      setShowFlyingToken(true);
      const id = window.setTimeout(() => setShowFlyingToken(false), 900);
      return () => window.clearTimeout(id);
    }
    setShowFlyingToken(false);
  }, [act, reducedMotion, userDriven]);

  useEffect(() => {
    if (act !== "dittoRest" || reducedMotion) {
      setCounter(1);
      return;
    }

    const start = performance.now();
    const duration = ACT_DURATIONS.dittoRest - 200;
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounter(Math.max(1, Math.round(eased * TOTAL_RECORDS)));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [act, reducedMotion]);

  useEffect(() => {
    if (!isIdle || reducedMotion || userDriven) return;

    const id = window.setInterval(() => {
      setPreviewIndex((i) => (i + 1) % SAMPLE_ROWS.length);
    }, PREVIEW_CYCLE_MS);

    return () => window.clearInterval(id);
  }, [isIdle, reducedMotion, userDriven]);

  const showRings = isIdle || userDriven;
  const canvasRecord = isIdle || userDriven ? record : SAMPLE_ROWS[0]!;
  const isGenerating = act === "dittoRest";

  return (
    <section id="top" className="relative flex min-h-svh flex-col lg:h-svh lg:overflow-hidden">
      <HeroBackground reducedMotion={reducedMotion} />

      <div className="relative z-10 flex w-full flex-col pt-16 lg:h-full">
        <motion.div
          ref={containerRef}
          className="relative flex w-full flex-1 lg:h-full lg:min-h-0"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <motion.div
            style={
              reducedMotion || !enableTilt
                ? undefined
                : {
                    rotateX,
                    rotateY,
                    transformPerspective: 1400,
                  }
            }
            className="relative flex w-full flex-1 lg:h-full lg:min-h-0"
          >
            <DemoBrowserChrome className="flex w-full flex-1 flex-col rounded-none border-0 border-b border-border bg-background/95 shadow-none backdrop-blur-none lg:h-full lg:min-h-0">
              <div className="flex flex-col md:grid md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:grid-rows-[1fr_auto] md:items-stretch lg:flex lg:min-h-0 lg:flex-1 lg:flex-row lg:overflow-hidden">
                <WelcomePanel motionVariants={motionVariants} motionContainer={motionContainer} />

                <section className="flex min-h-0 min-w-0 flex-1 flex-col md:col-start-2 md:row-start-1 md:min-h-[min(52vh,22rem)] lg:min-h-0">
                  <div className="flex h-10 shrink-0 items-center justify-center gap-1.5 border-b px-3 lg:h-11">
                    <button
                      type="button"
                      onClick={goPrev}
                      aria-label="Previous record"
                      className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-background transition-colors hover:bg-muted/60"
                    >
                      <ChevronLeft className="size-3.5 text-muted-foreground" aria-hidden />
                    </button>
                    <div className="flex min-w-0 w-32 items-baseline justify-center gap-1 sm:w-40">
                      <span className="relative min-w-0 flex-1 overflow-hidden text-center">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={
                              isGenerating
                                ? "generating"
                                : isIdle || userDriven
                                  ? record.name
                                  : SAMPLE_ROWS[0]!.name
                            }
                            className="block truncate text-xs font-medium"
                            {...(reducedMotion || isGenerating ? {} : nameMotion)}
                          >
                            {isGenerating
                              ? "Generating…"
                              : isIdle || userDriven
                                ? record.name
                                : SAMPLE_ROWS[0]!.name}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                      {isGenerating ? (
                        <OdometerCounter value={counterValue} total={TOTAL_RECORDS} />
                      ) : (
                        <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                          ({counterValue}/{TOTAL_RECORDS})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={goNext}
                      aria-label="Next record"
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
                        isGenerating
                          ? "animate-pulse bg-primary text-primary-foreground"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      <ChevronRight className="size-3.5" aria-hidden />
                    </button>
                  </div>

                  <div className="@container/canvas relative flex min-h-56 flex-1 items-center justify-center overflow-hidden bg-muted/30 p-3 sm:p-4 lg:min-h-0 lg:p-8">
                    <AnimatePresence>
                      {showFlyingToken ? (
                        <motion.span
                          key="flying-token"
                          className="absolute left-[20%] top-1/2 z-30 -translate-y-1/2 rounded-full border border-success bg-success/20 px-2.5 py-1 text-xs font-semibold text-success shadow-lg backdrop-blur-sm lg:left-[28%]"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{
                            opacity: [0, 1, 1, 0],
                            scale: [0.8, 1, 1, 0.9],
                            x: [0, 60, 140, 200],
                            y: [0, -16, -6, 0],
                          }}
                          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                        >
                          {SAMPLE_ROWS[0]!.name}
                        </motion.span>
                      ) : null}
                    </AnimatePresence>

                    <div className="relative aspect-[1.414/1] w-[min(100cqw,100%,calc(100cqh*1.414),28rem)] shrink-0 md:w-[min(100cqw,100%,calc(100cqh*1.414),36rem)]">
                      <AnimatePresence>
                        {isGenerating
                          ? CLONE_OFFSETS.map((offset, i) => (
                              <motion.div
                                key={`clone-${i}`}
                                className="pointer-events-none absolute inset-0"
                                initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0.92 }}
                                animate={{
                                  opacity: offset.opacity,
                                  x: offset.x,
                                  y: offset.y,
                                  rotate: offset.rotate,
                                  scale: 1,
                                }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{
                                  delay: i * 0.1,
                                  duration: 0.5,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                              >
                                <CertificateCard
                                  record={SAMPLE_ROWS[(i + 1) % SAMPLE_ROWS.length]!}
                                  selectedLayerId="name"
                                  showRings={false}
                                  reducedMotion={reducedMotion}
                                  act={act}
                                />
                              </motion.div>
                            ))
                          : null}
                      </AnimatePresence>

                      <motion.div
                        className="relative z-10 h-full w-full"
                        animate={
                          isGenerating && !reducedMotion ? { scale: [1, 1.02, 1] } : { scale: 1 }
                        }
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      >
                        <CertificateCard
                          record={canvasRecord}
                          selectedLayerId={selectedLayerId}
                          showRings={showRings}
                          reducedMotion={reducedMotion}
                          act={act}
                          animateEntrance={act === "makeOne" && !userDriven}
                        />
                      </motion.div>
                    </div>
                  </div>
                </section>

                <DataRail
                  act={act}
                  previewIndex={previewIndex}
                  selectedLayerId={selectedLayerId}
                  counter={counter}
                  record={record}
                  reducedMotion={reducedMotion}
                  onSelectRecord={selectRecord}
                  onSelectLayer={selectLayer}
                />
              </div>

              <footer className="flex shrink-0 items-center justify-between border-t bg-background px-4 py-2.5 sm:px-6 lg:px-8 lg:py-3">
                <span className="inline-flex h-9 min-h-9 cursor-default items-center rounded-md border border-border px-2.5 text-xs text-muted-foreground select-none lg:h-7 lg:min-h-0">
                  Back
                </span>
                {isGenerating ? (
                  <span
                    className="inline-flex h-9 min-h-9 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground animate-pulse lg:h-8 lg:min-h-0"
                    aria-live="polite"
                  >
                    Generating…
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateDemo}
                    className="inline-flex h-9 min-h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 lg:h-8 lg:min-h-0"
                  >
                    Generate {TOTAL_RECORDS}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </button>
                )}
              </footer>
            </DemoBrowserChrome>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
