"use client";

import { useState, useEffect, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useToast } from "@/hooks/useToast";
import { dittoDb, type RecordEntryTab, type RecordManualMode, type RecordTable } from "@/lib/db/ditto-db";
import {
  saveTemplateImage,
  saveRecordListText,
  saveRecordTable,
  saveRecordEntryTab,
  saveRecordManualMode,
  saveFilenameColumn,
} from "@/lib/db/app-state";
import { defaultFilenameColumn } from "@/lib/records/record-dataset";
import { mirrorLinesFromFirstColumn, parseRecordCsv } from "@/lib/csv/parse-record-csv";
import type { ParseCsvResult } from "@/lib/csv/parse-record-csv";
import { recordsToSimpleList } from "@/lib/records/manual-input";
import {
  notifyTemplateImageCleared,
  notifyTemplateImageUploaded,
} from "@/store/template-image-bridge";

export function useFileUpload() {
  const { toast } = useToast();
  const row = useLiveQuery(() => dittoDb.appState.get("default"));
  const [recordListText, setRecordListText] = useState("");
  const [recordEntryTab, setRecordEntryTab] = useState<RecordEntryTab>("upload");
  const [recordManualMode, setRecordManualMode] = useState<RecordManualMode>("simple");
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (row === undefined) return;
    if (row.recordTable) {
      setRecordListText(recordsToSimpleList(row.recordTable));
      return;
    }
    setRecordListText(row.recordListText ?? "");
  }, [row?.recordListText, row?.recordTable]);

  useEffect(() => {
    if (row?.recordEntryTab === "upload" || row?.recordEntryTab === "manual") {
      setRecordEntryTab(row.recordEntryTab);
    }
  }, [row?.recordEntryTab]);

  useEffect(() => {
    if (row?.recordManualMode === "simple" || row?.recordManualMode === "table" || row?.recordManualMode === "json") {
      setRecordManualMode(row.recordManualMode);
    }
  }, [row?.recordManualMode]);

  const handleRecordEntryTabChange = (value: string) => {
    if (value !== "upload" && value !== "manual") return;
    setRecordEntryTab(value);
    void saveRecordEntryTab(value);
  };

  const handleRecordManualModeChange = (value: string) => {
    if (value !== "simple" && value !== "table" && value !== "json") return;
    setRecordManualMode(value);
    void saveRecordManualMode(value);
  };

  const imagePreview = localImagePreview ?? row?.templateImageUrl ?? null;

  const recordTable = row?.recordTable;
  const recordFilenameColumnPick = recordTable?.headers.length
    ? (row?.filenameColumn ?? defaultFilenameColumn(recordTable.headers) ?? recordTable.headers[0])
    : undefined;

  const processTemplateFile = useCallback(
    (file: File) => {
      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);

      if (!file.type.startsWith("image/")) {
        setIsUploading(false);
        toast({
          title: "Invalid file type",
          description: "Please upload an image file for the design template.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setLocalImagePreview(imageUrl);
        setIsUploading(false);
        notifyTemplateImageUploaded(imageUrl);
        void saveTemplateImage(imageUrl);
        toast({
          title: "Design template uploaded",
          description: "Your design template has been uploaded successfully.",
        });
      };

      reader.onerror = () => {
        setIsUploading(false);
        toast({
          title: "Upload failed",
          description: "There was an error processing your image.",
          variant: "destructive",
        });
      };

      reader.readAsDataURL(file);
    },
    [toast]
  );

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processTemplateFile(file);
  };

  const handleRecordFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const lower = file.name.toLowerCase();

    const persistParsedTable = async (parsed: ParseCsvResult, sourceLabel: string) => {
      if (!parsed.ok) {
        toast({
          title: `Could not parse ${sourceLabel}`,
          description: parsed.error,
          variant: "destructive",
        });
        return;
      }
      const mirrored = mirrorLinesFromFirstColumn(parsed.table);
      await saveRecordTable(parsed.table, mirrored);
      // Keep manual tab clean; uploaded file data is represented in upload mode summary.
      setRecordListText("");
      setRecordEntryTab("upload");
      await saveRecordEntryTab("upload");
      toast({
        title: `Record ${sourceLabel} uploaded`,
        description: `${parsed.table.rows.length} rows · ${parsed.table.headers.length} columns`,
      });
    };

    const reader = new FileReader();
    reader.onload = (event) => {
      void (async () => {
        try {
          if (lower.endsWith(".xlsx") || lower.endsWith(".xlsm")) {
            const content = event.target?.result as ArrayBuffer;
            const { parseRecordXlsx } = await import("@/lib/xlsx/parse-record-xlsx");
            const parsed = await parseRecordXlsx(content);
            await persistParsedTable(parsed, "Excel file");
            return;
          }

          const content = event.target?.result as string;
          if (lower.endsWith(".csv")) {
            const parsed = parseRecordCsv(content);
            await persistParsedTable(parsed, "CSV");
            return;
          }

          let listText = content;
          if (file.name.endsWith(".json")) {
            const jsonData = JSON.parse(content) as unknown;
            if (Array.isArray(jsonData)) {
              listText = jsonData.join("\n");
            } else if (typeof jsonData === "object" && jsonData !== null) {
              const names = Object.values(jsonData).filter(
                (value): value is string => typeof value === "string"
              );
              listText = names.join("\n");
            }
          }

          setRecordListText(listText);
          void saveRecordListText(listText);

          toast({
            title: "Record list uploaded",
            description: "Your record list has been uploaded successfully.",
          });
        } catch {
          toast({
            title: "Error parsing file",
            description: "There was an error parsing the record file.",
            variant: "destructive",
          });
        }
      })();
    };
    if (lower.endsWith(".xlsx") || lower.endsWith(".xlsm")) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
    e.target.value = "";
  };

  const handleClearTemplate = () => {
    setLocalImagePreview(null);
    notifyTemplateImageCleared();
    void saveTemplateImage(null);
  };

  const handleClearRecords = () => {
    setRecordListText("");
    void saveRecordListText("");
    void saveRecordTable({ headers: [], rows: [] }, "");
  };

  const handleManualRecordChange = (value: string) => {
    setRecordListText(value);
    void saveRecordListText(value);
  };

  const handleManualSimpleChange = useCallback((value: string) => {
    setRecordListText(value);
    const table = { headers: ["Value"], rows: value.split("\n").map((l) => [l.trim()]) };
    void saveRecordListText(value);
    void saveRecordTable(table, value);
  }, []);

  const handleManualTableChange = useCallback((table: RecordTable, mirror: string) => {
    setRecordListText(mirror);
    void saveRecordTable(table, mirror);
  }, []);

  const handleManualJsonChange = useCallback((table: RecordTable, json: string) => {
    const mirror = table.headers.length > 0 ? table.rows.map((r) => (r[0] ?? "").trim()).join("\n") : "";
    setRecordListText(mirror);
    void saveRecordTable(table, mirror);
  }, []);

  const persistFilenameColumn = useCallback((headerKey: string) => {
    void saveFilenameColumn(headerKey);
  }, []);

  return {
    recordListText,
    recordEntryTab,
    recordManualMode,
    imagePreview,
    isUploading,
    recordTable,
    recordRowCount: recordTable?.rows.length ?? recordListText.split("\n").filter((l) => l.trim()).length,
    recordCsvColumnCount: recordTable?.headers.length ?? 0,
    recordFilenameColumnPick,
    persistFilenameColumn,
    processTemplateFile,
    handleTemplateUpload,
    handleRecordFileUpload,
    handleClearTemplate,
    handleClearRecords,
    handleManualRecordChange,
    handleRecordEntryTabChange,
    handleRecordManualModeChange,
    handleManualSimpleChange,
    handleManualTableChange,
    handleManualJsonChange,
  };
}
