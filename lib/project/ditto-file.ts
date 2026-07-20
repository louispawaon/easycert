import type { AppStateRecord } from "@/lib/db/ditto-db";
import type { TextElement, DesignElement, ProofLinkElement } from "@/types/types";
import {
  migrateTextElement,
  FALLBACK_REFERENCE_DIMENSIONS,
} from "@/lib/canvas/migrate-text-element";
import { normalizeProofLinkSizePct } from "@/lib/canvas/proof-link-render";
import { normalizeOutputSettings } from "@/lib/output/output-settings";
import type { OutputSettings } from "@/lib/output/output-settings";

export const DITTO_FORMAT = "ditto-project" as const;
export const DITTO_FILE_VERSION = 5 as const;
export const DITTO_MAX_FILE_BYTES = 50 * 1024 * 1024;

export type DittoProjectFile = {
  format: typeof DITTO_FORMAT;
  version: typeof DITTO_FILE_VERSION;
  exportedAt: string;
  app: AppStateRecord;
};

type ParseError = { ok: false; error: string };
type ParseOk = { ok: true; app: AppStateRecord };
export type ParseResult = ParseError | ParseOk;

const LEGACY_FORMAT = "easycert-project" as const;

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

function isValidDesignElement(raw: unknown): raw is DesignElement {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const el = raw as Record<string, unknown>;
  if (typeof el.id !== "string" || !el.id.trim()) return false;
  if (el.type === "name" || el.type === "dynamic-text" || el.type === "static") {
    return migrateTextElement(raw, FALLBACK_REFERENCE_DIMENSIONS) !== null;
  }
  if (el.type === "qr" || el.type === "proof-link") {
    return (
      typeof el.x === "number" &&
      typeof el.y === "number" &&
      typeof el.sizePct === "number" &&
      typeof el.color === "string" &&
      typeof el.bgColor === "string" &&
      typeof el.urlTemplate === "string"
    );
  }
  return false;
}

