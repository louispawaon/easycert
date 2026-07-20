import type { TextElement, DesignElement, ImageDimensions } from "@/types/types";
import { isTextElement } from "@/types/types";
import { setCustomFontsCache } from "@/lib/fonts-cache";
import type { WizardStepIndex } from "@/store/designer-ui-store";
import {
  notifyTemplateImageCleared,
  notifyTemplateImageUploaded,
} from "@/store/template-image-bridge";
import {
  hasLegacyTextElements,
  migrateTextElements,
} from "@/lib/canvas/migrate-text-element";
import { loadTemplateImage } from "@/lib/template-image";
import { defaultFilenameColumn } from "@/lib/records/record-dataset";
import type { RecordTable } from "@/lib/db/ditto-db";
import { DEFAULT_OUTPUT_SETTINGS, type OutputSettings } from "@/lib/output/output-settings";
import type { GenerationReport } from "@/lib/output/generation-report";
import {
  dittoDb,
  type AppStateRecord,
  type AppStateId,
  type RecordEntryTab,
  type RecordManualMode,
} from "./ditto-db";

const DEFAULT_ID: AppStateId = "default";

export const SESSION_LEGACY_FONTS_PARSE_FAILED_KEY =
  "ditto_session_legacy_fonts_json_parse_failed";

function stripInvalidBlobFonts(fonts: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, url] of Object.entries(fonts)) {
    if (typeof url !== "string") continue;
    if (url.startsWith("blob:")) continue;
    out[name] = url;
  }
  return out;
}

function customFontsNeedsBlobSanitize(fonts: Record<string, string> | undefined): boolean {
  if (!fonts) return false;
  return Object.values(fonts).some(
    (u) => typeof u === "string" && u.startsWith("blob:")
  );
}

function normalizeAppStateRecord(row: AppStateRecord): AppStateRecord {
  const raw = row as unknown as Record<string, unknown>;
  return {
    ...row,
    templateImageUrl: (row.templateImageUrl ?? raw.certificateImageUrl) as string | undefined,
    recordListText: (row.recordListText ?? raw.attendeeListText) as string | undefined,
    recordTable: (row.recordTable ?? raw.attendeeTable) as RecordTable | undefined,
    recordEntryTab: (row.recordEntryTab ?? raw.attendeeEntryTab) as RecordEntryTab | undefined,
  };
}

async function getOrCreateRow(): Promise<AppStateRecord> {
  const row = await dittoDb.appState.get(DEFAULT_ID);
  if (row) return normalizeAppStateRecord(row);
  const fresh: AppStateRecord = {
    id: DEFAULT_ID,
    customFonts: {},
    designElements: [],
    wizardStep: 0,
    savedAt: Date.now(),
  };
  await dittoDb.appState.put(fresh);
  return fresh;
}

async function patchAppState(partial: Partial<Omit<AppStateRecord, "id">>): Promise<void> {
  const cur = await getOrCreateRow();
  const initialDesignElements: DesignElement[] | undefined = cur.designElements;
  const resolvedDesignElements = initialDesignElements && initialDesignElements.length > 0
    ? initialDesignElements
    : (cur.textElements as DesignElement[] | undefined) ?? [];
  const next: AppStateRecord = {
    id: DEFAULT_ID,
    templateImageUrl: cur.templateImageUrl,
    recordListText: cur.recordListText,
    recordTable: cur.recordTable,
    filenameColumn: cur.filenameColumn,
    recordEntryTab: cur.recordEntryTab,
    recordManualMode: cur.recordManualMode,
    customFonts: cur.customFonts ?? {},
    designElements: resolvedDesignElements,
    issuer: cur.issuer,
    wizardStep: cur.wizardStep ?? 0,
    outputSettings: cur.outputSettings,
    lastGenerationReport: cur.lastGenerationReport,
    ...partial,
    savedAt: Date.now(),
  };
  delete next.textElements;
  await dittoDb.appState.put(next);
  if (partial.customFonts !== undefined) {
    setCustomFontsCache(next.customFonts ?? {});
  }
}

