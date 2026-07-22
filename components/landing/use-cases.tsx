"use client";

import {
  Briefcase,
  Building2,
  ShieldCheck,
  Sparkles,
  Type,
  Zap,
} from "lucide-react";
import { Reveal, RevealItem, RevealStagger } from "@/components/landing/reveal";

const USE_CASES = [
  {
    label: "Certificates",
    description: "Training completion, course credits, awards",
    icon: ShieldCheck,
  },
  {
    label: "Event badges",
    description: "Names, roles, QR codes for check-in",
    icon: Briefcase,
  },
  {
    label: "Name cards",
    description: "Seating, table, company, title",
    icon: Type,
  },
  {
    label: "Invitations",
    description: "Guest, table number, event date",
    icon: Sparkles,
  },
  {
    label: "ID cards",
    description: "Photo, employee ID, department",
    icon: Building2,
  },
  {
    label: "Speaker graphics",
    description: "Name, title, talk, socials",
    icon: Zap,
  },
] as const;

export function UseCases() {
  return (
    <section id="use-cases" className="border-y border-border bg-secondary/40 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-subheading text-sm font-semibold uppercase tracking-widest text-primary">
            Beyond certificates
          </p>
          <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            One design. Many uses.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            The underlying problem isn&apos;t certificates — it&apos;s repeating a
            design across many records.
          </p>
        </Reveal>

        <RevealStagger className="mt-12 grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((item) => (
            <RevealItem
              key={item.label}
              as="article"
              className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-secondary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                <item.icon className="size-5" aria-hidden />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{item.label}</h3>
              <p className="mt-2 min-h-[2.75rem] flex-1 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
