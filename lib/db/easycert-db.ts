import Dexie, { type Table } from "dexie";
import type { TextElement } from "@/types/types";

export type AppStateId = "default";
export type PersistedWizardStep = 0 | 1 | 2;

/** Which attendee-entry UI was last active on the upload step. */
export type AttendeeEntryTab = "upload" | "manual";

/** Parsed CSV: row 1 = headers, subsequent rows aligned to columns. Headers are normalized to unique keys. */
export interface AttendeeTable {
  headers: string[];
  rows: string[][];
}

export interface AppStateRecord {
  id: AppStateId;
  certificateImageUrl?: string;
  /** `undefined` = never persisted (show demo names in UI). `""` = user cleared. */
  attendeeListText?: string;
  /** Structured attendee data when a multi-column CSV is loaded (mutually supplementary with attendeeListText). */
  attendeeTable?: AttendeeTable;
  /** Header key used for filenames and previews when `attendeeTable` is present. */
  filenameColumn?: string;
  /** Remember Upload vs Paste when leaving the upload wizard step. */
  attendeeEntryTab?: AttendeeEntryTab;
  customFonts?: Record<string, string>;
  textElements?: TextElement[];
  wizardStep?: PersistedWizardStep;
  /** Last successful IndexedDB write (ms). */
  savedAt?: number;
}

export type SessionRecoveryId = "last-discarded";

export interface SessionRecoveryRecord {
  id: SessionRecoveryId;
  payload: AppStateRecord;
  discardedAt: number;
}

class EasyCertDB extends Dexie {
  appState!: Table<AppStateRecord, AppStateId>;
  sessionRecovery!: Table<SessionRecoveryRecord, SessionRecoveryId>;

  constructor() {
    super("easycert");
    this.version(1).stores({
      appState: "id",
    });
    this.version(2).stores({
      appState: "id",
      sessionRecovery: "id",
    });
    this.appState = this.table("appState");
    this.sessionRecovery = this.table("sessionRecovery");
  }
}

export const easyCertDb = new EasyCertDB();
