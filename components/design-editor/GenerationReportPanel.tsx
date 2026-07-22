"use client";

import { Button } from "@/components/ui/button";
import { FileText, Table2, X } from "lucide-react";
import type { GenerationReport } from "@/lib/output/generation-report";
import { downloadReportTxt, downloadReportCsv } from "@/lib/output/report-download";

function reportStem(outputFilename: string): string {
  const stem = outputFilename.replace(/\.[^.]+$/, "");
  return stem || "ditto";
}

export type GenerationReportPanelProps = {
  report: GenerationReport;
  onDismiss: () => void;
};

export function GenerationReportPanel({ report, onDismiss }: GenerationReportPanelProps) {
  const stem = reportStem(report.outputFilename);

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm" role="alert" aria-live="polite">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Generation complete</p>
          <p className="text-xs text-muted-foreground">
            {report.totalRecords} record{report.totalRecords === 1 ? "" : "s"} generated
            {report.warningCount > 0
              ? ` — ${report.warningCount} record${report.warningCount === 1 ? "" : "s"} with warnings`
              : ""}
          </p>
          <p className="text-xs font-mono text-muted-foreground">{report.outputFilename}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onDismiss}
          aria-label="Dismiss report"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {report.flaggedRecords.length > 0 && (
        <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border bg-muted/20 p-3">
          {report.flaggedRecords.map((rec) => (
            <div key={rec.index} className="flex items-start gap-2 text-xs">
              <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                #{rec.index + 1}
              </span>
              <span className="min-w-0 truncate font-medium">{rec.label}</span>
              <span className="shrink-0 text-muted-foreground">
                — {rec.issues.join(", ")}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => downloadReportTxt(report, stem)}
        >
          <FileText className="mr-1.5 h-3.5 w-3.5" />
          Download TXT
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => downloadReportCsv(report, stem)}
        >
          <Table2 className="mr-1.5 h-3.5 w-3.5" />
          Download CSV
        </Button>
        {report.outputFilename ? (
          <p className="ml-auto text-[10px] text-muted-foreground">
            Reports saved as {stem}-report.txt / .csv
          </p>
        ) : null}
      </div>
    </div>
  );
}
