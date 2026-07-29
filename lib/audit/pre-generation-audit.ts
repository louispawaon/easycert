import { classifyElementBBoxAgainstCanvas } from "@/lib/canvas/element-bounds";
import {
  measureElementBBoxes,
  measureTextElement,
  resolveElementText,
  __test,
  type RecordDrawContext,
  type ElementBBox,
} from "@/lib/canvas/draw-text-element";
import { buildProofSizingPlaceholderUrl } from "@/lib/proof/url";
import type { ProofLinkElement, TextElement } from "@/types/types";

const MIN_FONT_SIZE_PX = __test.MIN_FONT_SIZE_PX;
const PROOF_SIZING_URL = buildProofSizingPlaceholderUrl();

export type AuditSeverity = "ok" | "warning" | "error";

export type AuditIssueKind =
  | "ready"
  | "overflow"
  | "shrunk"
  | "missing"
  | "duplicate"
  | "clipped"
  | "off-canvas"
  | "unknown-column"
  | "no-name-element"
  | "no-records"
  | "no-template";

export type AuditFinding = {
  kind: AuditIssueKind;
  severity: AuditSeverity;
  count: number;
  label: string;
  sampleRecordIndices?: number[];
  sampleRecordNames?: string[];
  worstCaseRecordIndex?: number;
  elementId?: string;
  columnKey?: string;
};

export type AuditReport = {
  totalRecords: number;
  readyCount: number;
  findings: AuditFinding[];
  blocking: boolean;
};

export type PreGenerationAuditInput = {
  ctx: CanvasRenderingContext2D;
  textElements: TextElement[];
  proofLinkElements: ProofLinkElement[];
  records: Record<string, string>[] | null;
  displayLines: string[];
  headers: string[];
  canvasWidth: number;
  canvasHeight: number;
  hasTemplate: boolean;
};

const MAX_SAMPLES = 3;

function elementColumnLabel(element: TextElement, headers: string[]): string {
  const variable = element.variable ?? element.variableColumn;
  if (variable) return variable;
  if (headers.length > 0) return headers[0]!;
  return "record";
}

function staticElementLabel(element: TextElement): string {
  const value = element.value?.trim();
  if (!value) return "Static text";
  return value.length > 28 ? `${value.slice(0, 28)}…` : value;
}

function isRawValueMissing(
  element: TextElement,
  row: Record<string, string> | null,
  displayLine: string,
  headers: string[],
  linesMode: boolean
): boolean {
  if (linesMode) {
    return displayLine.trim().length === 0;
  }
  const variable = element.variable ?? element.variableColumn;
  if (variable) {
    return !(row?.[variable]?.trim());
  }
  const firstKey = headers[0];
  if (firstKey && row) {
    return !(row[firstKey]?.trim());
  }
  return displayLine.trim().length === 0;
}

function pushSample(
  indices: number[],
  names: string[],
  index: number,
  displayName: string
): void {
  if (indices.includes(index)) return;
  if (indices.length >= MAX_SAMPLES) return;
  indices.push(index);
  names.push(displayName);
}

function buildDrawContext(
  index: number,
  displayLines: string[],
  records: Record<string, string>[] | null,
  headers: string[]
): RecordDrawContext {
  return {
    recordLabel: displayLines[index] ?? "",
    record: records?.[index] ?? null,
    headers: records !== null ? headers : [],
  };
}

function displayNameForIndex(displayLines: string[], index: number): string {
  const line = displayLines[index]?.trim();
  return line && line.length > 0 ? line : `Row ${index + 1}`;
}

function measureSingleTextBBox(
  ctx: CanvasRenderingContext2D,
  element: TextElement,
  drawCtx: RecordDrawContext,
  canvasWidth: number,
  canvasHeight: number
): ElementBBox | null {
  const [bbox] = measureElementBBoxes(
    ctx,
    [element],
    [],
    canvasWidth,
    canvasHeight,
    drawCtx
  );
  return bbox ?? null;
}

function measureSingleProofLinkBBox(
  ctx: CanvasRenderingContext2D,
  element: ProofLinkElement,
  canvasWidth: number,
  canvasHeight: number
): ElementBBox | null {
  const [bbox] = measureElementBBoxes(
    ctx,
    [],
    [element],
    canvasWidth,
    canvasHeight,
    {},
    PROOF_SIZING_URL
  );
  return bbox ?? null;
}

function boundsKindForStatus(
  status: ReturnType<typeof classifyElementBBoxAgainstCanvas>
): Extract<AuditIssueKind, "clipped" | "off-canvas"> | null {
  if (status === "partially-clipped") return "clipped";
  if (status === "fully-outside") return "off-canvas";
  return null;
}

