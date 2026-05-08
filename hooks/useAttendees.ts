"use client";

import { useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { easyCertDb } from "@/lib/db/easycert-db";
import {
  saveAttendeeListText,
  saveFilenameColumn,
} from "@/lib/db/app-state";
import { DEMO_ATTENDEES } from "@/lib/demo-attendees";
import {
  defaultFilenameColumn,
  isAttendeeLinesMode,
  resolveFilenameForRow,
  tableToRecords,
} from "@/lib/attendees/attendee-dataset";

export function useAttendees() {
  const row = useLiveQuery(() => easyCertDb.appState.get("default"));

  const attendeeModel = useMemo(() => {
    if (row === undefined) {
      return {
        linesMode: true,
        attendeeDisplayLines: [] as string[],
        attendeeRows: null as Record<string, string>[] | null,
        tableHeadersOrdered: [] as string[],
        filenameColumn: undefined as string | undefined,
      };
    }

    const table = row.attendeeTable;
    let filenameColumn = row.filenameColumn;

    if (!table || table.headers.length === 0) {
      const lines =
        row.attendeeListText === undefined
          ? DEMO_ATTENDEES
          : row.attendeeListText.split("\n").filter((l) => l.trim());

      return {
        linesMode: true,
        attendeeDisplayLines: lines,
        attendeeRows: null as Record<string, string>[] | null,
        tableHeadersOrdered: [] as string[],
        filenameColumn: undefined as string | undefined,
      };
    }

    const headers = table.headers;
    const linesMode = isAttendeeLinesMode(table);
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
      linesMode,
      attendeeDisplayLines: displayLines,
      attendeeRows: records,
      tableHeadersOrdered: headers,
      filenameColumn,
    };
  }, [row]);

  const setAttendees = useCallback((names: string[]) => {
    void saveAttendeeListText(names.join("\n"));
  }, []);

  const setFilenameColumnHeader = useCallback((headerKey: string | undefined) => {
    void saveFilenameColumn(headerKey);
  }, []);

  return {
    /** @deprecated use attendeeDisplayLines */
    attendees: attendeeModel.attendeeDisplayLines,
    attendeeDisplayLines: attendeeModel.attendeeDisplayLines,
    attendeeRows: attendeeModel.attendeeRows,
    tableHeadersOrdered: attendeeModel.tableHeadersOrdered,
    linesMode: attendeeModel.linesMode,
    filenameColumn: attendeeModel.filenameColumn,
    setFilenameColumn: setFilenameColumnHeader,
    setAttendees,
  };
}
