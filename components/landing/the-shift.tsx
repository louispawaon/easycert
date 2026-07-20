"use client";

import { ArrowRight, FileWarning, Sparkles } from "lucide-react";
import { Reveal, RevealItem, RevealStagger } from "@/components/landing/reveal";

export function TheShift() {
  return (
    <section id="shift" className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-subheading text-sm font-semibold uppercase tracking-widest text-primary">
            The shift
          </p>
          <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            From a single-purpose tool to a{" "}
            <span className="text-primary">personalization engine</span>.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            EasyCert assumed only names changed. Real users proved that serial
            numbers, roles, companies, dates, and event data all vary — so Ditto
            was built to personalize any structured data on any design.
          </p>
        </Reveal>

        <RevealStagger className="mt-12 grid auto-rows-fr gap-5 md:grid-cols-2">
          <RevealItem
            as="article"
            className="relative flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <span className="absolute right-5 top-5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Before
            </span>
            <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
              <FileWarning className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <h3 className="mt-5 text-lg font-semibold">A bulk output generator.</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              One template, one list of names, one output type.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <code className="rounded-md bg-muted px-2 py-1 text-xs font-mono">Template + names</code>
              <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
              <code className="rounded-md bg-muted px-2 py-1 text-xs font-mono">Outputs</code>
            </div>
          </RevealItem>

          <RevealItem
            as="article"
            className="relative flex h-full flex-col rounded-2xl border-2 border-primary bg-primary/5 p-6 shadow-lg"
          >
            <span className="absolute right-5 top-5 font-mono text-xs uppercase tracking-wider text-primary">
              Now
            </span>
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-5" aria-hidden />
            </div>
            <h3 className="mt-5 text-lg font-semibold">
              A bulk design personalization tool.
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              Any finished design plus any structured data equals any
              personalized output.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <code className="rounded-md bg-primary/10 px-2 py-1 text-xs font-mono text-primary">
                Design + data
              </code>
              <ArrowRight className="size-4 text-primary" aria-hidden />
              <code className="rounded-md bg-primary/10 px-2 py-1 text-xs font-mono text-primary">
                Personalized outputs
              </code>
            </div>
          </RevealItem>
        </RevealStagger>

        <Reveal className="mt-10 flex justify-center" delay={0.15}>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-5 py-2.5 font-mono text-sm">
            <span>DESIGN</span>
            <span className="text-primary">+</span>
            <span>DATA</span>
            <ArrowRight className="size-4 text-primary" aria-hidden />
            <span className="text-primary">DITTO</span>
            <ArrowRight className="size-4 text-primary" aria-hidden />
            <span>PERSONALIZED OUTPUTS</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
