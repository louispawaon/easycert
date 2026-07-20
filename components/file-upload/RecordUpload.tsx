"use client";

import { useMemo, useState, useCallback } from "react";
import { FileType, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RecordEntryTab, RecordManualMode, RecordTable } from "@/lib/db/ditto-db";
import { defaultFilenameColumn, normalizeHeaderKeys } from "@/lib/records/record-dataset";
import { cn } from "@/lib/cn";
import { GenerateHelpHint } from "@/components/generate-help-hint";
import {
  parseDelimitedTable,
  parseManualJson,
  parseSimpleList,
  recordsToJson,
  recordsToSimpleList,
  updateTableCell,
  updateTableHeader,
  addTableRow,
  removeTableRow,
  addTableColumn,
  removeTableColumn,
  normalizeTableHeadersOnBlur,
  type ManualDelimiter,
} from "@/lib/records/manual-input";

interface RecordUploadProps {
  recordListText: string;
  recordEntryTab: RecordEntryTab;
  handleRecordEntryTabChange: (value: string) => void;
  recordManualMode: RecordManualMode;
  handleRecordManualModeChange: (value: string) => void;
  handleRecordFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleManualRecordChange: (value: string) => void;
  handleManualSimpleChange: (value: string) => void;
  handleManualTableChange: (table: RecordTable, mirror: string) => void;
  handleManualJsonChange: (table: RecordTable, json: string) => void;
  handleClearRecords: () => void;
  recordTable?: RecordTable;
  recordRowCountEstimate: number;
  recordCsvColumnCount: number;
  recordFilenameColumnPick?: string;
  onFilenameColumnChange: (columnKey: string) => void;
}

