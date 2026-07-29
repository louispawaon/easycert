export type FilenameContext = {
  recordLabel?: string | null;
  record?: Record<string, string> | null;
  headers?: string[];
  index: number;
};

const ILLEGAL_CHARS_RE = /[\\/:*?"<>|\x00-\x1f]/g;

function sanitizeSegment(raw: string): string {
  return raw.replace(ILLEGAL_CHARS_RE, "").trim();
}

function resolveNameValue(ctx: FilenameContext): string {
  const row = ctx.record ?? null;
  const headers = ctx.headers ?? [];
  const primaryLine = (ctx.recordLabel ?? "").trim();

  if (row && headers.length > 0) {
    const nameKey = headers.find((h) => /^name$/i.test(h));
    if (nameKey) {
      const val = row[nameKey]?.trim();
      if (val && val.length > 0) return val;
    }
    const firstVal = row[headers[0]!]?.trim();
    if (firstVal && firstVal.length > 0) return firstVal;
  }

  if (primaryLine.length > 0) return primaryLine;
  return "";
}

export function resolveFilenameForRecord(
  pattern: string,
  ctx: FilenameContext
): string {
  if (typeof pattern !== "string" || pattern.trim().length === 0) {
    pattern = "output_{name}";
  }

  const record = ctx.record ?? null;

  let result = pattern.replace(/\{([^}]+)\}/g, (_match, key: string) => {
    const trimmed = key.trim();

    if (trimmed === "index" || trimmed === "row") {
      return String(ctx.index);
    }

    if (trimmed === "name") {
      return resolveNameValue(ctx);
    }

    if (record && trimmed in record) {
      return (record[trimmed] ?? "").trim();
    }

    if (record && /^name$/i.test(trimmed)) {
      return resolveNameValue(ctx);
    }

    return "";
  });

  result = sanitizeSegment(result);

  if (result.length === 0) {
    result = `output_${ctx.index}`;
  }

  return result;
}

export function containerStemForPattern(pattern: string, fallback = "output"): string {
  let stem = pattern.replace(/\{[^}]+\}/g, "");
  stem = stem.replace(/[\\/:*?"<>|\x00-\x1f]/g, "").trim();
  stem = stem.replace(/[_-]+$/, "");
  return stem.length > 0 ? stem : fallback;
}
