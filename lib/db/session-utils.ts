import type { AppStateRecord } from "./easycert-db";
import { downloadEasycertFile } from "@/lib/project/easycert-file";

export function isRestorableProject(row: AppStateRecord | undefined): boolean {
  if (!row) return false;
  if (row.certificateImageUrl) return true;
  if (row.textElements && row.textElements.length > 0) return true;
  if (row.customFonts && Object.keys(row.customFonts).length > 0) return true;
  if (row.attendeeListText !== undefined) {
    if (row.attendeeListText === "") return true;
    if (row.attendeeListText.trim().length > 0) return true;
  }
  return false;
}

/** Session discard / backup download uses the same `.easycert` envelope as manual export. */
export function downloadProjectBackup(row: AppStateRecord): void {
  downloadEasycertFile(row, "easycert-backup");
}

export function formatSavedAtLabel(savedAt: number | undefined): string | null {
  if (savedAt === undefined) return null;
  const sec = Math.floor((Date.now() - savedAt) / 1000);
  if (sec < 10) return "Saved just now";
  if (sec < 60) return `Saved ${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `Saved ${min}m ago`;
  const hr = Math.floor(min / 60);
  return `Saved ${hr}h ago`;
}
