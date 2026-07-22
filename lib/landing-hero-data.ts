export type HeroFieldEntry = {
  label: string;
  value: string;
  className: string;
  fontVar: string;
};

export type HeroCopyEntry = {
  name: string;
  /** Percent-based position within the hero background */
  top: string;
  left: string;
  driftDuration: number;
  driftDelay: number;
};

export function heroFieldFontFamily(fontVar: string): string {
  return `var(${fontVar}), var(--font-sans), system-ui, sans-serif`;
}

export const HERO_FIELDS: HeroFieldEntry[] = [
  {
    label: "name",
    value: "Ana Reyes",
    className: "font-semibold tracking-tight",
    fontVar: "--font-sans",
  },
  {
    label: "serial",
    value: "BSTC-001",
    className: "font-bold uppercase tracking-wider",
    fontVar: "--font-mono",
  },
  {
    label: "role",
    value: "Keynote Speaker",
    className: "italic tracking-wide",
    fontVar: "--font-instrument-serif",
  },
  {
    label: "company",
    value: "Acme Corp",
    className: "font-medium tracking-tight",
    fontVar: "--font-sans",
  },
  {
    label: "date",
    value: "March 2026",
    className: "tracking-normal",
    fontVar: "--font-instrument-serif",
  },
];

export const HERO_COPIES: HeroCopyEntry[] = [
  { name: "Ana Reyes", top: "18%", left: "8%", driftDuration: 22, driftDelay: 0 },
  { name: "Liam Cruz", top: "72%", left: "12%", driftDuration: 26, driftDelay: 2 },
  { name: "Priya N.", top: "24%", left: "82%", driftDuration: 24, driftDelay: 1 },
  { name: "Kenji T.", top: "68%", left: "78%", driftDuration: 28, driftDelay: 3 },
  { name: "Sofia M.", top: "42%", left: "6%", driftDuration: 25, driftDelay: 4 },
  { name: "Noah B.", top: "52%", left: "88%", driftDuration: 23, driftDelay: 1.5 },
];
