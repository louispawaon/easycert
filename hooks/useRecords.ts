"use client";

import { useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { dittoDb } from "@/lib/db/ditto-db";
import {
  saveRecordListText,
  saveFilenameColumn,
} from "@/lib/db/app-state";
import { DEMO_RECORDS } from "@/lib/demo-records";
import {
  defaultFilenameColumn,
  isRecordLinesMode,
  resolveFilenameForRow,
  tableToRecords,
} from "@/lib/records/record-dataset";

export function useRecords() {
  const row = useLiveQuery(() => dittoDb.appState.get("default"));

  const recordModel = useMemo(() => {
    if (row === undefined) {
      return {
        recordLinesMode: true,
        recordDisplayLines: [] as string[],
        recordRows: null as Record<string, string>[] | null,
        headers: [] as string[],
        filenameColumn: undefined as string | undefined,
      };
    }

    const table = row.recordTable;
    let filenameColumn = row.filenameColumn;

    if (!table || table.headers.length === 0) {
      const lines =
        row.recordListText === undefined
          ? DEMO_RECORDS
          : row.recordListText.split("\n").filter((l) => l.trim());

      return {
        recordLinesMode: true,
        recordDisplayLines: lines,
        recordRows: null as Record<string, string>[] | null,
        headers: [] as string[],
        filenameColumn: undefined as string | undefined,
      };
    }

    const headers = table.headers;
    const recordLinesMode = isRecordLinesMode(table);
    const records = tableToRecords(table);

    if (
      filenameColumn !== undefined &&
      filenameColumn !== "" &&
      !headers.includes(filenameColumn)
    ) {
      filenameColumn = defaultFilenameColumn(headers);
    } else if (filenameColumn === undefined || filenameColumn === "") {
      filenameColumn = defaultFilenameColumn(headers);
    }

    const displayLines = records.map((rec, i) =>
      resolveFilenameForRow(rec, filenameColumn, i)
    );

    return {
      recordLinesMode,
      recordDisplayLines: displayLines,
      recordRows: records,
      headers,
      filenameColumn,
    };
  }, [row]);

  const setRecords = useCallback((names: string[]) => {
    void saveRecordListText(names.join("\n"));
  }, []);

  const setFilenameColumnHeader = useCallback((headerKey: string | undefined) => {
    void saveFilenameColumn(headerKey);
  }, []);

  return {
    recordDisplayLines: recordModel.recordDisplayLines,
    recordRows: recordModel.recordRows,
    records: recordModel.recordDisplayLines,
    headers: recordModel.headers,
    recordLinesMode: recordModel.recordLinesMode,
    filenameColumn: recordModel.filenameColumn,
    setFilenameColumn: setFilenameColumnHeader,
    setRecords,
  };
}
