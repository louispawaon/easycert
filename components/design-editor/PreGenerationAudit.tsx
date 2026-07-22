"use client";

import {
  AlertTriangle,
  CircleCheck,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { GenerateHelpHint } from "@/components/generate-help-hint";
import type { AuditFinding, AuditReport } from "@/lib/audit/pre-generation-audit";
import { cn } from "@/lib/cn";

function formatSampleNames(finding: AuditFinding): string | null {
  const names = finding.sampleRecordNames;
  if (!names || names.length === 0) return null;
  const shown = names.slice(0, 3);
  const remaining = finding.count - shown.length;
  if (remaining > 0) {
    return `${shown.join(", ")} +${remaining} more`;
  }
  return shown.join(", ");
}

function FindingIcon({ finding }: { finding: AuditFinding }) {
  if (finding.severity === "ok") {
    return <CircleCheck className="h-4 w-4 shrink-0 text-success" aria-hidden />;
  }
  if (finding.severity === "error") {
    return <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" aria-hidden />;
  }
  return <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden />;
}

function findingCountClass(finding: AuditFinding): string {
  if (finding.severity === "ok") return "text-success";
  if (finding.severity === "error") return "text-destructive";
  return "text-warning";
}

export type PreGenerationAuditProps = {
  report: AuditReport | null;
  isAuditing: boolean;
  className?: string;
};

export function PreGenerationAudit({
  report,
  isAuditing,
  className,
}: PreGenerationAuditProps) {
  const totalRecords = report?.totalRecords ?? 0;
  const warningFindings =
    report?.findings.filter((finding) => finding.severity === "warning") ?? [];
  const errorFindings =
    report?.findings.filter((finding) => finding.severity === "error") ?? [];
  const readyFinding = report?.findings.find((finding) => finding.kind === "ready");
  const allClear =
    report !== null &&
    !report.blocking &&
    warningFindings.length === 0 &&
    errorFindings.length === 0 &&
    report.totalRecords > 0;

  return (
    <div
      id="ditto-onboarding-generate-audit"
      className={cn("min-w-0 space-y-3 border-t pt-4", className)}
      aria-live="polite"
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <Label className="font-subheading text-xs font-semibold uppercase tracking-widest leading-snug">
            Pre-generation audit
          </Label>
          <GenerateHelpHint label="Help: pre-generation audit">
            <span>
              Checks your records and design layout before export. Overflow,
              missing values, duplicate names, and elements cut off by the
              canvas edge are flagged so you can fix issues before generating.
            </span>
          </GenerateHelpHint>
        </div>
        {totalRecords > 0 ? (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-mono text-xs">
            {totalRecords} record{totalRecords === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      {isAuditing ? (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          Checking {totalRecords > 0 ? `${totalRecords} records` : "records"}…
        </div>
      ) : report ? (
        <div className="space-y-2">
          {report.blocking ? (
            <div className="space-y-2">
              {errorFindings.map((finding) => (
                <AuditRow key={finding.kind} finding={finding} />
              ))}
            </div>
          ) : (
            <>
              {readyFinding ? <AuditRow key="ready" finding={readyFinding} /> : null}
              {warningFindings.map((finding) => (
                <AuditRow
                  key={`${finding.kind}-${finding.elementId ?? finding.columnKey ?? finding.label}`}
                  finding={finding}
                />
              ))}
              {allClear ? (
                <div className="flex items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold">
                    <span className="size-2 animate-pulse rounded-full bg-success" />
                    All {report.totalRecords} record
                    {report.totalRecords === 1 ? "" : "s"} ready to generate
                  </span>
                </div>
              ) : report.readyCount > 0 && warningFindings.length > 0 ? (
                <div className="flex items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold">
                    <span className="size-2 animate-pulse rounded-full bg-primary" />
                    Ready to generate
                  </span>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Upload a design and data to run checks before export.
        </p>
      )}
    </div>
  );
}

function AuditRow({ finding }: { finding: AuditFinding }) {
  const sampleText = formatSampleNames(finding);

  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <FindingIcon finding={finding} />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium leading-snug">{finding.label}</p>
            {sampleText ? (
              <p className="text-xs leading-snug text-muted-foreground">{sampleText}</p>
            ) : null}
            {finding.worstCaseRecordIndex !== undefined && finding.kind === "overflow" ? (
              <p className="text-xs leading-snug text-muted-foreground">
                Worst case: row {finding.worstCaseRecordIndex + 1}
              </p>
            ) : null}
          </div>
        </div>
        <span className={cn("shrink-0 font-mono text-sm", findingCountClass(finding))}>
          {finding.count}
        </span>
      </div>
    </div>
  );
}
