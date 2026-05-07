/**
 * Hero “Name” hover/tap shuffle: add or edit entries here.
 * `fontFamilyCssVar` must match `--font-*` from lib/fonts.ts / globals.css
 * (fonts are loaded on <html> via FONT_CLASSES in app/layout.tsx).
 */
export type CertificateHeroShuffleEntry = {
  text: string;
  className: string;
  fontFamilyCssVar: string;
};

/** Archivo + system fallback if a CSS variable is missing. */
export function shuffleNameFontFamily(cssVar: string): string {
  return `var(${cssVar}), var(--font-archivo-hero), system-ui, sans-serif`;
}

export const certificateHeroShuffleNames: CertificateHeroShuffleEntry[] = [
  {
    text: "Alex Rivera",
    className: "font-black tracking-tight not-italic uppercase",
    fontFamilyCssVar: "--font-montserrat",
  },
  {
    text: "Sam Okonkwo",
    className: "font-normal italic tracking-wide",
    fontFamilyCssVar: "--font-merriweather",
  },
  {
    text: "Juan Dela Cruz",
    className: "font-bold not-italic tracking-tighter",
    fontFamilyCssVar: "--font-roboto",
  },
  {
    text: "Riley Chen",
    className: "font-black not-italic tracking-[0.2em] uppercase",
    fontFamilyCssVar: "--font-playfair-display",
  },
  {
    text: "Erika Mustermann",
    className: "font-normal not-italic tracking-normal",
    fontFamilyCssVar: "--font-open-sans",
  },
  {
    text: "Nguyễn Văn A",
    className: "font-bold italic tracking-wide",
    fontFamilyCssVar: "--font-poppins",
  },
  {
    text: "Jordan Brooks",
    className: "font-black not-italic tracking-tight",
    fontFamilyCssVar: "--font-raleway",
  },
  {
    text: "Zhāng Sān",
    className: "font-normal italic tracking-tight",
    fontFamilyCssVar: "--font-inter",
  },
];
