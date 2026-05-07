import type { TextElement, ImageDimensions } from "@/types/types";
import { setCustomFontsCache } from "@/lib/fonts-cache";
import type { WizardStepIndex } from "@/store/designer-ui-store";
import {
  notifyCertificateImageCleared,
  notifyCertificateImageUploaded,
} from "@/store/certificate-image-bridge";
import {
  hasLegacyTextElements,
  migrateTextElements,
} from "@/lib/canvas/migrate-text-element";
import { loadCertificateTemplateImage } from "@/lib/cert-template-image";
import {
  easyCertDb,
  type AppStateRecord,
  type AppStateId,
  type AttendeeEntryTab,
} from "./easycert-db";

const DEFAULT_ID: AppStateId = "default";

/** Set by migrate when legacy localStorage fonts JSON fails to parse — UI may toast once. */
export const SESSION_LEGACY_FONTS_PARSE_FAILED_KEY =
  "easycert_session_legacy_fonts_json_parse_failed";

function stripInvalidBlobFonts(fonts: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, url] of Object.entries(fonts)) {
    if (typeof url !== "string") continue;
    if (url.startsWith("blob:")) continue;
    out[name] = url;
  }
  return out;
}

/** Stored fonts include ephemeral blob URLs that must be stripped from IndexedDB/cache. */
function customFontsNeedsBlobSanitize(fonts: Record<string, string> | undefined): boolean {
  if (!fonts) return false;
  return Object.values(fonts).some(
    (u) => typeof u === "string" && u.startsWith("blob:")
  );
}

async function getOrCreateRow(): Promise<AppStateRecord> {
  const row = await easyCertDb.appState.get(DEFAULT_ID);
  if (row) return row;
  const fresh: AppStateRecord = {
    id: DEFAULT_ID,
    customFonts: {},
    textElements: [],
    wizardStep: 0,
    savedAt: Date.now(),
  };
  await easyCertDb.appState.put(fresh);
  return fresh;
}

async function patchAppState(partial: Partial<Omit<AppStateRecord, "id">>): Promise<void> {
  const cur = await getOrCreateRow();
  const next: AppStateRecord = {
    id: DEFAULT_ID,
    certificateImageUrl: cur.certificateImageUrl,
    attendeeListText: cur.attendeeListText,
    attendeeEntryTab: cur.attendeeEntryTab,
    customFonts: cur.customFonts ?? {},
    textElements: cur.textElements ?? [],
    wizardStep: cur.wizardStep ?? 0,
    ...partial,
    savedAt: Date.now(),
  };
  await easyCertDb.appState.put(next);
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

  const img = localStorage.getItem("certificateImageUrl");
  const attendees = localStorage.getItem("attendeeList");
  const fontsRaw = localStorage.getItem("customFonts");

  const current = await easyCertDb.appState.get(DEFAULT_ID);
  let customFonts = current?.customFonts ?? {};
  if (fontsRaw) {
    try {
      const parsed = JSON.parse(fontsRaw) as Record<string, string>;
      customFonts = { ...customFonts, ...parsed };
    } catch (err) {
      console.warn("[EasycertLegacyFontsParse] Failed JSON.parse(customFonts)", err);
      try {
        sessionStorage.setItem(SESSION_LEGACY_FONTS_PARSE_FAILED_KEY, "1");
      } catch {
        /* ignore quota / unavailable */
      }
      /* Persist continues with IndexedDB/customFonts subset only; stripped below. */
    }
  }
  customFonts = stripInvalidBlobFonts(customFonts);

  const next: AppStateRecord = {
    id: DEFAULT_ID,
    certificateImageUrl: current?.certificateImageUrl ?? img ?? undefined,
    attendeeListText: current?.attendeeListText ?? (attendees !== null ? attendees : undefined),
    attendeeEntryTab: current?.attendeeEntryTab,
    customFonts,
    textElements: current?.textElements ?? [],
    wizardStep: current?.wizardStep ?? 0,
    savedAt: Date.now(),
  };
  await easyCertDb.appState.put(next);
  setCustomFontsCache(next.customFonts ?? {});

  localStorage.removeItem("certificateImageUrl");
  localStorage.removeItem("attendeeList");
  localStorage.removeItem("customFonts");
}

async function probeImageDimensions(url: string | undefined): Promise<ImageDimensions | undefined> {
  if (!url) return undefined;
  try {
    const { dimensions } = await loadCertificateTemplateImage(url);
    return dimensions;
  } catch {
    return undefined;
  }
}

