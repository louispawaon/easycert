"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";

export function FinalCta() {
  return (
    <section id="start" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-primary-foreground shadow-2xl sm:px-10 sm:py-20">
            <div
              className="ditto-hero-grid pointer-events-none absolute inset-0 opacity-20"
              aria-hidden
            />

            <div className="relative z-10 mx-auto max-w-2xl text-center">
              <h2 className="font-display text-4xl leading-[1.1] tracking-tight sm:text-6xl">
                You made one. Ditto the rest.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-primary-foreground/80 sm:text-lg">
                Bring your design. Bring your data. Ditto turns it into every
                personalized version you need — in one pass.
              </p>

              <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="h-12 rounded-xl px-8 text-base shadow-lg"
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
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl border-primary-foreground/30 bg-transparent px-8 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <a href="#how-it-works" className="group gap-2">
                    See how it works
                    <ArrowUpRight
                      className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </a>
                </Button>
              </div>

              <p className="mt-6 text-sm text-primary-foreground/70">
                No credit card. No design editor. Just your design, your data, and
                Ditto.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
