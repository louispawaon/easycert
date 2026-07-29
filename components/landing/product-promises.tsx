"use client";

import { Database, Eye, Layers, ShieldCheck } from "lucide-react";
import { Reveal, RevealItem, RevealStagger } from "@/components/landing/reveal";

const PROMISES = [
  {
    title: "Bring your design",
    description:
      "Ditto works on top of an existing design. It never replaces your design tools — it removes the repetitive work that happens after.",
    icon: Layers,
  },
  {
    title: "Bring your data",
    description:
      "Paste, CSV, XLSX. Headers become dynamic variables. name, serial, role, company, date — any column you bring.",
    icon: Database,
  },
  {
    title: "See real data while designing",
    description:
      "No abstract template syntax. The canvas shows actual row data — 'X' instead of {{name}}. Switch records while you edit.",
    icon: Eye,
  },
  {
    title: "Trust every output",
    description:
      "Ditto is data-aware and layout-aware. Catch overflow, missing values, and duplicates before you generate a single file.",
    icon: ShieldCheck,
  },
] as const;

export function ProductPromises() {
  return (
    <section id="promises" className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-subheading text-sm font-semibold uppercase tracking-widest text-primary">
            Product promises
          </p>
          <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            Four things Ditto promises.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Everything else is noise. These four are the product.
          </p>
        </Reveal>

        <RevealStagger className="mt-12 grid gap-5 sm:grid-cols-2">
          {PROMISES.map((promise) => (
            <RevealItem key={promise.title} as="article">
              <article className="group rounded-2xl border border-border bg-card p-7 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                  <promise.icon className="size-5" aria-hidden />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{promise.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {promise.description}
                </p>
              </article>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
