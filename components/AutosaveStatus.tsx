"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { dittoDb } from "@/lib/db/ditto-db";
import { formatSavedAtLabel } from "@/lib/db/session-utils";

export function AutosaveStatus() {
  const row = useLiveQuery(() => dittoDb.appState.get("default"));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const label = useMemo(
    () => formatSavedAtLabel(row?.savedAt),
    [row?.savedAt, tick]
  );

  if (!label) return null;

  return (
    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{label}</span>
  );
}
