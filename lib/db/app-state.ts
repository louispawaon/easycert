import type { TextElement } from "@/types/types";
import { setCustomFontsCache } from "@/lib/fonts-cache";
import {
  notifyCertificateImageCleared,
  notifyCertificateImageUploaded,
} from "@/store/certificate-image-bridge";
import { isRestorableProject } from "@/lib/db/session-utils";
import {
  easyCertDb,
  type AppStateRecord,
  type AppStateId,
  type SessionRecoveryId,
} from "./easycert-db";

const DEFAULT_ID: AppStateId = "default";

function stripInvalidBlobFonts(fonts: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, url] of Object.entries(fonts)) {
    if (typeof url !== "string") continue;
    if (url.startsWith("blob:")) continue;
    out[name] = url;
  }
  return out;
}

async function getOrCreateRow(): Promise<AppStateRecord> {
  const row = await easyCertDb.appState.get(DEFAULT_ID);
  if (row) return row;
  const fresh: AppStateRecord = {
    id: DEFAULT_ID,
    customFonts: {},
    textElements: [],
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
    customFonts: cur.customFonts ?? {},
    textElements: cur.textElements ?? [],
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
    } catch {
      /* ignore */
    }
  }
  customFonts = stripInvalidBlobFonts(customFonts);

  const next: AppStateRecord = {
    id: DEFAULT_ID,
    certificateImageUrl: current?.certificateImageUrl ?? img ?? undefined,
    attendeeListText: current?.attendeeListText ?? (attendees !== null ? attendees : undefined),
    customFonts,
    textElements: current?.textElements ?? [],
    savedAt: Date.now(),
  };
  await easyCertDb.appState.put(next);
  setCustomFontsCache(next.customFonts ?? {});

  localStorage.removeItem("certificateImageUrl");
  localStorage.removeItem("attendeeList");
  localStorage.removeItem("customFonts");
}

/** Run after DB open: migrate legacy keys and sync font cache from DB. */
export async function hydrateCachesFromDb(): Promise<void> {
  await migrateFromLocalStorage();
  const row = await easyCertDb.appState.get(DEFAULT_ID);
  setCustomFontsCache(stripInvalidBlobFonts(row?.customFonts ?? {}));
  if (row?.customFonts && JSON.stringify(stripInvalidBlobFonts(row.customFonts)) !== JSON.stringify(row.customFonts)) {
    await patchAppState({ customFonts: stripInvalidBlobFonts(row.customFonts) });
  }
}

// Fire-and-forget: do not return a Promise or Dexie will block db.open() on this work,
// which can deadlock or stall the UI gate that awaits open().
easyCertDb.on("ready", () => {
  void hydrateCachesFromDb();
});

export async function saveCertificateImage(url: string | null): Promise<void> {
  await patchAppState({
    certificateImageUrl: url ?? undefined,
  });
}

export async function saveAttendeeListText(text: string): Promise<void> {
  await patchAppState({ attendeeListText: text });
}

export async function saveCustomFonts(fonts: Record<string, string>): Promise<void> {
  await patchAppState({ customFonts: stripInvalidBlobFonts(fonts) });
}

export async function saveTextElements(elements: TextElement[]): Promise<void> {
  await patchAppState({ textElements: elements });
}

/** Open DB, run legacy migration + font cache sync, then read the active row. */
export async function loadAppState(): Promise<AppStateRecord | undefined> {
  await easyCertDb.open();
  await hydrateCachesFromDb();
  return easyCertDb.appState.get(DEFAULT_ID);
}

const RECOVERY_ID: SessionRecoveryId = "last-discarded";

/** Snapshot JSON download + recovery row + cleared `default` project. */
export async function discardActiveSessionToRecovery(
  snapshot: AppStateRecord
): Promise<void> {
  await easyCertDb.open();
  await hydrateCachesFromDb();
  await easyCertDb.sessionRecovery.put({
    id: RECOVERY_ID,
    payload: { ...snapshot },
    discardedAt: Date.now(),
  });
  const cleared: AppStateRecord = {
    id: DEFAULT_ID,
    customFonts: {},
    textElements: [],
    savedAt: Date.now(),
  };
  await easyCertDb.appState.put(cleared);
  setCustomFontsCache({});
  notifyCertificateImageCleared();
}

/** Copy current `default` project to `last-discarded` recovery (no download). */
export async function stashCurrentProjectAsRecovery(): Promise<void> {
  await easyCertDb.open();
  await hydrateCachesFromDb();
  const row = await easyCertDb.appState.get(DEFAULT_ID);
  if (!row || !isRestorableProject(row)) return;
  await easyCertDb.sessionRecovery.put({
    id: RECOVERY_ID,
    payload: { ...row },
    discardedAt: Date.now(),
  });
}

/** Replace IndexedDB project with validated import; sync caches and image staging events. */
export async function applyImportedAppState(src: AppStateRecord): Promise<void> {
  await easyCertDb.open();
  await hydrateCachesFromDb();
  const next: AppStateRecord = {
    id: DEFAULT_ID,
    certificateImageUrl: src.certificateImageUrl,
    attendeeListText: src.attendeeListText,
    customFonts: stripInvalidBlobFonts(src.customFonts ?? {}),
    textElements: src.textElements ?? [],
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