function validateAppState(app: unknown): ParseResult {
  if (!app || typeof app !== "object" || Array.isArray(app)) {
    return { ok: false, error: "Invalid project: app must be an object." };
  }
  const a = app as Record<string, unknown>;

  const templateImageUrl =
    a.templateImageUrl === undefined || a.templateImageUrl === null
      ? (a.certificateImageUrl === undefined || a.certificateImageUrl === null
          ? undefined
          : typeof a.certificateImageUrl === "string"
            ? a.certificateImageUrl
            : null)
      : typeof a.templateImageUrl === "string"
        ? a.templateImageUrl
        : null;
  if (templateImageUrl === null) {
    return { ok: false, error: "Invalid project: templateImageUrl must be a string if present." };
  }
  if (hasBlobUrl(templateImageUrl)) {
    return { ok: false, error: "This file uses blob: URLs for the template, which cannot be moved across browsers. Re-export from the original session using data URLs." };
  }

  let recordListText: string | undefined;
  const rawRecordListText = a.recordListText !== undefined ? a.recordListText : a.attendeeListText;
  if (rawRecordListText !== undefined && rawRecordListText !== null) {
    if (typeof rawRecordListText !== "string") {
      return { ok: false, error: "Invalid project: recordListText must be a string." };
    }
    recordListText = rawRecordListText;
  }

  let recordTable: AppStateRecord["recordTable"];
  const rawRecordTable = a.recordTable !== undefined ? a.recordTable : a.attendeeTable;
  if (rawRecordTable !== undefined && rawRecordTable !== null) {
    if (typeof rawRecordTable !== "object" || Array.isArray(rawRecordTable)) {
      return { ok: false, error: "Invalid project: recordTable must be an object." };
    }
    const tbl = rawRecordTable as Record<string, unknown>;
    if (!Array.isArray(tbl.headers) || tbl.headers.some((h) => typeof h !== "string")) {
      return { ok: false, error: "Invalid project: recordTable.headers must be an array of strings." };
    }
    if (!Array.isArray(tbl.rows)) {
      return { ok: false, error: "Invalid project: recordTable.rows must be an array." };
    }
    const headerCount = tbl.headers.length;
    if (headerCount === 0) {
      return { ok: false, error: "Invalid project: recordTable.headers cannot be empty." };
    }
    const normRows: string[][] = [];
    for (let r = 0; r < tbl.rows.length; r++) {
      const cells = tbl.rows[r];
      if (!Array.isArray(cells)) {
        return { ok: false, error: `Invalid project: recordTable.rows[${r}] must be an array.` };
      }
      if (!cells.every((cell) => typeof cell === "string")) {
        return { ok: false, error: `Invalid project: recordTable.rows[${r}] must contain only strings.` };
      }
      const row = [...cells.map((c) => c)].slice(0, headerCount);
      while (row.length < headerCount) row.push("");
      normRows.push(row);
    }
    recordTable = { headers: tbl.headers as string[], rows: normRows };
  }

  let filenameColumn: string | undefined;
  if (a.filenameColumn !== undefined && a.filenameColumn !== null) {
    if (typeof a.filenameColumn !== "string") {
      return { ok: false, error: "Invalid project: filenameColumn must be a string when present." };
    }
    const fc = a.filenameColumn.trim();
    filenameColumn = fc.length > 0 ? fc : undefined;
  }

  let wizardStep: 0 | 1 | 2 | undefined;
  if (a.wizardStep !== undefined && a.wizardStep !== null) {
    if (a.wizardStep !== 0 && a.wizardStep !== 1 && a.wizardStep !== 2) {
      return { ok: false, error: "Invalid project: wizardStep must be 0, 1, or 2." };
    }
    wizardStep = a.wizardStep;
  }

  let recordEntryTab: AppStateRecord["recordEntryTab"];
  const rawRecordEntryTab = a.recordEntryTab !== undefined ? a.recordEntryTab : a.attendeeEntryTab;
  if (rawRecordEntryTab !== undefined && rawRecordEntryTab !== null) {
    if (rawRecordEntryTab !== "upload" && rawRecordEntryTab !== "manual") {
      return { ok: false, error: 'Invalid project: recordEntryTab must be "upload" or "manual".' };
    }
    recordEntryTab = rawRecordEntryTab;
  }

  let recordManualMode: AppStateRecord["recordManualMode"];
  if (a.recordManualMode !== undefined && a.recordManualMode !== null) {
    if (a.recordManualMode !== "simple" && a.recordManualMode !== "table" && a.recordManualMode !== "json") {
      return { ok: false, error: 'Invalid project: recordManualMode must be "simple", "table", or "json".' };
    }
    recordManualMode = a.recordManualMode;
  }

  const fonts = validateFontMap(a.customFonts);
  if (fonts === null) {
    return { ok: false, error: "Invalid project: customFonts must be an object of string URLs (no blob: URLs)." };
  }

  let issuer: string | undefined;

  function normalizeProofLinkDefaults(el: DesignElement): DesignElement {
    const elType = (el as Record<string, unknown>).type;
    if (elType !== "qr" && elType !== "proof-link") return el;
    const pl = el as ProofLinkElement;
    let next = { ...pl };
    if (typeof pl.transparentBg !== "boolean") {
      next.transparentBg = false;
    }
    if (elType === "qr") {
      next.type = "proof-link" as const;
    }
    if (next.sizePct !== normalizeProofLinkSizePct(next.sizePct)) {
      next.sizePct = normalizeProofLinkSizePct(next.sizePct);
    }
    return next as DesignElement;
  }
  if (a.issuer !== undefined && a.issuer !== null) {
    if (typeof a.issuer !== "string") {
      return { ok: false, error: "Invalid project: issuer must be a string." };
    }
    issuer = a.issuer.trim() || undefined;
  }

  let designElements: DesignElement[] | undefined;

  if (a.designElements !== undefined && a.designElements !== null) {
    if (!Array.isArray(a.designElements)) {
      return { ok: false, error: "Invalid project: designElements must be an array." };
    }
    designElements = [];
    for (let i = 0; i < a.designElements.length; i++) {
      if (!isValidDesignElement(a.designElements[i])) {
        return { ok: false, error: `Invalid project: designElements[${i}] failed validation.` };
      }
      designElements.push(a.designElements[i] as DesignElement);
    }
  } else if (a.textElements !== undefined && a.textElements !== null) {
    if (!Array.isArray(a.textElements)) {
      return { ok: false, error: "Invalid project: textElements must be an array." };
    }
    const rawElements = a.textElements as unknown[];
    const migrated: TextElement[] = [];
    for (let i = 0; i < rawElements.length; i++) {
      const el = migrateTextElement(rawElements[i], FALLBACK_REFERENCE_DIMENSIONS);
      if (!el) {
        return { ok: false, error: `Invalid project: textElements[${i}] failed validation.` };
      }
      migrated.push(el);
    }
    designElements = migrated;
  } else {
    designElements = [];
  }

  let outputSettings: OutputSettings | undefined;
  if (a.outputSettings !== undefined && a.outputSettings !== null) {
    if (typeof a.outputSettings !== "object" || Array.isArray(a.outputSettings)) {
      return { ok: false, error: "Invalid project: outputSettings must be an object." };
    }
    outputSettings = normalizeOutputSettings(a.outputSettings as Partial<OutputSettings>);
  }

  if (designElements) {
    designElements = designElements.map(normalizeProofLinkDefaults);
  }

  const record: AppStateRecord = {
    id: "default",
    ...(templateImageUrl !== undefined ? { templateImageUrl } : {}),
    ...(recordListText !== undefined ? { recordListText } : {}),
    ...(recordTable !== undefined ? { recordTable } : {}),
    ...(filenameColumn !== undefined ? { filenameColumn } : {}),
    ...(recordEntryTab !== undefined ? { recordEntryTab } : {}),
    ...(recordManualMode !== undefined ? { recordManualMode } : {}),
    customFonts: fonts,
    designElements,
    ...(issuer !== undefined ? { issuer } : {}),
    ...(wizardStep !== undefined ? { wizardStep } : {}),
    ...(outputSettings !== undefined ? { outputSettings } : {}),
  };
  return { ok: true, app: record };
}

