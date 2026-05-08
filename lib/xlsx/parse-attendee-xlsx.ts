import { normalizeHeaderKeys } from "@/lib/attendees/attendee-dataset";
import type { ParseCsvResult } from "@/lib/csv/parse-attendee-csv";
import type { WorkBook, WorkSheet } from "xlsx";

function alignRow(headersLen: number, cells: string[]): string[] {
  const out = cells.slice(0, headersLen);
  while (out.length < headersLen) out.push("");
  return out;
}

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function extractRows(workbook: WorkBook, xlsx: typeof import("xlsx")): string[][] {
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const ws: WorkSheet | undefined = workbook.Sheets[firstSheetName];
  if (!ws) return [];
  const rows = xlsx.utils.sheet_to_json(ws, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: false,
  }) as unknown[][];
  return rows.map((r) => r.map(normalizeCell)).filter((r) => !r.every((c) => c === ""));
}

export async function parseAttendeeXlsx(arrayBuffer: ArrayBuffer): Promise<ParseCsvResult> {
  try {
    const xlsx = await import("xlsx");
    const workbook = xlsx.read(arrayBuffer, { type: "array", cellDates: false });
    const rawRows = extractRows(workbook, xlsx);
    if (rawRows.length === 0) return { ok: false, error: "Excel sheet is empty." };

    const rawHeaderCells = rawRows[0]?.map((c) => c.trim()) ?? [];
    if (rawHeaderCells.length === 0 || rawHeaderCells.every((h) => !h)) {
      return { ok: false, error: "Excel file has no usable header row." };
    }

    const headers = normalizeHeaderKeys(rawHeaderCells);
    const n = headers.length;
    const rows: string[][] = [];
    for (const cells of rawRows.slice(1)) {
      if (cells.every((c) => !c.trim())) continue;
      rows.push(alignRow(n, cells.map((c) => c.trim())));
    }
    if (rows.length === 0) {
      return { ok: false, error: "Excel file contains no data rows after the header." };
    }
    return { ok: true, table: { headers, rows } };
  } catch {
    return { ok: false, error: "Could not read this Excel file." };
  }
}
