"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";

export type PreviewRecord = {
  name: string;
  serial: string;
  role: string;
  company: string;
};

export const PREVIEW_RECORDS: PreviewRecord[] = [
  { name: "Ana Reyes", serial: "BSTC-001", role: "Training Lead", company: "Acme Corp" },
  { name: "Kwame Osei", serial: "BSTC-002", role: "Engineer", company: "Northwind Co." },
  { name: "Yuki Tanaka", serial: "BSTC-003", role: "Designer", company: "Fabrikam" },
  { name: "Priya Sharma", serial: "BSTC-004", role: "Manager", company: "Contoso" },
];

export const DEMO_TOTAL_RECORDS = 312;

export const fieldMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
};

export function dynamicFieldRing(active: boolean) {
  return active
    ? "rounded px-1 py-0.5 ring-2 ring-success bg-success/10 transition-shadow duration-300"
    : "rounded px-1 py-0.5 transition-shadow duration-300";
}

type DemoBrowserChromeProps = {
  url?: string;
  children: ReactNode;
  className?: string;
};

export function DemoBrowserChrome({
  url = "ditto.project1of1.com/generate",
  children,
  className,
}: DemoBrowserChromeProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card/80 shadow-2xl backdrop-blur-xl",
        className
      )}
    >
      <div className="flex h-9 items-center gap-2 border-b border-border px-4">
        <span className="size-2.5 rounded-full bg-destructive" aria-hidden />
        <span className="size-2.5 rounded-full bg-warning" aria-hidden />
        <span className="size-2.5 rounded-full bg-success" aria-hidden />
        <span className="ml-3 truncate font-mono text-[10px] text-muted-foreground">{url}</span>
      </div>
      {children}
    </div>
  );
}

type DemoDataTableProps = {
  records: PreviewRecord[];
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function DemoDataTable({ records, activeIndex, onSelect }: DemoDataTableProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-xs font-semibold uppercase tracking-tight">Data source</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono tabular-nums">
          {records.length} rows
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <div className="grid grid-cols-4 gap-px bg-border text-[10px] font-medium uppercase text-muted-foreground">
          <span className="bg-muted/60 px-2 py-1.5">name</span>
          <span className="bg-muted/60 px-2 py-1.5">serial</span>
          <span className="bg-muted/60 px-2 py-1.5">role</span>
          <span className="bg-muted/60 px-2 py-1.5">company</span>
        </div>
        {records.map((row, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={row.serial}
              type="button"
              onClick={() => onSelect(i)}
              aria-pressed={isActive}
              aria-label={`Preview record ${row.name}`}
              className={cn(
                "grid w-full grid-cols-4 gap-px bg-border text-left text-xs transition-colors",
                isActive ? "relative z-10" : "hover:bg-muted/30"
              )}
            >
              <span
                className={cn(
                  "truncate bg-background px-2 py-1.5",
                  isActive && "bg-success/15 font-semibold text-success ring-1 ring-inset ring-success/40"
                )}
              >
                {row.name}
              </span>
              <span
                className={cn(
                  "truncate bg-background px-2 py-1.5 font-mono text-[10px]",
                  isActive && "bg-success/5"
                )}
              >
                {row.serial}
              </span>
              <span
                className={cn(
                  "truncate bg-background px-2 py-1.5 text-muted-foreground",
                  isActive && "bg-success/5"
                )}
              >
                {row.role}
              </span>
              <span
                className={cn(
                  "truncate bg-background px-2 py-1.5 text-muted-foreground",
                  isActive && "bg-success/5"
                )}
              >
                {row.company}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type DemoCertificateProps = {
  record: PreviewRecord;
  highlightFields: boolean;
  reducedMotion: boolean;
  size?: "default" | "large";
  className?: string;
};

export function DemoCertificate({
  record,
  highlightFields,
  reducedMotion,
  size = "default",
  className,
}: DemoCertificateProps) {
  const isLarge = size === "large";
  const motionProps = reducedMotion ? {} : fieldMotion;

  return (
    <div
      className={cn(
        "aspect-[1.414/1] w-full rounded-md border border-primary/20 bg-background p-5 shadow-sm sm:p-6",
        isLarge ? "max-w-lg" : "max-w-sm sm:max-w-md",
        className
      )}
    >
      <p
        className={cn(
          "text-center font-semibold uppercase tracking-[0.2em] text-muted-foreground",
          isLarge ? "text-[10px] sm:text-xs" : "text-[9px] sm:text-[10px]"
        )}
      >
        Northwind Co.
      </p>
      <p
        className={cn(
          "mt-4 text-center font-display italic leading-tight text-foreground",
          isLarge ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
        )}
      >
        Certificate of Completion
      </p>
      <div className={cn("mx-auto mt-3 h-0.5 bg-amber-500", isLarge ? "w-16 sm:w-20" : "w-12 sm:w-16")} />
      <p
        className={cn(
          "mt-5 text-center uppercase tracking-widest text-muted-foreground",
          isLarge ? "text-xs" : "text-[9px] sm:text-[10px]"
        )}
      >
        Presented to
      </p>
      <div className="relative mx-auto mt-2 flex justify-center">
        <span className={dynamicFieldRing(highlightFields)}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={record.name}
              className={cn(
                "text-center font-display font-bold tracking-tight text-foreground",
                isLarge ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
              )}
              {...motionProps}
            >
              {record.name}
            </motion.p>
          </AnimatePresence>
        </span>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={`${record.name}-desc`}
          className={cn(
            "mt-4 text-center leading-relaxed text-muted-foreground",
            isLarge ? "text-sm" : "text-[10px] sm:text-xs"
          )}
          {...motionProps}
        >
          For outstanding performance as{" "}
          <span className={dynamicFieldRing(highlightFields)}>{record.role}</span> at{" "}
          <span className={dynamicFieldRing(highlightFields)}>{record.company}</span>.
        </motion.p>
      </AnimatePresence>
      <div
        className={cn(
          "mt-6 flex items-end justify-between text-muted-foreground",
          isLarge ? "text-xs" : "text-[9px] sm:text-[10px]"
        )}
      >
        <span className={cn("font-mono", dynamicFieldRing(highlightFields))}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={record.serial} {...motionProps}>
              {record.serial}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className={dynamicFieldRing(highlightFields)}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={record.role} {...motionProps}>
              {record.role}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
    </div>
  );
}

const BOUND_VARIABLES = ["name", "serial", "role", "company"] as const;

type DemoVariableInspectorProps = {
  record: PreviewRecord;
  highlightFields: boolean;
  reducedMotion: boolean;
};

export function DemoVariableInspector({
  record,
  highlightFields,
  reducedMotion,
}: DemoVariableInspectorProps) {
  const motionProps = reducedMotion ? {} : fieldMotion;

  return (
    <div className="space-y-3">
      <p className="font-subheading text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Bound variables
      </p>
      <div className="space-y-2.5 text-xs">
        {BOUND_VARIABLES.map((key) => (
          <div
            key={key}
            className={cn(
              "rounded-lg border border-border bg-background px-3 py-2",
              highlightFields && "border-success/30 bg-success/5"
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
      <p className="text-[10px] leading-relaxed text-muted-foreground">
        Static text stays fixed. Variables update per record.
      </p>
    </div>
  );
}