export function RecordUpload({
  recordListText,
  recordEntryTab,
  handleRecordEntryTabChange,
  recordManualMode,
  handleRecordManualModeChange,
  handleRecordFileUpload,
  handleManualRecordChange,
  handleManualSimpleChange,
  handleManualTableChange,
  handleManualJsonChange,
  handleClearRecords,
  recordTable,
  recordRowCountEstimate,
  recordCsvColumnCount,
  recordFilenameColumnPick,
  onFilenameColumnChange,
}: RecordUploadProps) {
  const recordLineCount = useMemo(
    () => recordListText.split("\n").filter((line) => line.trim()).length,
    [recordListText]
  );
  const hasRecords =
    recordRowCountEstimate > 0 || recordLineCount > 0 || (recordTable?.rows.length ?? 0) > 0;

  const [tableDelimiter, setTableDelimiter] = useState<ManualDelimiter>("auto");
  const [jsonText, setJsonText] = useState("");
  const [tableText, setTableText] = useState("");
  const [editingTable, setEditingTable] = useState<RecordTable | null>(null);

  const deriveTableData = useCallback(() => {
    if (recordTable && recordTable.rows.length > 0) {
      setEditingTable(recordTable);
      if (recordTable.headers.length > 1) {
        setTableText(
          [recordTable.headers.join("\t"), ...recordTable.rows.map((r) => r.join("\t"))].join("\n")
        );
      }
      setJsonText(recordsToJson(recordTable));
    }
  }, [recordTable]);

  useMemo(() => {
    if (recordEntryTab !== "manual") return;
    deriveTableData();
  }, [recordEntryTab, deriveTableData]);

  // Prefer the live editing table so the filename picker appears as soon as
  // multi-column data is entered, without waiting for a blur/commit.
  const liveTable =
    recordEntryTab === "manual" ? (editingTable ?? recordTable) : recordTable;

  // Headers can be empty/duplicated mid-typing (normalization only runs on
  // blur), so normalize here to keep the Select options valid and stable.
  const filenameHeaders = useMemo(
    () => (liveTable ? normalizeHeaderKeys(liveTable.headers) : []),
    [liveTable]
  );

  const showFilenamePick = filenameHeaders.length > 1;

  const filenameSelectValue = useMemo(() => {
    if (!showFilenamePick) return "";
    const p = recordFilenameColumnPick?.trim() ?? "";
    if (p && filenameHeaders.includes(p)) return p;
    return defaultFilenameColumn(filenameHeaders) ?? filenameHeaders[0] ?? "";
  }, [showFilenamePick, filenameHeaders, recordFilenameColumnPick]);

  const handleSimpleListChange = (value: string) => {
    handleManualSimpleChange(value);
    setEditingTable(parseSimpleList(value));
  };

  const handleTableTextChange = (value: string) => {
    setTableText(value);
    const parsed = parseDelimitedTable(value, tableDelimiter);
    setEditingTable(parsed);
  };

  const handleTableDelimiterChange = (value: string) => {
    const delim = value as ManualDelimiter;
    setTableDelimiter(delim);
    const parsed = parseDelimitedTable(tableText, delim);
    setEditingTable(parsed);
  };

  const handleTableBlur = () => {
    if (!editingTable) return;
    const normalized = normalizeTableHeadersOnBlur(editingTable);
    setEditingTable(normalized);
    const mirror = recordsToSimpleList(normalized);
    handleManualTableChange(normalized, mirror);
    setTableText(
      [normalized.headers.join("\t"), ...normalized.rows.map((r) => r.join("\t"))].join("\n")
    );
  };

  const handleJsonTextChange = (value: string) => {
    setJsonText(value);
    const result = parseManualJson(value);
    if ("error" in result) return;
    setEditingTable(result);
  };

  const handleJsonBlur = () => {
    const result = parseManualJson(jsonText);
    if ("error" in result) return;
    const normalized = normalizeTableHeadersOnBlur(result);
    setEditingTable(normalized);
    handleManualJsonChange(normalized, jsonText);
  };

  const onCellChange = (rowIdx: number, colIdx: number, value: string) => {
    if (!editingTable) return;
    const updated = updateTableCell(editingTable, rowIdx, colIdx, value);
    setEditingTable(updated);
  };

  const onHeaderChange = (colIdx: number, value: string) => {
    if (!editingTable) return;
    const updated = updateTableHeader(editingTable, colIdx, value);
    setEditingTable(updated);
  };

  const onAddRow = () => {
    if (!editingTable) return;
    setEditingTable(addTableRow(editingTable));
  };

  const onRemoveRow = (idx: number) => {
    if (!editingTable) return;
    setEditingTable(removeTableRow(editingTable, idx));
  };

  const onAddCol = () => {
    if (!editingTable) return;
    setEditingTable(addTableColumn(editingTable));
  };

  const onRemoveCol = (idx: number) => {
    if (!editingTable) return;
    setEditingTable(removeTableColumn(editingTable, idx));
  };

  return (
    <div
      id="ditto-onboarding-record-upload"
      className="flex h-full min-h-0 min-w-0 flex-col"
    >
      <div className="flex shrink-0 items-center gap-1">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-tight leading-none">Record List</h3>
        <GenerateHelpHint label="Help: record list">
          <span>
            Add records by pasting values, or upload a TXT, CSV, JSON, or Excel file.
            For CSV and Excel, we use row 1 as the column names and read the first sheet in Excel.
          </span>
        </GenerateHelpHint>
      </div>
      <Tabs
        value={recordEntryTab}
        onValueChange={handleRecordEntryTabChange}
        className="mt-3 flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="grid w-full shrink-0 grid-cols-2">
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="manual">Data Input</TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="mt-2 flex min-h-0 flex-1 flex-col p-0">
          <div
            className={cn(
              "flex min-h-[240px] flex-1 w-full flex-col items-center justify-center rounded-md border-2 p-8 transition-[border-color,box-shadow,background-color]",
              hasRecords
                ? "border-success bg-success/5 shadow-[0_0_0_4px_var(--success-ring)]"
                : "border-dashed border-border"
            )}
          >
            <label
              htmlFor="records"
              className="group flex cursor-pointer flex-col items-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                <FileType className="h-6 w-6 text-primary" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground transition-colors group-hover:text-primary">
                Click to upload record file (.txt, .json, .csv, .xlsx)
              </p>
              <Input
                id="records"
                type="file"
                accept=".txt,.json,.csv,.xlsx,.xlsm,text/plain,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12"
                className="hidden"
                onChange={handleRecordFileUpload}
              />
            </label>
          </div>
        </TabsContent>
        <TabsContent value="manual" className="mt-2 flex min-h-0 flex-1 flex-col p-0">
          <Tabs
            value={recordManualMode}
            onValueChange={handleRecordManualModeChange}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TabsList className="grid w-full shrink-0 grid-cols-3">
              <TabsTrigger value="simple">Simple List</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>
            <TabsContent value="simple" className="mt-2 flex min-h-0 flex-1 flex-col p-0">
              <textarea
                id="manual-records"
                className={cn(
                  "min-h-[240px] flex-1 w-full rounded-md border-2 bg-background px-3 py-2 text-sm ring-offset-background transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  hasRecords
                    ? "border-success shadow-[0_0_0_4px_var(--success-ring)]"
                    : "border-input"
                )}
                placeholder={`John Doe\nJane Smith\nAlex Johnson`}
                value={recordListText}
                onChange={(e) => handleSimpleListChange(e.target.value)}
              />
            </TabsContent>
            <TabsContent value="table" className="mt-2 flex min-h-0 flex-1 flex-col p-0 space-y-2">
              <div className="flex shrink-0 items-center gap-2">
                <Label className="text-xs whitespace-nowrap">Delimiter</Label>
                <Select value={tableDelimiter} onValueChange={handleTableDelimiterChange}>
                  <SelectTrigger className="min-w-0 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="tab">Tab</SelectItem>
                    <SelectItem value="comma">Comma (CSV)</SelectItem>
                    <SelectItem value="pipe">Pipe</SelectItem>
                    <SelectItem value="single">Single column</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <textarea
                className={cn(
                  "min-h-[80px] w-full shrink-0 rounded-md border bg-background px-3 py-2 text-xs font-mono ring-offset-background transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  hasRecords ? "border-success" : "border-input"
                )}
                placeholder={`Name\tRole\nAlex Rivera\tEngineer\nJamie Chen\tDesigner`}
                value={tableText}
                onChange={(e) => handleTableTextChange(e.target.value)}
                onBlur={handleTableBlur}
              />
              {editingTable && editingTable.headers.length > 0 && (
                <div className="min-h-0 flex-1 overflow-auto rounded-md border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="w-8 shrink-0 border-r p-1" />
                        {editingTable.headers.map((header, ci) => (
                          <th key={ci} className="border-r p-1 last:border-r-0">
                            <div className="flex items-center gap-1">
                              <input
                                className="w-full min-w-[60px] bg-transparent px-1 py-0.5 font-medium text-foreground outline-none"
                                value={header}
                                onChange={(e) => onHeaderChange(ci, e.target.value)}
                                onBlur={handleTableBlur}
                              />
                              {editingTable.headers.length > 1 && (
                                <button
                                  type="button"
                                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
                                  onClick={() => onRemoveCol(ci)}
                                  title="Remove column"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="w-8 shrink-0 p-1">
                          <button
                            type="button"
                            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                            onClick={onAddCol}
                            title="Add column"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingTable.rows.map((row, ri) => (
                        <tr key={ri} className="border-t">
                          <td className="w-8 shrink-0 border-r p-1 text-center">
                            <button
                              type="button"
                              className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                              onClick={() => onRemoveRow(ri)}
                              title="Remove row"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                          {row.map((cell, ci) => (
                            <td key={ci} className="border-r p-1 last:border-r-0">
                              <input
                                className="w-full min-w-[60px] bg-transparent px-1 py-0.5 text-foreground outline-none"
                                value={cell}
                                onChange={(e) => onCellChange(ri, ci, e.target.value)}
                                onBlur={handleTableBlur}
                              />
                            </td>
                          ))}
                          <td className="w-8 shrink-0 p-1" />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="border-t p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto w-full justify-start py-1 text-xs"
                      onClick={onAddRow}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add row
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="json" className="mt-2 flex min-h-0 flex-1 flex-col p-0">
              <textarea
                className={cn(
                  "min-h-[240px] flex-1 w-full rounded-md border-2 bg-background px-3 py-2 text-xs font-mono ring-offset-background transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  hasRecords ? "border-success" : "border-input"
                )}
                placeholder={`["Alex Rivera", "Jamie Chen"]\n\nor\n\n[{ "name": "Alex Rivera", "role": "Engineer" }]`}
                value={jsonText}
                onChange={(e) => handleJsonTextChange(e.target.value)}
                onBlur={handleJsonBlur}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
      {showFilenamePick && filenameSelectValue ? (
        <div className="mt-4 shrink-0 space-y-2 rounded-md border border-border/80 bg-muted/15 p-3">
          <div className="flex flex-wrap items-center gap-1">
            <Label className="font-subheading text-xs font-semibold uppercase tracking-widest leading-snug">Filename column</Label>
            <GenerateHelpHint label="Help: filenames from CSV">
              <span>
                We use this column when naming your downloaded files.
                Pick something clear like full name or ID.
              </span>
            </GenerateHelpHint>
          </div>
          <Select value={filenameSelectValue} onValueChange={onFilenameColumnChange}>
            <SelectTrigger className="min-w-0 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filenameHeaders.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {(recordListText || recordRowCountEstimate > 0) && (
        <div className="mt-2 flex shrink-0 items-center justify-between gap-3">
          <p className={cn("text-sm", hasRecords ? "text-success" : "text-muted-foreground")}>
            {recordCsvColumnCount > 1
              ? `${recordRowCountEstimate} record${recordRowCountEstimate === 1 ? "" : "s"} · ${recordCsvColumnCount} columns`
              : `${recordRowCountEstimate} record${recordRowCountEstimate === 1 ? "" : "s"} loaded`}
          </p>
          <Button variant="outline" size="sm" onClick={handleClearRecords}>
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
