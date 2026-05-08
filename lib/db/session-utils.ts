import type { AppStateRecord } from "./easycert-db";

export function isRestorableProject(row: AppStateRecord | undefined | null): boolean {
  if (!row) return false;
  if (row.certificateImageUrl) return true;
  if (row.textElements && row.textElements.length > 0) return true;
  if (row.customFonts && Object.keys(row.customFonts).length > 0) return true;
  if (row.attendeeListText !== undefined) {
    if (row.attendeeListText === "") return true;
    if (row.attendeeListText.trim().length > 0) return true;
  }
  if (row.attendeeTable?.rows.some((cells) => cells.some((c) => c.trim().length > 0))) {
    return true;
  }
  return false;
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
