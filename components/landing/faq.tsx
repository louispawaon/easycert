"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Reveal, RevealItem, RevealStagger } from "@/components/landing/reveal";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

const FAQS = [
  {
    question: "Do I need to recreate my design inside Ditto?",
    answer:
      "No. Ditto works on top of an existing design. Upload it, place variables, and generate — no rebuilding required.",
  },
  {
    question: "What data sources does Ditto support?",
    answer:
      "Paste, CSV, and XLSX. Every column becomes a variable you can place anywhere on your design.",
  },
  {
    question: "Is Ditto only for certificates?",
    answer:
      "No. Any repeatable, data-driven design works: event badges, name cards, invitations, ID cards, speaker graphics, and more.",
  },
  {
    question: "How does Ditto prevent broken outputs?",
    answer:
      "Ditto runs a data-aware, layout-aware pre-generation audit. It flags overflow, missing values, and duplicates before you generate.",
  },
  {
    question: "Can I export in bulk?",
    answer:
      "Yes. Once your design and data are set, export every personalized version as a batch in one pass.",
  },
  {
    question: "What happened to EasyCert?",
    answer:
      "EasyCert was Ditto’s earlier form. It grew beyond certificates into a general bulk design personalization tool and was renamed.",
  },
] as const;

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  return (
    <section id="faq" className="border-y border-border bg-secondary/40 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <Reveal className="text-center">
          <p className="font-subheading text-sm font-semibold uppercase tracking-widest text-primary">
            FAQ
          </p>
          <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            Questions, answered.
          </h2>
        </Reveal>

        <RevealStagger className="mt-12 space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <RevealItem key={item.question}>
              <div
                className="rounded-xl border border-border bg-card"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold sm:text-base">
                    {item.question}
                  </span>
                  <ChevronRight
                    className={cn(
                      "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-90"
                    )}
                    aria-hidden
                  />
                </button>
                {isOpen ? (
                  <div
                    className={cn(
                      "px-5 pb-4",
                      !reducedMotion && "animate-[fadeIn_0.2s_ease-out]"
                    )}
                  >
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                ) : null}
              </div>
              </RevealItem>
            );
          })}
        </RevealStagger>
      </div>
    </section>
  );
}
