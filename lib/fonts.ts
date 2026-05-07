import {
  Inter,
  Roboto,
  Open_Sans,
  Archivo,
  Montserrat,
  Lato,
  Poppins,
  Merriweather,
  Playfair_Display,
  Raleway,
  Nunito,
  Source_Sans_3,
} from "next/font/google";
import {
  getCustomFontsCache,
  updateCustomFontsCache,
} from "@/lib/fonts-cache";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-archivo",
});
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-roboto",
});
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const lato = Lato({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-lato" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-poppins" });
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
});
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair-display" });
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const sourceSans3 = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans-pro" });

export const FONT_MAP = {
  Arial: { variable: "--font-arial" },
  "Times New Roman": { variable: "--font-times-new-roman" },
  "Courier New": { variable: "--font-courier-new" },
  Archivo: archivo,
  Inter: inter,
  Roboto: roboto,
  "Open Sans": openSans,
  Montserrat: montserrat,
  Lato: lato,
  Poppins: poppins,
  Merriweather: merriweather,
  "Playfair Display": playfairDisplay,
  Raleway: raleway,
  Nunito: nunito,
  "Source Sans 3": sourceSans3,
};

export function getCustomFonts(): Record<string, string> {
  return { ...getCustomFontsCache() };
}

function persistCustomFontsClient(): void {
  if (typeof window === "undefined") return;
  void import("@/lib/db/app-state").then(({ saveCustomFonts }) =>
    saveCustomFonts(getCustomFontsCache())
  );
}

let fontOptionsCache: {
  customKeysSignature: string;
  options: Array<{ label: string; value: string }>;
} | null = null;

function invalidateFontOptionsCache(): void {
  fontOptionsCache = null;
}

function injectCustomFontFaceIfNeeded(name: string, fontUrl: string): void {
  if (typeof document === "undefined") return;
  const id = `easycert-font-face-${encodeURIComponent(name)}`;
  const family = JSON.stringify(name);
  const src = JSON.stringify(fontUrl);
  const css = `@font-face{font-family:${family};src:url(${src});}`;
  const existing = document.getElementById(id);
  if (existing instanceof HTMLStyleElement) {
    if (existing.textContent !== css) existing.textContent = css;
    return;
  }
  const style = document.createElement("style");
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

export function addCustomFont(name: string, fontUrl: string) {
  updateCustomFontsCache((fonts) => {
    fonts[name] = fontUrl;
    return fonts;
  });
  injectCustomFontFaceIfNeeded(name, fontUrl);
  persistCustomFontsClient();
  invalidateFontOptionsCache();

  return { variable: `--font-custom-${name.toLowerCase().replace(/ /g, "-")}` };
}

export function removeCustomFont(name: string) {
  updateCustomFontsCache((fonts) => {
    delete fonts[name];
    return fonts;
  });
  persistCustomFontsClient();
  invalidateFontOptionsCache();
}

export function getFontOptions() {
  const customKeysSignature = Object.keys(getCustomFontsCache())
    .sort()
    .join("\0");
  if (fontOptionsCache?.customKeysSignature === customKeysSignature) {
    return fontOptionsCache.options;
  }

  const baseOptions = [
    { label: "Arial", value: "Arial" },
    { label: "Times New Roman", value: "Times New Roman" },
    { label: "Courier New", value: "Courier New" },
    ...Object.keys(FONT_MAP)
      .filter((key) => !["Arial", "Times New Roman", "Courier New"].includes(key))
      .map((key) => ({
        label: key,
        value: key,
      })),
  ];

  const customFonts = getCustomFontsCache();
  const customOptions = Object.keys(customFonts).map((key) => ({
    label: key,
    value: key,
  }));

  const options = [...baseOptions, ...customOptions];
  fontOptionsCache = { customKeysSignature, options };
  return options;
}

export type FontKey = keyof typeof FONT_MAP;

export const FONT_CLASSES = Object.values(FONT_MAP)
  .map((font) => font.variable)
  .join(" ");
