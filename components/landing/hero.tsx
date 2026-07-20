"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  Link as LinkIcon,
  Type,
  User,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoBrowserChrome } from "@/components/landing/demo-mock";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

const TOTAL_RECORDS = 312;
const PREVIEW_CYCLE_MS = 2800;

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
  { id: "static-title", label: "Subtext", Icon: Type, kind: "static" as const },
  { id: "name", label: "name", Icon: User, kind: "dynamic" as const },
  { id: "serial", label: "serial", Icon: User, kind: "dynamic" as const },
  { id: "role", label: "role", Icon: User, kind: "dynamic" as const },
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
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
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

  return (
    <div
      className={cn(
        "aspect-[1.414/1] w-full max-w-sm rounded-md border bg-background p-4 shadow-sm sm:max-w-md sm:p-5",
        className
      )}
    >
      {animateEntrance && isStoryAct ? (
        <>
          <motion.p
            custom={0}
            variants={certPartVariants}
            initial="hidden"
            animate="visible"
            className="text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px]"
          >
            Northwind Co.
          </motion.p>
          <div className="mt-3 flex justify-center sm:mt-4">
            <motion.div custom={1} variants={certPartVariants} initial="hidden" animate="visible">
              <p className="text-center font-display text-xl italic leading-tight text-foreground sm:text-2xl">
                Certificate of Completion
              </p>
            </motion.div>
          </div>
          <motion.div
            custom={2}
            variants={certPartVariants}
            initial="hidden"
            animate="visible"
            className="mx-auto mt-2 h-0.5 w-12 bg-amber-500 sm:mt-3 sm:w-16"
          />
          <motion.p
            custom={3}
            variants={certPartVariants}
            initial="hidden"
            animate="visible"
            className="mt-4 text-center text-[9px] uppercase tracking-widest text-muted-foreground sm:mt-5 sm:text-[10px]"
          >
            Presented to
          </motion.p>
          <motion.div
            custom={4}
            variants={certPartVariants}
            initial="hidden"
            animate="visible"
            className="relative mx-auto mt-1 flex justify-center"
          >
            <p
              className={cn(
                "text-center font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl",
                showRings && layerRingClasses("name", selectedLayerId, "dynamic")
              )}
            >
              {record.name}
            </p>
          </motion.div>
          <motion.p
            custom={5}
            variants={certPartVariants}
            initial="hidden"
            animate="visible"
            className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground sm:text-xs"
          >
            For outstanding performance as {record.role} at Acme Corp.
          </motion.p>
          <motion.div
            custom={6}
            variants={certPartVariants}
            initial="hidden"
            animate="visible"
            className="mt-4 flex items-end justify-between pt-2 text-[9px] text-muted-foreground sm:mt-6 sm:pt-4 sm:text-[10px]"
          >
            <span className="font-mono">{record.serial}</span>
            <span>{record.role}</span>
          </motion.div>
        </>
      ) : (
        <>
          <p className="text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px]">
            Northwind Co.
          </p>
          <div className="mt-3 flex justify-center sm:mt-4">
            <div className={showRings ? layerRingClasses("static-title", selectedLayerId, "static") : ""}>
              <p className="text-center font-display text-xl italic leading-tight text-foreground sm:text-2xl">
                Certificate of Completion
              </p>
            </div>
          </div>
          <div className="mx-auto mt-2 h-0.5 w-12 bg-amber-500 sm:mt-3 sm:w-16" />
          <p className="mt-4 text-center text-[9px] uppercase tracking-widest text-muted-foreground sm:mt-5 sm:text-[10px]">
            Presented to
          </p>
          <div className="relative mx-auto mt-1 flex justify-center">
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
                  className="text-center font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl"
                  {...(reducedMotion || act !== "idle" ? {} : nameMotion)}
                >
                  {record.name}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          </div>
          <p
            key={`${record.name}-desc`}
            className={cn(
              "mt-3 text-center text-[10px] leading-relaxed text-muted-foreground sm:text-xs",
              act === "idle" && !reducedMotion && "animate-[fadeIn_0.3s_ease-out]"
            )}
          >
            For outstanding performance as {record.role} at Acme Corp.
          </p>
          <div
            key={`${record.name}-footer`}
            className={cn(
              "mt-4 flex items-end justify-between pt-2 text-[9px] text-muted-foreground sm:mt-6 sm:pt-4 sm:text-[10px]",
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
          </div>
        </>
      )}
    </div>
  );
}

function OdometerCounter({ value, total }: { value: number; total: number }) {
  return (
    <span className="inline-flex shrink-0 items-baseline gap-0.5 whitespace-nowrap text-xs tabular-nums text-muted-foreground lg:text-sm">
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

function HeroVisual({ reducedMotion }: { reducedMotion: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [act, setAct] = useState<HeroAct>(reducedMotion ? "idle" : "makeOne");
  const [previewIndex, setPreviewIndex] = useState(0);
  const [selectedLayerId, setSelectedLayerId] = useState<LayerId>("name");
  const [counter, setCounter] = useState(1);
  const [showFlyingToken, setShowFlyingToken] = useState(false);

  const record = SAMPLE_ROWS[previewIndex]!;
  const displayIndex = previewIndex + 1;
  const selectedLayer = PLACED_LAYERS.find((layer) => layer.id === selectedLayerId)!;
  const properties = LAYER_PROPERTIES[selectedLayerId];
  const isIdle = act === "idle";
  const isStoryAct = !isIdle;

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 120, damping: 20 });
  const springY = useSpring(pointerY, { stiffness: 120, damping: 20 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-4, 4]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const scrollY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      pointerX.set(x);
      pointerY.set(y);
    },
    [pointerX, pointerY, reducedMotion]
  );

  const handlePointerLeave = useCallback(() => {
    pointerX.set(0);
    pointerY.set(0);
  }, [pointerX, pointerY]);

  useEffect(() => {
    if (reducedMotion) {
      setAct("idle");
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
  }, [act, reducedMotion]);

  useEffect(() => {
    if (act === "dataBinds" && !reducedMotion) {
      setShowFlyingToken(true);
      const id = window.setTimeout(() => setShowFlyingToken(false), 900);
      return () => window.clearTimeout(id);
    }
    setShowFlyingToken(false);
  }, [act, reducedMotion]);

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
    if (!isIdle || reducedMotion) {
      setPreviewIndex(0);
      return;
    }
    const id = window.setInterval(() => {
      setPreviewIndex((i) => (i + 1) % SAMPLE_ROWS.length);
    }, PREVIEW_CYCLE_MS);
    return () => window.clearInterval(id);
  }, [isIdle, reducedMotion]);

  const counterValue = act === "dittoRest" ? counter : displayIndex;

  return (
    <motion.div
      ref={containerRef}
      className="relative mx-auto mt-16 w-full max-w-5xl"
      style={reducedMotion ? undefined : { y: scrollY }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        style={
          reducedMotion
            ? undefined
            : {
                rotateX,
                rotateY,
                transformPerspective: 1200,
              }
        }
        className="relative"
      >
        <DemoBrowserChrome>
          <div className="flex min-h-0 flex-col lg:flex-row">
            <aside
              className={cn(
                "hidden min-w-0 shrink-0 border-b p-4 lg:block lg:w-[280px] lg:border-r lg:border-b-0",
                act === "dataBinds" && "bg-primary/5"
              )}
            >
              {act === "dataBinds" ? (
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-3"
                >
                  <h3 className="font-heading text-xs font-semibold uppercase tracking-tight">
                    Data source
                  </h3>
                  <div className="overflow-hidden rounded-lg border border-border bg-background">
                    <div className="grid grid-cols-3 gap-px bg-border text-[10px] font-medium uppercase text-muted-foreground">
                      <span className="bg-muted/60 px-2 py-1.5">name</span>
                      <span className="bg-muted/60 px-2 py-1.5">serial</span>
                      <span className="bg-muted/60 px-2 py-1.5">role</span>
                    </div>
                    {SAMPLE_ROWS.slice(0, 4).map((row, i) => (
                      <motion.div
                        key={row.serial}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.08, duration: 0.35 }}
                        className={cn(
                          "grid grid-cols-3 gap-px bg-border text-xs",
                          i === 0 && "relative z-10"
                        )}
                      >
                        <span
                          className={cn(
                            "truncate bg-background px-2 py-1.5",
                            i === 0 && "bg-success/15 font-semibold text-success ring-1 ring-inset ring-success/40"
                          )}
                        >
                          {row.name}
                        </span>
                        <span className="truncate bg-background px-2 py-1.5 font-mono text-[10px]">
                          {row.serial}
                        </span>
                        <span className="truncate bg-background px-2 py-1.5 text-muted-foreground">
                          {row.role}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Variable <span className="font-mono text-foreground">name</span> bound to design
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-heading text-xs font-semibold uppercase tracking-tight">
                      Text
                    </h3>
                    <div className="space-y-1.5">
                      <div className="flex h-auto min-h-8 w-full items-center justify-start rounded-md border border-border bg-background px-2.5 py-1.5 text-xs">
                        <Type className="mr-2 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        Insert Static Text
                      </div>
                      <div className="flex h-auto min-h-8 w-full items-center justify-start rounded-md border border-border bg-background px-2.5 py-1.5 text-xs">
                        <User className="mr-2 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        Insert Selected Info
                      </div>
                      <div className="flex h-auto min-h-8 w-full items-center justify-start rounded-md border border-border bg-background px-2.5 py-1.5 text-xs">
                        <LinkIcon className="mr-2 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        Insert Proof Link
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-heading text-xs font-semibold uppercase tracking-tight">
                      Placed elements
                    </h3>
                    <ul className="space-y-1">
                      {PLACED_LAYERS.map((layer) => {
                        const isSelected = layer.id === selectedLayerId;
                        return (
                          <li key={layer.id}>
                            <button
                              type="button"
                              onClick={() => isIdle && setSelectedLayerId(layer.id)}
                              disabled={!isIdle}
                              className={cn(
                                "flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                                isSelected
                                  ? "bg-accent text-accent-foreground"
                                  : "text-foreground hover:bg-muted/60",
                                !isIdle && "pointer-events-none opacity-70"
                              )}
                              aria-pressed={isSelected}
                            >
                              <layer.Icon className="size-3.5 shrink-0" aria-hidden />
                              <span className="min-w-0 flex-1 truncate">{layer.label}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </aside>

            <section className="flex min-w-0 flex-1 flex-col">
              <div className="flex h-10 shrink-0 items-center justify-center gap-1.5 border-b px-3 lg:h-12">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                  <ChevronLeft className="size-3.5 text-muted-foreground" aria-hidden />
                </div>
                <div className="flex min-w-0 w-28 items-baseline justify-center gap-1 sm:w-36 lg:w-44">
                  <span className="relative min-w-0 flex-1 overflow-hidden text-center">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={isIdle ? record.name : act === "dittoRest" ? "generating" : SAMPLE_ROWS[0]!.name}
                        className="block truncate text-xs font-medium lg:text-sm"
                        {...(reducedMotion || !isIdle ? {} : nameMotion)}
                      >
                        {act === "dittoRest"
                          ? "Generating…"
                          : isIdle
                            ? record.name
                            : SAMPLE_ROWS[0]!.name}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  {act === "dittoRest" ? (
                    <OdometerCounter value={counterValue} total={TOTAL_RECORDS} />
                  ) : (
                    <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                      ({counterValue}/{TOTAL_RECORDS})
                    </span>
                  )}
                </div>
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-md",
                    act === "dittoRest" ? "animate-pulse bg-primary text-primary-foreground" : "bg-primary text-primary-foreground"
                  )}
                >
                  <ChevronRight className="size-3.5" aria-hidden />
                </div>
              </div>

              <div className="relative flex min-h-[220px] items-start justify-center overflow-hidden bg-muted/30 p-3 sm:min-h-[260px]">
                <AnimatePresence>
                  {showFlyingToken ? (
                    <motion.span
                      key="flying-token"
                      className="absolute left-[18%] top-[38%] z-30 rounded-full border border-success bg-success/20 px-2.5 py-1 text-xs font-semibold text-success shadow-lg backdrop-blur-sm lg:left-[22%]"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: [0, 1, 1, 0],
                        scale: [0.8, 1, 1, 0.9],
                        x: [0, 40, 120, 180],
                        y: [0, -20, -8, 0],
                      }}
                      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {SAMPLE_ROWS[0]!.name}
                    </motion.span>
                  ) : null}
                </AnimatePresence>

                <div className="relative flex w-full max-w-md items-center justify-center">
                  <AnimatePresence>
                    {act === "dittoRest"
                      ? CLONE_OFFSETS.map((offset, i) => (
                          <motion.div
                            key={`clone-${i}`}
                            className="pointer-events-none absolute inset-x-0 mx-auto w-full max-w-sm sm:max-w-md"
                            initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0.92 }}
                            animate={{
                              opacity: offset.opacity,
                              x: offset.x,
                              y: offset.y,
                              rotate: offset.rotate,
                              scale: 1,
                            }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
                    className="relative z-10 w-full"
                    animate={
                      act === "dittoRest" && !reducedMotion
                        ? { scale: [1, 1.02, 1] }
                        : { scale: 1 }
                    }
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    <CertificateCard
                      record={isIdle ? record : SAMPLE_ROWS[0]!}
                      selectedLayerId={selectedLayerId}
                      showRings={isIdle}
                      reducedMotion={reducedMotion}
                      act={act}
                      animateEntrance={act === "makeOne"}
                    />
                  </motion.div>
                </div>
              </div>
            </section>

            <aside className="hidden min-w-0 shrink-0 border-t p-4 lg:block lg:w-[280px] lg:border-t-0 lg:border-l">
              <div className="space-y-3">
                <p className="font-subheading text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Properties
                </p>
                {act === "dittoRest" ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3 text-xs"
                  >
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                      <p className="text-[10px] font-medium uppercase text-primary">Batch generate</p>
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
                  <div className="space-y-2.5 text-xs">
                    {properties.variable ? (
                      <div>
                        <p className="text-[10px] font-medium uppercase text-muted-foreground">Variable</p>
                        <p className="mt-0.5 font-mono">{properties.variable}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10px] font-medium uppercase text-muted-foreground">Type</p>
                        <p className="mt-0.5">Static text</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">Font</p>
                      <p className="mt-0.5">{properties.font}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">Size</p>
                      <p className="mt-0.5">{properties.size}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">Weight</p>
                      <p className="mt-0.5">{properties.weight}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">Selected</p>
                      <p className="mt-0.5">{selectedLayer.label}</p>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>

          <footer className="flex items-center justify-between border-t bg-background px-3 py-2 lg:px-4">
            <span className="inline-flex h-7 items-center rounded-md border border-border px-2.5 text-xs text-muted-foreground">
              Back
            </span>
            <span
              className={cn(
                "inline-flex h-7 items-center rounded-md px-2.5 text-xs font-medium text-primary-foreground",
                act === "dittoRest" ? "animate-pulse bg-primary" : "bg-primary"
              )}
            >
              {act === "dittoRest" ? "Generating…" : "Next"}
            </span>
          </footer>
        </DemoBrowserChrome>

        {!reducedMotion && isStoryAct ? (
          <motion.p
            key={act}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-muted-foreground"
          >
            {act === "makeOne" && "You made one."}
            {act === "dataBinds" && "Bind your data."}
            {act === "dittoRest" && "Ditto the rest."}
          </motion.p>
        ) : null}
      </motion.div>
    </motion.div>
  );
}

export function LandingHero() {
  const reducedMotion = usePrefersReducedMotion();
  const motionVariants = reducedMotion ? instantVariants : itemVariants;
  const motionContainer = reducedMotion ? instantVariants : containerVariants;

  return (
    <section
      id="top"
      className="relative flex min-h-svh flex-col overflow-hidden"
    >
      <HeroBackground reducedMotion={reducedMotion} />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-5 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-40">
        <motion.div
          className="mx-auto flex w-full max-w-3xl flex-col items-center text-center"
          variants={motionContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={motionVariants}>
            <a
              href="#shift"
              className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-foreground"
            >
              From EasyCert to Ditto
              <ArrowUpRight
                className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </a>
          </motion.div>

          <motion.h1
            variants={motionVariants}
            className="mt-8 font-display text-5xl leading-[1.05] tracking-tight sm:text-7xl"
          >
            You made one.
            <br />
            <DittoHeadline /> the rest.
          </motion.h1>

          <motion.p
            variants={motionVariants}
            className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            Ditto turns one finished design and your structured data into hundreds
            of personalized versions. No design editor. No repetitive edits. No
            copy-paste marathon.
          </motion.p>

          <motion.div
            variants={motionVariants}
            className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center"
          >
            <Button
              asChild
              size="lg"
              className="h-12 rounded-xl px-8 text-base shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
            >
              <Link href="/generate" className="group gap-2">
                Start free
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-xl border-border bg-card/80 px-8 text-base shadow-sm backdrop-blur-sm"
            >
              <a href="#how-it-works">See how it works</a>
            </Button>
          </motion.div>

          <motion.p
            variants={motionVariants}
            className="mt-4 text-xs text-muted-foreground"
          >
            Free forever. Upload a design, paste names, generate.
          </motion.p>

          <motion.div
            variants={motionVariants}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
          >
            <span className="inline-flex items-center gap-2">
              <Layers className="size-4 shrink-0" aria-hidden />
              Bring your own design
            </span>
            <span className="inline-flex items-center gap-2">
              <Wand2 className="size-4 shrink-0" aria-hidden />
              Generate hundreds at once
            </span>
          </motion.div>
        </motion.div>

        <HeroVisual reducedMotion={reducedMotion} />
      </div>
    </section>
  );
}
