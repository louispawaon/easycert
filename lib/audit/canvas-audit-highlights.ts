import type { AuditFinding, AuditReport, AuditSeverity } from "@/lib/audit/pre-generation-audit";

function findingAffectsPreviewIndex(finding: AuditFinding, previewIndex: number): boolean {
  if (finding.severity === "ok") return false;

  const indices = finding.sampleRecordIndices;
  if (!indices || indices.length === 0) {
    return true;
  }

  return indices.includes(previewIndex);
}

export function buildElementAuditSeverityMap(
  report: AuditReport | null,
  previewIndex: number
): Map<string, Exclude<AuditSeverity, "ok">> {
  const map = new Map<string, Exclude<AuditSeverity, "ok">>();
  if (!report) return map;

  for (const finding of report.findings) {
    if (finding.severity === "ok") continue;
    if (!finding.elementId) continue;
    if (!findingAffectsPreviewIndex(finding, previewIndex)) continue;

    const existing = map.get(finding.elementId);
    if (existing === "error") continue;
    if (finding.severity === "error") {
      map.set(finding.elementId, "error");
    } else if (finding.severity === "warning") {
      map.set(finding.elementId, "warning");
    }
  }

  return map;
}

export function getCanvasAuditBorderSeverity(
  report: AuditReport | null,
  previewIndex: number
): Exclude<AuditSeverity, "ok"> | null {
  if (!report) return null;

  if (report.blocking) {
    return "error";
  }

  for (const finding of report.findings) {
    if (finding.severity !== "warning") continue;
    if (finding.elementId) continue;
    if (!findingAffectsPreviewIndex(finding, previewIndex)) continue;
    return "warning";
  }

  const elementSeverities = buildElementAuditSeverityMap(report, previewIndex);
  if (elementSeverities.size === 0) return null;

  for (const severity of elementSeverities.values()) {
    if (severity === "error") return "error";
  }

  return "warning";
}

export type AuditHighlightTone = "error" | "warning" | "success" | null;

export function getAuditSummaryBadgeTone(report: AuditReport | null): AuditHighlightTone {
  if (!report || report.totalRecords <= 0) return null;

  const errorCount = report.findings.filter((finding) => finding.severity === "error").length;
  const warningCount = report.findings.filter((finding) => finding.severity === "warning").length;

  if (report.blocking || errorCount > 0) return "error";
  if (warningCount > 0) return "warning";
  return "success";
}

export function auditHighlightBadgeClass(tone: AuditHighlightTone): string {
  switch (tone) {
    case "error":
      return "bg-destructive text-destructive-foreground animate-pulse";
    case "warning":
      return "bg-warning text-warning-foreground";
    case "success":
      return "bg-success text-success-foreground";
    default:
      return "bg-muted text-foreground";
  }
}
