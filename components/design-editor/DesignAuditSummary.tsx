"use client";

import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import type { AuditFinding, AuditReport } from "@/lib/audit/pre-generation-audit";
import {
  auditHighlightBadgeClass,
  getAuditSummaryBadgeTone,
} from "@/lib/audit/canvas-audit-highlights";
import { cn } from "@/lib/cn";

function findingIcon(finding: AuditFinding) {
  if (finding.severity === "ok") {
    return <CircleCheck className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />;
  }
  if (finding.severity === "error") {
    return <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden />;
  }
  return <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />;
}

export type DesignAuditSummaryProps = {
  report: AuditReport | null;
  isAuditing: boolean;
};

export function DesignAuditSummary({ report, isAuditing }: DesignAuditSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  const hasReport = report !== null;
  const errorCount = report?.findings.filter((f) => f.severity === "error").length ?? 0;
  const warningCount = report?.findings.filter((f) => f.severity === "warning").length ?? 0;
  const hasIssues = errorCount > 0 || warningCount > 0;
  const allClear = report !== null && !report.blocking && warningCount === 0 && errorCount === 0;
  const totalRecords = report?.totalRecords ?? 0;
  const badgeTone = getAuditSummaryBadgeTone(report);

  return (
    <div className="min-w-0 border-t pt-4">
      <button
        type="button"
        className="flex w-full items-center gap-1 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        <span className="font-subheading text-xs font-semibold uppercase tracking-widest leading-snug">
          Design audit
        </span>
        {totalRecords > 0 && !isAuditing ? (
          <span
            className={cn(
              "ml-auto shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold",
              auditHighlightBadgeClass(badgeTone)
            )}
            title={
              badgeTone === "error"
                ? `${errorCount} error${errorCount === 1 ? "" : "s"} — fix before generating`
                : badgeTone === "warning"
                  ? `${warningCount} warning${warningCount === 1 ? "" : "s"}`
                  : badgeTone === "success"
                    ? `All ${totalRecords} record${totalRecords === 1 ? "" : "s"} ready`
                    : undefined
            }
          >
            {totalRecords}
          </span>
        ) : null}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2" aria-live="polite">
          {isAuditing ? (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
              Checking records…
            </div>
          ) : hasReport ? (
            <>
              {allClear ? (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/20 p-2.5">
                  <span className="size-1.5 shrink-0 rounded-full bg-success" />
                  <span className="text-xs text-muted-foreground">
                    All {totalRecords} record{totalRecords === 1 ? "" : "s"} ready
                  </span>
                </div>
              ) : (
                <>
                  {errorCount > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                      <span className="text-xs font-medium text-destructive">
                        {errorCount} error{errorCount === 1 ? "" : "s"} — fix before generating
                      </span>
                    </div>
                  )}
                  {!report.blocking && warningCount > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-2.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" />
                      <span className="text-xs font-medium text-warning">
                        {warningCount} warning{warningCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  )}
                  {report.findings
                    .filter((f) => f.severity !== "ok")
                    .slice(0, 3)
                    .map((finding) => (
                      <div
                        key={`${finding.kind}-${finding.elementId ?? finding.columnKey ?? finding.label}`}
                        className="flex items-start gap-2 rounded-lg border bg-muted/20 p-2"
                      >
                        {findingIcon(finding)}
                        <p className="text-xs leading-snug text-muted-foreground">{finding.label}</p>
                      </div>
                    ))}
                  {hasIssues && report.findings.filter((f) => f.severity !== "ok").length > 3 ? (
                    <p className="text-[10px] text-muted-foreground">
                      +{report.findings.filter((f) => f.severity !== "ok").length - 3} more issues —
                      see Generate step for full audit.
                    </p>
                  ) : null}
                </>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Upload a design and records to run checks.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
