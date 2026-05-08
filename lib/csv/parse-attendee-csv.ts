/**
 * Minimal RFC 4180–style CSV parse: commas, CRLF/LF, double-quote escaping (`""`).
 * BOM on first row is stripped. First row becomes headers after normalizing keys.
 */
import { normalizeHeaderKeys } from "@/lib/attendees/attendee-dataset";
import type { AttendeeTable } from "@/lib/db/easycert-db";

export type ParseCsvResult =
  | { ok: true; table: AttendeeTable }
  | { ok: false; error: string };

/** Raw cells before header normalization; first row becomes header row. */
function parseCsvToRawRows(text: string): string[][] {
  const stripped = text.replace(/^\uFEFF/, "").replace(/\s+$/, "");
  if (!stripped) return [];

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < stripped.length) {
    const c = stripped[i];
    if (inQuotes) {
      if (c === '"') {
        if (stripped[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (c === "\n" || c === "\r") {
      let lineEnd = i;
      if (c === "\r" && stripped[i + 1] === "\n") {
        lineEnd = i + 2;
      } else {
        lineEnd = i + 1;
      }
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      i = lineEnd;
      continue;
    }

    field += c;
    i += 1;
  }

  row.push(field);
  rows.push(row);

  return rows.filter((r) => !r.every((cell) => !cell.trim()));
}

function alignRow(headersLen: number, cells: string[]): string[] {
  const out = cells.slice(0, headersLen);
  while (out.length < headersLen) out.push("");
  return out;
}

export function parseAttendeeCsv(rawText: string): ParseCsvResult {
  const rawRows = parseCsvToRawRows(rawText);
  if (rawRows.length === 0) {
    return { ok: false, error: "CSV is empty." };
  }

  const rawHeaderCells = rawRows[0]?.map((c) => c.trim()) ?? [];
  if (rawHeaderCells.length === 0 || rawHeaderCells.every((h) => !h)) {
    return { ok: false, error: "CSV has no usable header row." };
  }

  const headers = normalizeHeaderKeys(rawHeaderCells);
  const n = headers.length;
  const dataRows = rawRows.slice(1);
  const rows: string[][] = [];

  for (const cells of dataRows) {
    if (cells.every((c) => !String(c).trim())) continue;
    const trimmedCells = cells.map((c) => String(c).trim());
    rows.push(alignRow(n, trimmedCells));
  }

  if (rows.length === 0) {
    return { ok: false, error: "CSV contains no data rows after the header." };
  }

  return { ok: true, table: { headers, rows } };
}

/** Builds newline-separated preview from first column (for mirror `attendeeListText`). */
export function mirrorLinesFromFirstColumn(table: AttendeeTable): string {
  if (table.headers.length === 0) return "";
  return table.rows.map((r) => (r[0] ?? "").trim()).join("\n");
}
