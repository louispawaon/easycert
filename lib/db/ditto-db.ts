import Dexie, { type Table } from "dexie";
import type { TextElement, DesignElement } from "@/types/types";
import type { OutputSettings } from "@/lib/output/output-settings";
import type { GenerationReport } from "@/lib/output/generation-report";

export type AppStateId = "default";
export type PersistedWizardStep = 0 | 1 | 2;

export type RecordEntryTab = "upload" | "manual";

export type RecordManualMode = "simple" | "table" | "json";

/** @deprecated Use `RecordEntryTab` instead. */
export type AttendeeEntryTab = RecordEntryTab;

export interface RecordTable {
  headers: string[];
  rows: string[][];
}

/** @deprecated Use `RecordTable` instead. */
export type AttendeeTable = RecordTable;

export interface AppStateRecord {
  id: AppStateId;
  templateImageUrl?: string;
  recordListText?: string;
  recordTable?: RecordTable;
  filenameColumn?: string;
  recordEntryTab?: RecordEntryTab;
  recordManualMode?: RecordManualMode;
  customFonts?: Record<string, string>;
  /** @deprecated Use `designElements` instead. Kept for backward compat. */
  textElements?: TextElement[];
  /** Current design elements (TextElement | ProofLinkElement). */
  designElements?: DesignElement[];
  /** Issuing organization displayed on the proof page. */
  issuer?: string;
  wizardStep?: PersistedWizardStep;
  savedAt?: number;
  /** Output generation settings persisted across sessions. */
  outputSettings?: OutputSettings;
  /** Post-generation report for the last completed batch. */
  lastGenerationReport?: GenerationReport;
}

export type SessionRecoveryId = "last-discarded";

export interface SessionRecoveryRecord {
  id: SessionRecoveryId;
  payload: AppStateRecord;
  discardedAt: number;
}

class DittoDB extends Dexie {
  appState!: Table<AppStateRecord, AppStateId>;
  sessionRecovery!: Table<SessionRecoveryRecord, SessionRecoveryId>;

  constructor() {
    super("ditto");
    this.version(1).stores({
      appState: "id",
    });
    this.version(2).stores({
      appState: "id",
      sessionRecovery: "id",
    });
    this.version(3).stores({
      appState: "id",
      sessionRecovery: "id",
    });
    this.version(4).stores({
      appState: "id",
      sessionRecovery: "id",
    }).upgrade((tx) => {
      return tx.table("appState").toCollection().modify((row: Record<string, unknown>) => {
        if (row.certificateImageUrl !== undefined) {
          row.templateImageUrl = row.certificateImageUrl;
          delete row.certificateImageUrl;
        }
        if (row.attendeeListText !== undefined) {
          row.recordListText = row.attendeeListText;
          delete row.attendeeListText;
        }
        if (row.attendeeTable !== undefined) {
          row.recordTable = row.attendeeTable;
          delete row.attendeeTable;
        }
        if (row.attendeeEntryTab !== undefined) {
          row.recordEntryTab = row.attendeeEntryTab;
          delete row.attendeeEntryTab;
        }
      });
    });
    this.version(5).stores({
      appState: "id",
      sessionRecovery: "id",
    }).upgrade((tx) => {
      return tx.table("appState").toCollection().modify((row: Record<string, unknown>) => {
        const migrateEl = (el: Record<string, unknown>) => {
          if (el.type === "name") el.type = "dynamic-text";
          if (el.variableColumn !== undefined) {
            el.variable = el.variableColumn;
            delete el.variableColumn;
          }
        };
        if (Array.isArray(row.designElements)) {
          for (const el of row.designElements as Record<string, unknown>[]) {
            migrateEl(el);
          }
        }
        if (Array.isArray(row.textElements)) {
          for (const el of row.textElements as Record<string, unknown>[]) {
            migrateEl(el);
          }
        }
      });
    });
    this.version(6).stores({
      appState: "id",
      sessionRecovery: "id",
    }).upgrade((tx) => {
      return tx.table("appState").toCollection().modify((row: Record<string, unknown>) => {
        const migrateEl = (el: Record<string, unknown>) => {
          if (el.type === "qr") el.type = "proof-link";
        };
        if (Array.isArray(row.designElements)) {
          for (const el of row.designElements as Record<string, unknown>[]) {
            migrateEl(el);
          }
        }
        if (Array.isArray(row.textElements)) {
          for (const el of row.textElements as Record<string, unknown>[]) {
            migrateEl(el);
          }
        }
      });
    });
    this.version(7).stores({
      appState: "id",
      sessionRecovery: "id",
    });
    this.version(8).stores({
      appState: "id",
      sessionRecovery: "id",
    });
    this.appState = this.table("appState");
    this.sessionRecovery = this.table("sessionRecovery");
  }
}

export const dittoDb = new DittoDB();