function boundsLabelForKind(
  kind: Extract<AuditIssueKind, "clipped" | "off-canvas">,
  elementLabel: string
): string {
  if (kind === "off-canvas") return `${elementLabel} off canvas`;
  return `${elementLabel} partially cut off`;
}

function pushBoundsFinding(
  findings: AuditFinding[],
  kind: Extract<AuditIssueKind, "clipped" | "off-canvas">,
  elementLabel: string,
  elementId: string,
  count: number,
  sampleRecordIndices?: number[],
  sampleRecordNames?: string[]
): void {
  findings.push({
    kind,
    severity: "warning",
    count,
    label: boundsLabelForKind(kind, elementLabel),
    elementId,
    sampleRecordIndices,
    sampleRecordNames,
  });
}

function markAllRecords(totalRecords: number, markRecordIssue: (index: number) => void): void {
  for (let i = 0; i < totalRecords; i++) {
    markRecordIssue(i);
  }
}

export function computePreGenerationAudit(input: PreGenerationAuditInput): AuditReport {
  const {
    ctx,
    textElements,
    proofLinkElements,
    records,
    displayLines,
    headers,
    canvasWidth,
    canvasHeight,
    hasTemplate,
  } = input;

  const dynamicTextElements = textElements.filter((el) => el.type === "dynamic-text" || el.type === "name");
  const staticElements = textElements.filter((el) => el.type === "static");
  const totalRecords = displayLines.length;
  const linesMode = records === null;
  const findings: AuditFinding[] = [];
  const recordIssueCounts = new Array<number>(totalRecords).fill(0);

  const markRecordIssue = (index: number) => {
    if (index >= 0 && index < totalRecords) {
      recordIssueCounts[index] = (recordIssueCounts[index] ?? 0) + 1;
    }
  };

  if (!hasTemplate || canvasWidth <= 0 || canvasHeight <= 0) {
    findings.push({
      kind: "no-template",
      severity: "error",
      count: 1,
      label: "No design template loaded",
    });
    return {
      totalRecords,
      readyCount: 0,
      findings,
      blocking: true,
    };
  }

  if (totalRecords === 0) {
    findings.push({
      kind: "no-records",
      severity: "error",
      count: 1,
      label: "No records in your data",
    });
    return {
      totalRecords: 0,
      readyCount: 0,
      findings,
      blocking: true,
    };
  }

  if (dynamicTextElements.length === 0) {
    findings.push({
      kind: "no-name-element",
      severity: "error",
      count: 1,
      label: "No dynamic text field placed on the design",
    });
    return {
      totalRecords,
      readyCount: 0,
      findings,
      blocking: true,
    };
  }

  for (const element of staticElements) {
    const bbox = measureSingleTextBBox(ctx, element, {}, canvasWidth, canvasHeight);
    if (!bbox) continue;
    const boundsKind = boundsKindForStatus(
      classifyElementBBoxAgainstCanvas(bbox, canvasWidth, canvasHeight)
    );
    if (!boundsKind) continue;
    markAllRecords(totalRecords, markRecordIssue);
    pushBoundsFinding(findings, boundsKind, staticElementLabel(element), element.id, 1);
  }

  for (const element of proofLinkElements) {
    const bbox = measureSingleProofLinkBBox(ctx, element, canvasWidth, canvasHeight);
    if (!bbox) continue;
    const boundsKind = boundsKindForStatus(
      classifyElementBBoxAgainstCanvas(bbox, canvasWidth, canvasHeight)
    );
    if (!boundsKind) continue;
    markAllRecords(totalRecords, markRecordIssue);
    pushBoundsFinding(findings, boundsKind, "Proof link", element.id, 1);
  }

  for (const element of dynamicTextElements) {
    const variable = element.variable ?? element.variableColumn;
    if (!linesMode && variable && !headers.includes(variable)) {
      findings.push({
        kind: "unknown-column",
        severity: "warning",
        count: totalRecords,
        label: `Unknown column "${variable}"`,
        elementId: element.id,
        columnKey: variable,
      });
      for (let i = 0; i < totalRecords; i++) {
        markRecordIssue(i);
      }
    }
  }

  for (const element of dynamicTextElements) {
    const columnLabel = elementColumnLabel(element, headers);
    const overflowIndices: number[] = [];
    const overflowNames: string[] = [];
    const shrunkIndices: number[] = [];
    const shrunkNames: string[] = [];
    const missingIndices: number[] = [];
    const missingNames: string[] = [];
    const clippedIndices: number[] = [];
    const clippedNames: string[] = [];
    const offCanvasIndices: number[] = [];
    const offCanvasNames: string[] = [];
    let worstCaseRecordIndex: number | undefined;
    let worstCaseWidth = -1;

    for (let i = 0; i < totalRecords; i++) {
      const row = records?.[i] ?? null;
      const displayLine = displayLines[i] ?? "";

      if (isRawValueMissing(element, row, displayLine, headers, linesMode)) {
        pushSample(missingIndices, missingNames, i, displayNameForIndex(displayLines, i));
        markRecordIssue(i);
      }

      const drawCtx = buildDrawContext(i, displayLines, records, headers);
      const text = resolveElementText(element, drawCtx);
      const measurement = measureTextElement(ctx, text, element, canvasWidth);
      if (measurement) {
        const maxWidth = Math.max(0, element.maxWidthPct * canvasWidth);

        if (measurement.width > maxWidth && maxWidth > 0) {
          pushSample(overflowIndices, overflowNames, i, displayNameForIndex(displayLines, i));
          markRecordIssue(i);
        }

        if (measurement.fontSize < element.fontSize && measurement.fontSize === MIN_FONT_SIZE_PX) {
          pushSample(shrunkIndices, shrunkNames, i, displayNameForIndex(displayLines, i));
          markRecordIssue(i);
        }

        if (measurement.width > worstCaseWidth) {
          worstCaseWidth = measurement.width;
          worstCaseRecordIndex = i;
        }
      }

      const bbox = measureSingleTextBBox(ctx, element, drawCtx, canvasWidth, canvasHeight);
      if (!bbox) continue;
      const boundsKind = boundsKindForStatus(
        classifyElementBBoxAgainstCanvas(bbox, canvasWidth, canvasHeight)
      );
      if (boundsKind === "clipped") {
        pushSample(clippedIndices, clippedNames, i, displayNameForIndex(displayLines, i));
        markRecordIssue(i);
      } else if (boundsKind === "off-canvas") {
        pushSample(offCanvasIndices, offCanvasNames, i, displayNameForIndex(displayLines, i));
        markRecordIssue(i);
      }
    }

    if (missingIndices.length > 0) {
      findings.push({
        kind: "missing",
        severity: "warning",
        count: missingIndices.length,
        label: `Missing ${columnLabel}`,
        sampleRecordIndices: missingIndices,
        sampleRecordNames: missingNames,
        elementId: element.id,
        columnKey: columnLabel,
      });
    }

    if (overflowIndices.length > 0) {
      findings.push({
        kind: "overflow",
        severity: "warning",
        count: overflowIndices.length,
        label: `${columnLabel} may overflow`,
        sampleRecordIndices: overflowIndices,
        sampleRecordNames: overflowNames,
        worstCaseRecordIndex,
        elementId: element.id,
        columnKey: columnLabel,
      });
    }

    if (shrunkIndices.length > 0) {
      findings.push({
        kind: "shrunk",
        severity: "warning",
        count: shrunkIndices.length,
        label: `${columnLabel} auto-shrunk to fit`,
        sampleRecordIndices: shrunkIndices,
        sampleRecordNames: shrunkNames,
        worstCaseRecordIndex,
        elementId: element.id,
        columnKey: columnLabel,
      });
    }

    if (clippedIndices.length > 0) {
      pushBoundsFinding(
        findings,
        "clipped",
        columnLabel,
        element.id,
        clippedIndices.length,
        clippedIndices,
        clippedNames
      );
    }

    if (offCanvasIndices.length > 0) {
      pushBoundsFinding(
        findings,
        "off-canvas",
        columnLabel,
        element.id,
        offCanvasIndices.length,
        offCanvasIndices,
        offCanvasNames
      );
    }
  }

  const duplicateGroups = new Map<string, number[]>();
  for (let i = 0; i < displayLines.length; i++) {
    const key = displayLines[i]?.trim().toLowerCase() ?? "";
    if (!key) continue;
    const group = duplicateGroups.get(key) ?? [];
    group.push(i);
    duplicateGroups.set(key, group);
  }

  const duplicateIndices: number[] = [];
  const duplicateNames: string[] = [];
  let duplicateCount = 0;
  for (const [, indices] of duplicateGroups) {
    if (indices.length <= 1) continue;
    duplicateCount += indices.length;
    for (const index of indices) {
      pushSample(duplicateIndices, duplicateNames, index, displayNameForIndex(displayLines, index));
      markRecordIssue(index);
    }
  }

  if (duplicateCount > 0) {
    findings.push({
      kind: "duplicate",
      severity: "warning",
      count: duplicateCount,
      label: "Duplicate output names",
      sampleRecordIndices: duplicateIndices,
      sampleRecordNames: duplicateNames,
    });
  }

  const readyCount = recordIssueCounts.filter((count) => count === 0).length;

  if (readyCount > 0) {
    findings.unshift({
      kind: "ready",
      severity: "ok",
      count: readyCount,
      label: "Ready",
    });
  }

  return {
    totalRecords,
    readyCount,
    findings,
    blocking: false,
  };
}
