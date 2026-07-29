import type { GenerationReport } from "@/lib/output/generation-report";

const ILLEGAL_CHARS_RE = /[\\/:*?"<>|\x00-\x1f]/g;

function safeStem(stem: string): string {
  const s = stem.replace(ILLEGAL_CHARS_RE, "").trim();
  return s.length > 0 ? s : "ditto";
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toISOString().replace(/T/, " ").replace(/\..+/, "");
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadReportTxt(report: GenerationReport, stem: string) {
  const base = safeStem(stem);
  const lines: string[] = [
    "Ditto Generation Report",
    `Generated: ${formatTimestamp(report.generatedAt)}`,
    `Total records: ${report.totalRecords}`,
    `Records with warnings: ${report.warningCount}`,
    `Output: ${report.outputFilename}`,
    "",
    "Flagged records:",
    "",
  ];

  for (const flagged of report.flaggedRecords) {
    lines.push(
      `#${flagged.index + 1}  "${flagged.label}" — ${flagged.issues.join(", ")}`
    );
  }

  if (report.flaggedRecords.length === 0) {
    lines.push("None — all records passed the audit checks.");
  }

  downloadBlob(lines.join("\n") + "\n", `${base}-report.txt`, "text/plain;charset=utf-8");
}

export function downloadReportCsv(report: GenerationReport, stem: string) {
  const base = safeStem(stem);
  const rows: string[] = ["Index,Record,Issue Kind,Issue Description"];

  for (const flagged of report.flaggedRecords) {
    for (const issue of flagged.issues) {
      const description =
        report.findings.find((f) => f.kind === issue)?.label ?? issue;
      const label = flagged.label.includes(",") ? `"${flagged.label}"` : flagged.label;
      rows.push(`${flagged.index + 1},${label},${issue},"${description}"`);
    }
  }

  if (report.flaggedRecords.length === 0) {
    rows.push("0,N/A,none,All records passed the audit checks.");
  }

  downloadBlob(rows.join("\n") + "\n", `${base}-report.csv`, "text/csv;charset=utf-8");
}
