"use client";

import { useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { easyCertDb } from "@/lib/db/easycert-db";
import { saveAttendeeListText } from "@/lib/db/app-state";
import { DEMO_ATTENDEES } from "@/lib/demo-attendees";

export function useAttendees() {
  const row = useLiveQuery(() => easyCertDb.appState.get("default"));

  const attendees = useMemo(() => {
    if (row === undefined) return [];
    if (row.attendeeListText === undefined) return DEMO_ATTENDEES;
    return row.attendeeListText.split("\n").filter((line) => line.trim());
  }, [row]);

  const setAttendees = useCallback((names: string[]) => {
    void saveAttendeeListText(names.join("\n"));
  }, []);

  return { attendees, setAttendees };
}