/**
 * Rewrite stored text elements to the new percentage/center-anchor schema when
 * the loaded record still uses the legacy pixel layout. Idempotent: returns
 * silently when nothing needs migrating.
 */
async function migrateTextElementsIfNeeded(): Promise<void> {
  const row = await easyCertDb.appState.get(DEFAULT_ID);
  if (!row || !Array.isArray(row.textElements) || row.textElements.length === 0) return;
  if (!hasLegacyTextElements(row.textElements)) return;

  const dims = await probeImageDimensions(row.certificateImageUrl);
  const migrated = migrateTextElements(row.textElements, dims);
  await patchAppState({ textElements: migrated });
}

let hydrateInFlight: Promise<void> | null = null;

/** Migrate legacy LS, sync caches, sanitize blob font URLs — idempotent. */
async function hydrateCachesFromDbInner(): Promise<void> {
  await migrateFromLocalStorage();
  const row = await easyCertDb.appState.get(DEFAULT_ID);
  setCustomFontsCache(stripInvalidBlobFonts(row?.customFonts ?? {}));
  if (
    row?.customFonts &&
    customFontsNeedsBlobSanitize(row.customFonts)
  ) {
    await patchAppState({ customFonts: stripInvalidBlobFonts(row.customFonts) });
  }
  await migrateTextElementsIfNeeded();
}

/** Deduplicate concurrent hydrate (Dexie ready + loadAppState + imports). */
export async function ensureHydrated(): Promise<void> {
  if (hydrateInFlight) return hydrateInFlight;
  hydrateInFlight = hydrateCachesFromDbInner().finally(() => {
    hydrateInFlight = null;
  });
  return hydrateInFlight;
}

easyCertDb.on("ready", () => {
  void ensureHydrated();
});

export async function saveCertificateImage(url: string | null): Promise<void> {
  await patchAppState({
    certificateImageUrl: url ?? undefined,
  });
}

export async function saveAttendeeListText(text: string): Promise<void> {
  await patchAppState({ attendeeListText: text });
}

export async function saveAttendeeEntryTab(tab: AttendeeEntryTab): Promise<void> {
  await patchAppState({ attendeeEntryTab: tab });
}

export async function saveCustomFonts(fonts: Record<string, string>): Promise<void> {
  await patchAppState({ customFonts: stripInvalidBlobFonts(fonts) });
}

export async function saveTextElements(elements: TextElement[]): Promise<void> {
  await patchAppState({ textElements: elements });
}

export async function saveWizardStep(step: WizardStepIndex): Promise<void> {
  await patchAppState({ wizardStep: step });
}

/** Open DB, run legacy migration + font cache sync, then read the active row. */
export async function loadAppState(): Promise<AppStateRecord | null> {
  await easyCertDb.open();
  await ensureHydrated();
  const row = await easyCertDb.appState.get(DEFAULT_ID);
  return row ?? null;
}

/** Clear the active project in this browser (template, attendees, design, fonts). */
export async function resetDefaultProject(): Promise<void> {
  await easyCertDb.open();
  await ensureHydrated();
  const cleared: AppStateRecord = {
    id: DEFAULT_ID,
    customFonts: {},
    textElements: [],
    wizardStep: 0,
    savedAt: Date.now(),
  };
  await easyCertDb.appState.put(cleared);
  setCustomFontsCache({});
  notifyCertificateImageCleared();
}

/** Replace IndexedDB project with validated import; sync caches and image staging events. */
export async function applyImportedAppState(src: AppStateRecord): Promise<void> {
  await easyCertDb.open();
  await ensureHydrated();
  const next: AppStateRecord = {
    id: DEFAULT_ID,
    certificateImageUrl: src.certificateImageUrl,
    attendeeListText: src.attendeeListText,
    attendeeEntryTab: src.attendeeEntryTab,
    customFonts: stripInvalidBlobFonts(src.customFonts ?? {}),
    textElements: src.textElements ?? [],
    wizardStep: 0,
    savedAt: Date.now(),
  };
  await easyCertDb.appState.put(next);
  setCustomFontsCache(next.customFonts ?? {});
  if (next.certificateImageUrl) {
    notifyCertificateImageUploaded(next.certificateImageUrl);
  } else {
    notifyCertificateImageCleared();
  }
}
