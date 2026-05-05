import Dexie, { type Table } from "dexie";
import type { TextElement } from "@/types/types";

export type AppStateId = "default";
export type PersistedWizardStep = 0 | 1 | 2;

export interface AppStateRecord {
  id: AppStateId;
  certificateImageUrl?: string;
  /** `undefined` = never persisted (show demo names in UI). `""` = user cleared. */
  attendeeListText?: string;
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
