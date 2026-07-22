"use client";

import { Eye, Table, Upload, Zap } from "lucide-react";
import { Reveal, RevealItem, RevealStagger } from "@/components/landing/reveal";

const STEPS = [
  {
    number: "01",
    title: "Bring your design",
    description:
      "Upload from Photoshop, Canva, Figma, anywhere. Ditto never asks you to rebuild it.",
    icon: Upload,
  },
  {
    number: "02",
    title: "Bring your data",
    description:
      "Paste, CSV, XLSX. Headers become variables you can place anywhere.",
    icon: Table,
  },
  {
    number: "03",
    title: "Place variables",
    description:
      "Dynamic fields show real data, not syntax. Switch records while you edit.",
    icon: Eye,
  },
  {
    number: "04",
    title: "Ditto the rest",
    description:
      "Generate every version in one pass. Download individually or as a batch.",
    icon: Zap,
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-border bg-secondary/40 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-subheading text-sm font-semibold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            The shortest path from{" "}
            <span className="text-primary">&quot;I have a design&quot;</span> to{" "}
            <span className="text-primary">&quot;every version is ready&quot;</span>.
          </h2>
        </Reveal>

        <RevealStagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <RevealItem
                key={step.number}
                as="article"
                className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground">
                    <step.icon className="size-5" aria-hidden />
                  </div>
                  <span className="font-mono text-3xl leading-none text-muted-foreground/60">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </RevealItem>
            ))}
        </RevealStagger>
      </div>
    </section>
  );
}
