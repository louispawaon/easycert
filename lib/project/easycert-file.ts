import type { AppStateRecord } from "@/lib/db/easycert-db";
import type { TextElement } from "@/types/types";
import {
  migrateTextElement,
  FALLBACK_REFERENCE_DIMENSIONS,
} from "@/lib/canvas/migrate-text-element";

export const EASYCERT_FORMAT = "easycert-project" as const;
/** v1 = legacy pixel-anchor schema. v2 = percentage center-anchor schema. */
export const EASYCERT_FILE_VERSION = 2 as const;
export const EASYCERT_MAX_FILE_BYTES = 50 * 1024 * 1024;

export type EasycertProjectFileV2 = {
  format: typeof EASYCERT_FORMAT;
  version: typeof EASYCERT_FILE_VERSION;
  exportedAt: string;
  app: AppStateRecord;
};

type ParseError = { ok: false; error: string };
type ParseOk = { ok: true; app: AppStateRecord };
export type ParseEasycertResult = ParseError | ParseOk;

function hasBlobUrl(url: string | undefined): boolean {
  return typeof url === "string" && url.startsWith("blob:");
}

function validateFontMap(raw: unknown): Record<string, string> | null {
  if (raw === undefined) return {};
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof k !== "string" || !k.trim()) return null;
    if (typeof v !== "string") return null;
    if (v.startsWith("blob:")) return null;
    out[k] = v;
  }
  return out;
}

function validateAppState(app: unknown): ParseEasycertResult {
  if (!app || typeof app !== "object" || Array.isArray(app)) {
    return { ok: false, error: "Invalid project: app must be an object." };
  }
  const a = app as Record<string, unknown>;

  const certificateImageUrl =
    a.certificateImageUrl === undefined || a.certificateImageUrl === null
      ? undefined
      : typeof a.certificateImageUrl === "string"
        ? a.certificateImageUrl
        : null;
  if (certificateImageUrl === null) {
    return { ok: false, error: "Invalid project: certificateImageUrl must be a string if present." };
  }
  if (hasBlobUrl(certificateImageUrl)) {
    return { ok: false, error: "This file uses blob: URLs for the template, which cannot be moved across browsers. Re-export from the original session using data URLs." };
  }

  let attendeeListText: string | undefined;
  if (a.attendeeListText !== undefined && a.attendeeListText !== null) {
    if (typeof a.attendeeListText !== "string") {
      return { ok: false, error: "Invalid project: attendeeListText must be a string." };
    }
    attendeeListText = a.attendeeListText;
  }

  const fonts = validateFontMap(a.customFonts);
  if (fonts === null) {
    return { ok: false, error: "Invalid project: customFonts must be an object of string URLs (no blob: URLs)." };
  }

  let wizardStep: 0 | 1 | 2 | undefined;
  if (a.wizardStep !== undefined && a.wizardStep !== null) {
    if (a.wizardStep !== 0 && a.wizardStep !== 1 && a.wizardStep !== 2) {
      return { ok: false, error: "Invalid project: wizardStep must be 0, 1, or 2." };
    }
    wizardStep = a.wizardStep;
  }

  if (a.textElements !== undefined && !Array.isArray(a.textElements)) {
    return { ok: false, error: "Invalid project: textElements must be an array." };
  }
  const rawElements = Array.isArray(a.textElements) ? a.textElements : [];

  // Imported files do not carry the original template's natural dimensions, so
  // legacy migration uses the fallback reference. Existing center-anchor data
  // (already 0..1) is unaffected by the choice of reference.
  const textElements: TextElement[] = [];
  for (let i = 0; i < rawElements.length; i++) {
    const el = migrateTextElement(rawElements[i], FALLBACK_REFERENCE_DIMENSIONS);
    if (!el) {
      return { ok: false, error: `Invalid project: textElements[${i}] failed validation.` };
    }
    textElements.push(el);
  }

  const record: AppStateRecord = {
    id: "default",
    ...(certificateImageUrl !== undefined ? { certificateImageUrl } : {}),
    ...(attendeeListText !== undefined ? { attendeeListText } : {}),
    customFonts: fonts,
    textElements,
    ...(wizardStep !== undefined ? { wizardStep } : {}),
  };
  return { ok: true, app: record };
}

/** Parse JSON text from a `.easycert` file (or legacy backup JSON). */
export function parseEasycertJsonString(jsonText: string): ParseEasycertResult {
  if (jsonText.length > EASYCERT_MAX_FILE_BYTES) {
    return { ok: false, error: `File is too large (max ${EASYCERT_MAX_FILE_BYTES / (1024 * 1024)} MB).` };
  }
  let root: unknown;
  try {
    root = JSON.parse(jsonText) as unknown;
  } catch {
    return { ok: false, error: "File is not valid JSON." };
  }
  if (!root || typeof root !== "object" || Array.isArray(root)) {
    return { ok: false, error: "Invalid file structure." };
  }
  const obj = root as Record<string, unknown>;

  if (obj.format === EASYCERT_FORMAT) {
    // Accept both v1 (legacy pixel coords) and v2 (percentages); migrator handles either.
    if (obj.version !== 1 && obj.version !== EASYCERT_FILE_VERSION) {
      return { ok: false, error: `Unsupported .easycert version: ${String(obj.version)}.` };
    }
    if (typeof obj.exportedAt !== "string") {
      return { ok: false, error: "Invalid .easycert file: missing exportedAt." };
    }
    return validateAppState(obj.app);
  }

  // Legacy backup: { exportVersion: 1, exportedAt: number, appState: AppStateRecord }
  if (obj.exportVersion === 1 && obj.appState !== undefined) {
    return validateAppState(obj.appState);
  }

  return { ok: false, error: "Unrecognized file format. Use a .easycert export from EasyCert." };
}

export function buildEasycertProjectFile(app: AppStateRecord): EasycertProjectFileV2 {
  return {
    format: EASYCERT_FORMAT,
    version: EASYCERT_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    app: { ...app, id: "default" },
  };
}

export function serializeEasycertProjectFile(file: EasycertProjectFileV2): string {
  return JSON.stringify(file, null, 2);
}

export function downloadEasycertFile(
  app: AppStateRecord,
  downloadBaseName = "easycert-project"
): void {
  const envelope = buildEasycertProjectFile(app);
  const blob = new Blob([serializeEasycertProjectFile(envelope)], {
    type: "application/vnd.easycert+json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  a.download = `${downloadBaseName}-${stamp}.easycert`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readFileAsUtf8(file: File): Promise<ParseEasycertResult> {
  if (file.size > EASYCERT_MAX_FILE_BYTES) {
    return { ok: false, error: `File is too large (max ${EASYCERT_MAX_FILE_BYTES / (1024 * 1024)} MB).` };
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      resolve(parseEasycertJsonString(text));
    };
    reader.onerror = () => resolve({ ok: false, error: "Could not read the file." });
    reader.readAsText(file, "UTF-8");
  });
}
