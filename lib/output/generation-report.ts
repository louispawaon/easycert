import type { AuditFinding } from "@/lib/audit/pre-generation-audit";

export type FlaggedRecord = {
  index: number;
  label: string;
  issues: string[];
};

export type GenerationReport = {
  generatedAt: number;
  totalRecords: number;
  warningCount: number;
  outputFilename: string;
  findings: AuditFinding[];
  flaggedRecords: FlaggedRecord[];
};