export function parseProjectJson(jsonText: string): ParseResult {
  if (jsonText.length > DITTO_MAX_FILE_BYTES) {
    return { ok: false, error: `File is too large (max ${DITTO_MAX_FILE_BYTES / (1024 * 1024)} MB).` };
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

  if (obj.format === DITTO_FORMAT || obj.format === LEGACY_FORMAT) {
    if (obj.version !== 1 && obj.version !== 2 && obj.version !== 3 && obj.version !== 4 && obj.version !== DITTO_FILE_VERSION) {
      return { ok: false, error: `Unsupported project version: ${String(obj.version)}.` };
    }
    if (typeof obj.exportedAt !== "string") {
      return { ok: false, error: "Invalid project file: missing exportedAt." };
    }
    return validateAppState(obj.app);
  }

  if (obj.exportVersion === 1 && obj.appState !== undefined) {
    return validateAppState(obj.appState);
  }

  return { ok: false, error: "Unrecognized file format. Use a project export from Ditto." };
}

export function buildProjectFile(app: AppStateRecord): DittoProjectFile {
  return {
    format: DITTO_FORMAT,
    version: DITTO_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    app: { ...app, id: "default" },
  };
}

export function serializeProjectFile(file: DittoProjectFile): string {
  return JSON.stringify(file, null, 2);
}

export function downloadProjectFile(
  app: AppStateRecord,
  downloadBaseName = "ditto-project"
): void {
  if (typeof document === "undefined") return;

  const envelope = buildProjectFile(app);
  const blob = new Blob([serializeProjectFile(envelope)], {
    type: "application/vnd.ditto+json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  a.download = `${downloadBaseName}-${stamp}.ditto`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function readFileAsUtf8(file: File): Promise<ParseResult> {
  if (file.size > DITTO_MAX_FILE_BYTES) {
    return { ok: false, error: `File is too large (max ${DITTO_MAX_FILE_BYTES / (1024 * 1024)} MB).` };
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      resolve(parseProjectJson(text));
    };
    reader.onerror = () => resolve({ ok: false, error: "Could not read the file." });
    reader.readAsText(file, "UTF-8");
  });
}
