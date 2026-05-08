import type { AttendeeTable } from "@/lib/db/easycert-db";

/** True for paste/manual list, .txt/.json uploads, or single-column CSV (“names only” UX). */
export function isAttendeeLinesMode(table: AttendeeTable | undefined): boolean {
  if (!table) return true;
  if (table.headers.length <= 1) return true;
  return false;
}

/** Dedupe header labels to stable unique keys (e.g. Name, Name_2). */
export function normalizeHeaderKeys(rawHeaders: string[]): string[] {
  const used = new Map<string, number>();
  const out: string[] = [];
  for (const h of rawHeaders) {
    const base = h.trim() || "Column";
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    out.push(count === 0 ? base : `${base}_${count + 1}`);
  }
  return out;
}

export function tableToRecords(table: AttendeeTable): Record<string, string>[] {
  const { headers, rows } = table;
  return rows.map((cells) => {
    const rec: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      rec[headers[i]] = cells[i] ?? "";
    }
    return rec;
  });
}

/** Default filename column: exact "name" (case-insensitive), else first header. */
export function defaultFilenameColumn(headers: string[]): string | undefined {
  if (headers.length === 0) return undefined;
  const nameMatch = headers.find((h) => /^name$/i.test(h));
  return nameMatch ?? headers[0];
}

export function resolveFilenameForRow(
  row: Record<string, string>,
  filenameColumn: string | undefined,
  rowIndex: number
): string {
  const key = filenameColumn;
  const raw = key ? row[key] : undefined;
  const trimmed = raw?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : `row_${rowIndex + 1}`;
}
