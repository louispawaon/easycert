import { normalizeHeaderKeys } from "@/lib/records/record-dataset";
import { parseRecordCsv } from "@/lib/csv/parse-record-csv";
import type { RecordTable } from "@/lib/db/ditto-db";

export const MANUAL_SIMPLE_HEADER = "Value";

export type ManualDelimiter = "auto" | "tab" | "comma" | "pipe" | "single";

function splitLines(text: string): string[] {
  return text.replace(/\r\n?/g, "\n").split("\n").filter((l) => l.trim());
}

export function parseSimpleList(text: string): RecordTable {
  const lines = splitLines(text);
  return {
    headers: [MANUAL_SIMPLE_HEADER],
    rows: lines.map((l) => [l.trim()]),
  };
}

export function recordsToSimpleList(table: RecordTable): string {
  return table.rows.map((r) => (r[0] ?? "").trim()).join("\n");
}

function tryParseDelimited(rows: string[], delimiter: string): string[][] | null {
  const parsed = rows.map((r) => r.split(delimiter).map((c) => c.trim()));
  if (parsed.length === 0) return null;
  const colCount = Math.max(...parsed.map((r) => r.length));
  if (colCount <= 1) return null;
  const consistent = parsed.every((r) => r.length === colCount || r.length === 1);
  return consistent ? parsed : null;
}

function tryCsvParse(rows: string[]): string[][] | null {
  const text = rows.join("\n");
  const result = parseRecordCsv(text);
  if (!result.ok) return null;
  const colCount = result.table.headers.length;
  if (colCount <= 1) return null;
  const dataRows = result.table.rows;
  return [result.table.headers, ...dataRows];
}

export function detectDelimiter(text: string): ManualDelimiter {
  const rows = splitLines(text);
  if (rows.length < 2) return "single";

  const csvResult = tryCsvParse(rows);
  if (csvResult && csvResult.length > 1 && csvResult[0]!.length > 1) return "comma";

  const tabResult = tryParseDelimited(rows, "\t");
  if (tabResult && tabResult[0]!.length > 1) return "tab";

  const pipeResult = tryParseDelimited(rows, "|");
  if (pipeResult && pipeResult[0]!.length > 1) return "pipe";

  const commaResult = tryParseDelimited(rows, ",");
  if (commaResult && commaResult[0]!.length > 1) return "comma";

  return "single";
}

export function parseDelimitedTable(text: string, delimiter: ManualDelimiter = "auto"): RecordTable {
  const rows = splitLines(text);
  if (rows.length === 0) {
    return { headers: [MANUAL_SIMPLE_HEADER], rows: [] };
  }

  const delim = delimiter === "auto" ? detectDelimiter(text) : delimiter;

  if (delim === "single") {
    return parseSimpleList(text);
  }

  if (delim === "comma") {
    const csvResult = tryCsvParse(rows);
    if (csvResult && csvResult.length > 1) {
      const headers = normalizeHeaderKeys(csvResult[0]!);
      const dataRows = csvResult.slice(1).map((r) => {
        while (r.length < headers.length) r.push("");
        return r.slice(0, headers.length);
      });
      return { headers, rows: dataRows };
    }
  }

  if (delim === "tab") {
    const tabResult = tryParseDelimited(rows, "\t");
    if (tabResult && tabResult.length > 0) {
      const headers = normalizeHeaderKeys(tabResult[0]!);
      const dataRows = tabResult.slice(1).map((r) => {
        while (r.length < headers.length) r.push("");
        return r.slice(0, headers.length);
      });
      return { headers, rows: dataRows };
    }
  }

  if (delim === "pipe") {
    const pipeResult = tryParseDelimited(rows, "|");
    if (pipeResult && pipeResult.length > 0) {
      const headers = normalizeHeaderKeys(pipeResult[0]!);
      const dataRows = pipeResult.slice(1).map((r) => {
        while (r.length < headers.length) r.push("");
        return r.slice(0, headers.length);
      });
      return { headers, rows: dataRows };
    }
  }

  return parseSimpleList(text);
}

export function parseManualJson(text: string): RecordTable | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "Invalid JSON syntax." };
  }

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return { headers: [MANUAL_SIMPLE_HEADER], rows: [] };
    }
    if (typeof parsed[0] === "string") {
      const rows = (parsed as string[]).map((s) => [s.trim()]);
      return { headers: [MANUAL_SIMPLE_HEADER], rows };
    }
    if (typeof parsed[0] === "object" && parsed[0] !== null && !Array.isArray(parsed[0])) {
      const headers = normalizeHeaderKeys(Object.keys(parsed[0] as Record<string, unknown>));
      const rows = (parsed as Record<string, string>[]).map((obj) =>
        headers.map((h) => (obj[h] ?? "").trim())
      );
      return { headers, rows };
    }
    return { error: "JSON array must contain strings or objects." };
  }

  return { error: "JSON must be an array of strings or objects." };
}

export function recordsToJson(table: RecordTable): string {
  if (table.headers.length === 1) {
    return JSON.stringify(table.rows.map((r) => r[0] ?? ""), null, 2);
  }
  const objects = table.rows.map((r) => {
    const obj: Record<string, string> = {};
    for (let i = 0; i < table.headers.length; i++) {
      obj[table.headers[i]!] = r[i] ?? "";
    }
    return obj;
  });
  return JSON.stringify(objects, null, 2);
}

export function addTableRow(table: RecordTable): RecordTable {
  const newRow = table.headers.map(() => "");
  return { ...table, rows: [...table.rows, newRow] };
}

export function removeTableRow(table: RecordTable, index: number): RecordTable {
  if (index < 0 || index >= table.rows.length) return table;
  const rows = [...table.rows];
  rows.splice(index, 1);
  return { headers: table.headers, rows };
}

export function addTableColumn(table: RecordTable): RecordTable {
  const newHeaders = normalizeHeaderKeys([...table.headers, "Column"]);
  const rows = table.rows.map((r) => [...r, ""]);
  return { headers: newHeaders, rows };
}

export function removeTableColumn(table: RecordTable, index: number): RecordTable {
  if (index < 0 || index >= table.headers.length || table.headers.length <= 1) return table;
  const newHeaders = [...table.headers];
  newHeaders.splice(index, 1);
  const rows = table.rows.map((r) => {
    const copy = [...r];
    copy.splice(index, 1);
    return copy;
  });
  return { headers: newHeaders, rows };
}

export function updateTableCell(
  table: RecordTable,
  rowIndex: number,
  colIndex: number,
  value: string
): RecordTable {
  if (rowIndex < 0 || rowIndex >= table.rows.length) return table;
  if (colIndex < 0 || colIndex >= table.headers.length) return table;
  const newRows = table.rows.map((r, ri) =>
    ri === rowIndex ? r.map((c, ci) => (ci === colIndex ? value : c)) : r
  );
  return { headers: table.headers, rows: newRows };
}

export function updateTableHeader(
  table: RecordTable,
  colIndex: number,
  value: string
): RecordTable {
  if (colIndex < 0 || colIndex >= table.headers.length) return table;
  const newHeaders = [...table.headers];
  newHeaders[colIndex] = value;
  return { headers: newHeaders, rows: table.rows };
}

export function normalizeTableHeadersOnBlur(table: RecordTable): RecordTable {
  return { headers: normalizeHeaderKeys(table.headers), rows: table.rows };
}
