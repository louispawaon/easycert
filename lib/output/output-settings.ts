import type { PageSizeId } from "@/lib/page-size";

export type OutputFormat = "png" | "webp" | "pdf";

export type OutputBundle = "standalone" | "with-pdf";

export type OutputSettings = {
  format: OutputFormat;
  scale: number;
  filenamePattern: string;
  pageSize: PageSizeId;
  bundle: OutputBundle;
};

export const SCALE_PRESETS = [
  { label: "Original (1×)", value: 1 },
  { label: "Retina (2×)", value: 2 },
  { label: "Custom", value: -1 },
] as const;

export const FORMAT_OPTIONS: ReadonlyArray<{
  value: OutputFormat;
  label: string;
}> = [
  { value: "png", label: "PNG images (ZIP)" },
  { value: "webp", label: "WebP images (ZIP)" },
  { value: "pdf", label: "PDF document" },
];

export const BUNDLE_OPTIONS: ReadonlyArray<{
  value: OutputBundle;
  label: string;
}> = [
  { value: "standalone", label: "Individual files" },
  { value: "with-pdf", label: "Include PDF bundle" },
];

export const DEFAULT_OUTPUT_SETTINGS: OutputSettings = {
  format: "png",
  scale: 1,
  filenamePattern: "output",
  pageSize: "auto",
  bundle: "standalone",
};

export const SCALE_MIN = 0.1;
export const SCALE_MAX = 5;

export function normalizeOutputSettings(
  raw: Partial<OutputSettings> | undefined | null
): OutputSettings {
  const def = DEFAULT_OUTPUT_SETTINGS;
  if (!raw) return { ...def };

  const format: OutputFormat =
    raw.format === "png" || raw.format === "webp" || raw.format === "pdf"
      ? raw.format
      : def.format;

  const scale =
    typeof raw.scale === "number" && isFinite(raw.scale)
      ? Math.min(SCALE_MAX, Math.max(SCALE_MIN, raw.scale))
      : def.scale;

  const filenamePattern =
    typeof raw.filenamePattern === "string" && raw.filenamePattern.trim().length > 0
      ? raw.filenamePattern.trim()
      : def.filenamePattern;

  const pageSize: PageSizeId =
    raw.pageSize === "auto" ||
    raw.pageSize === "a4-landscape" ||
    raw.pageSize === "a4-portrait" ||
    raw.pageSize === "letter-landscape" ||
    raw.pageSize === "letter-portrait"
      ? raw.pageSize
      : def.pageSize;

  const bundle: OutputBundle =
    raw.bundle === "standalone" || raw.bundle === "with-pdf"
      ? raw.bundle
      : def.bundle;

  return { format, scale, filenamePattern, pageSize, bundle };
}

export function bundleApplies(format: OutputFormat): boolean {
  return format === "png" || format === "webp";
}
