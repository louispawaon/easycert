"use client";

import { AlertTriangle, Check, CircleCheck, ShieldCheck, Wand2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Reveal, RevealItem, RevealStagger } from "@/components/landing/reveal";

const CAPABILITIES = [
  "Longest-value preview",
  "Worst-case record preview",
  "Text overflow detection",
  "Smart text fitting",
  "Missing value detection",
  "Duplicate detection",
] as const;

const AUDIT_ROWS = [
  { status: "ready", label: "Ready", count: 497, icon: CircleCheck },
  { status: "warning", label: "Values may overflow", count: 2, icon: AlertTriangle },
  { status: "warning", label: "Missing serial number", count: 1, icon: AlertTriangle },
] as const;

export function DataAware() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="items-center gap-10 lg:grid lg:grid-cols-2">
          <Reveal>
            <p className="font-subheading text-sm font-semibold uppercase tracking-widest text-primary">
              Trust every output
            </p>
            <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              Generating 500 files is easy.{" "}
              <span className="text-primary">
                Knowing all 500 are correct
              </span>{" "}
              is the hard part.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Ditto is data-aware and layout-aware. It checks your records
              before generation so broken outputs never slip through.
            </p>

            <RevealStagger className="mt-8 space-y-3">
              {CAPABILITIES.map((capability) => (
                <RevealItem key={capability} as="li" className="flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-success/15">
                    <Check className="size-3.5 text-success" aria-hidden />
                  </span>
                  <span className="text-sm">{capability}</span>
                </RevealItem>
              ))}
            </RevealStagger>
          </Reveal>

          <Reveal className="mt-10 lg:mt-0" delay={0.1}>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-5 text-primary" aria-hidden />
                  <h3 className="font-semibold">Pre-generation audit</h3>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-mono">
                  500 records
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {AUDIT_ROWS.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-3">
                      <row.icon
                        className={
                          row.status === "ready"
                            ? "size-5 text-success"
                            : "size-5 text-warning"
                        }
                        aria-hidden
                      />
                      <span className="text-sm font-medium">{row.label}</span>
                    </div>
                    <span
                      className={cn(
                        "font-mono text-sm",
                        row.status === "ready" ? "text-success" : "text-warning"
                      )}
                    >
                      {row.count}
                    </span>
                  </div>
                ))}
              </div>

              <div className="my-5 h-px bg-border" />

              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">
                  <span className="size-2 animate-pulse rounded-full bg-success" />
                  Ready to generate
                </span>
              </div>

              <button
                type="button"
                className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Wand2 className="size-4" aria-hidden />
                Generate 497 outputs
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