export async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === "undefined") return;

  const hasLegacy =
    localStorage.getItem("certificateImageUrl") !== null ||
    localStorage.getItem("attendeeList") !== null ||
    localStorage.getItem("customFonts") !== null;
  if (!hasLegacy) return;

  const legacyImageUrl = localStorage.getItem("certificateImageUrl");
  const legacyRecordList = localStorage.getItem("attendeeList");
  const fontsRaw = localStorage.getItem("customFonts");

  const current = await dittoDb.appState.get(DEFAULT_ID);
  let customFonts = current?.customFonts ?? {};
  if (fontsRaw) {
    try {
      const parsed = JSON.parse(fontsRaw) as Record<string, string>;
      customFonts = { ...customFonts, ...parsed };
    } catch (err) {
      console.warn("[DittoLegacyFontsParse] Failed JSON.parse(customFonts)", err);
      try {
        sessionStorage.setItem(SESSION_LEGACY_FONTS_PARSE_FAILED_KEY, "1");
      } catch {
        /* ignore quota / unavailable */
      }
    }
  }
  customFonts = stripInvalidBlobFonts(customFonts);

  const next: AppStateRecord = {
    id: DEFAULT_ID,
    templateImageUrl: current?.templateImageUrl ?? legacyImageUrl ?? undefined,
    recordListText: current?.recordListText ?? (legacyRecordList !== null ? legacyRecordList : undefined),
    recordTable: current?.recordTable,
    filenameColumn: current?.filenameColumn,
    recordEntryTab: current?.recordEntryTab,
    customFonts,
    designElements: current?.designElements ?? (current?.textElements as DesignElement[]) ?? [],
    issuer: current?.issuer,
    wizardStep: current?.wizardStep ?? 0,
    outputSettings: current?.outputSettings,
    savedAt: Date.now(),
  };
  await dittoDb.appState.put(next);
  setCustomFontsCache(next.customFonts ?? {});

  localStorage.removeItem("certificateImageUrl");
  localStorage.removeItem("attendeeList");
  localStorage.removeItem("customFonts");
}

async function probeImageDimensions(url: string | undefined): Promise<ImageDimensions | undefined> {
  if (!url) return undefined;
  try {
    const { dimensions } = await loadTemplateImage(url);
    return dimensions;
  } catch {
    return undefined;
  }
}

async function migrateDesignElementsIfNeeded(): Promise<void> {
  const row = await dittoDb.appState.get(DEFAULT_ID);
  if (!row) return;

  const hasDesignElements = Array.isArray(row.designElements) && row.designElements.length > 0;
  const hasTextElements = Array.isArray(row.textElements) && row.textElements.length > 0;

  if (hasDesignElements) {
    const textElementsOnly = row.designElements!.filter(isTextElement);
    const hasLegacyText = hasLegacyTextElements(textElementsOnly);
    const hasLegacyQr = row.designElements!.some(
      (el) => !isTextElement(el) && (el as Record<string, unknown>).type === "qr"
    );
    if (!hasLegacyText && !hasLegacyQr) return;

    const dims = hasLegacyText ? await probeImageDimensions(row.templateImageUrl) : undefined;
    const migratedText = hasLegacyText
      ? migrateTextElements(textElementsOnly, dims)
      : textElementsOnly;
    const nonTextElements = row.designElements!.filter((el) => !isTextElement(el));
    const normalizedNonText = nonTextElements.map((el) => {
      if ((el as Record<string, unknown>).type === "qr") {
        return { ...el, type: "proof-link" as const };
      }
      return el;
    });
    const merged: DesignElement[] = [...migratedText, ...normalizedNonText];
    await patchAppState({ designElements: merged });
    return;
  }

  if (hasTextElements) {
    const dims = await probeImageDimensions(row.templateImageUrl);
    const migrated = migrateTextElements(row.textElements!, dims);
    await patchAppState({ designElements: migrated as DesignElement[] });
  }
}

let hydrateInFlight: Promise<void> | null = null;

async function hydrateCachesFromDbInner(): Promise<void> {
  await migrateFromLocalStorage();
  const row = await dittoDb.appState.get(DEFAULT_ID);
  setCustomFontsCache(stripInvalidBlobFonts(row?.customFonts ?? {}));
  if (
    row?.customFonts &&
    customFontsNeedsBlobSanitize(row.customFonts)
  ) {
    await patchAppState({ customFonts: stripInvalidBlobFonts(row.customFonts) });
  }
  await migrateDesignElementsIfNeeded();
}

export async function ensureHydrated(): Promise<void> {
  if (hydrateInFlight) return hydrateInFlight;
  hydrateInFlight = hydrateCachesFromDbInner().finally(() => {
    hydrateInFlight = null;
  });
  return hydrateInFlight;
}

dittoDb.on("ready", () => {
  void ensureHydrated();
});

export async function saveTemplateImage(url: string | null): Promise<void> {
  await patchAppState({
    templateImageUrl: url ?? undefined,
  });
}

export async function saveRecordListText(text: string): Promise<void> {
  await patchAppState({
    recordListText: text,
    recordTable: undefined,
    filenameColumn: undefined,
  });
}

export async function saveRecordTable(
  table: RecordTable,
  recordListMirror: string,
  filenameColumnHint?: string
): Promise<void> {
  const filenameColumn =
    filenameColumnHint ??
    defaultFilenameColumn(table.headers) ??
    table.headers[0];
  await patchAppState({
    recordTable: table,
    recordListText: recordListMirror,
    filenameColumn: table.headers.length > 0 ? filenameColumn : undefined,
  });
}

export async function saveFilenameColumn(headerKey: string | undefined): Promise<void> {
  await patchAppState({ filenameColumn: headerKey });
}

export async function saveRecordEntryTab(tab: RecordEntryTab): Promise<void> {
  await patchAppState({ recordEntryTab: tab });
}

export async function saveRecordManualMode(mode: RecordManualMode): Promise<void> {
  await patchAppState({ recordManualMode: mode });
}

export async function saveCustomFonts(fonts: Record<string, string>): Promise<void> {
  await patchAppState({ customFonts: stripInvalidBlobFonts(fonts) });
}

export async function saveDesignElements(elements: DesignElement[]): Promise<void> {
  await patchAppState({ designElements: elements });
}

export async function saveIssuer(issuer: string | undefined): Promise<void> {
  await patchAppState({ issuer: issuer === "" ? undefined : issuer });
}

export async function saveWizardStep(step: WizardStepIndex): Promise<void> {
  await patchAppState({ wizardStep: step });
}

export async function loadAppState(): Promise<AppStateRecord | null> {
  await dittoDb.open();
  await ensureHydrated();
  const row = await dittoDb.appState.get(DEFAULT_ID);
  return row ?? null;
}

export async function resetDefaultProject(): Promise<void> {
  await dittoDb.open();
  await ensureHydrated();
  const cleared: AppStateRecord = {
    id: DEFAULT_ID,
    customFonts: {},
    designElements: [],
    wizardStep: 0,
    savedAt: Date.now(),
  };
  await dittoDb.appState.put(cleared);
  setCustomFontsCache({});
  notifyTemplateImageCleared();
}

export async function applyImportedAppState(src: AppStateRecord): Promise<void> {
  await dittoDb.open();
  await ensureHydrated();
  const normalized = normalizeAppStateRecord(src);
  const next: AppStateRecord = {
    id: DEFAULT_ID,
    templateImageUrl: normalized.templateImageUrl,
    recordListText: normalized.recordListText,
    recordTable: normalized.recordTable,
    filenameColumn: normalized.filenameColumn,
    recordEntryTab: normalized.recordEntryTab,
    recordManualMode: normalized.recordManualMode,
    customFonts: stripInvalidBlobFonts(normalized.customFonts ?? {}),
    designElements: normalized.designElements ?? (normalized.textElements as DesignElement[]) ?? [],
    issuer: normalized.issuer,
    wizardStep: 0,
    outputSettings: normalized.outputSettings,
    savedAt: Date.now(),
  };
  await dittoDb.appState.put(next);
  setCustomFontsCache(next.customFonts ?? {});
  if (next.templateImageUrl) {
    notifyTemplateImageUploaded(next.templateImageUrl);
  } else {
    notifyTemplateImageCleared();
  }
}

export async function saveOutputSettings(settings: OutputSettings): Promise<void> {
  await patchAppState({ outputSettings: settings });
}

export async function saveLastGenerationReport(report: GenerationReport): Promise<void> {
  await patchAppState({ lastGenerationReport: report });
}

export async function clearLastGenerationReport(): Promise<void> {
  await patchAppState({ lastGenerationReport: undefined });
}

/** @deprecated Use `saveRecordListText` instead. */
export { saveRecordListText as saveAttendeeListText };
/** @deprecated Use `saveRecordTable` instead. */
export { saveRecordTable as saveAttendeeTable };
/** @deprecated Use `saveRecordEntryTab` instead. */
export { saveRecordEntryTab as saveAttendeeEntryTab };
