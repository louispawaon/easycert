"use client";

import { useMemo } from "react";
import { FileType } from "lucide-react";
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
import type { AttendeeEntryTab, AttendeeTable } from "@/lib/db/easycert-db";
import { isAttendeeLinesMode } from "@/lib/attendees/attendee-dataset";
import { cn } from "@/lib/cn";
import { GenerateHelpHint } from "@/components/generate-help-hint";

interface AttendeeUploadProps {
  attendeeList: string;
  attendeeEntryTab: AttendeeEntryTab;
  handleAttendeeEntryTabChange: (value: string) => void;
  handleAttendeeFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleManualAttendeeChange: (value: string) => void;
  handleClearAttendees: () => void;
  attendeeTable?: AttendeeTable;
  attendeeRowCountEstimate: number;
  attendeeCsvColumnCount: number;
  /** Effective filename column shown in picker (must match table header). */
  attendeeFilenameColumnPick?: string;
  onFilenameColumnChange: (columnKey: string) => void;
}

export function AttendeeUpload({
  attendeeList,
  attendeeEntryTab,
  handleAttendeeEntryTabChange,
  handleAttendeeFileUpload,
  handleManualAttendeeChange,
  handleClearAttendees,
  attendeeTable,
  attendeeRowCountEstimate,
  attendeeCsvColumnCount,
  attendeeFilenameColumnPick,
  onFilenameColumnChange,
}: AttendeeUploadProps) {
  const attendeeLineCount = useMemo(
    () => attendeeList.split("\n").filter((line) => line.trim()).length,
    [attendeeList]
  );
  const hasAttendees =
    attendeeRowCountEstimate > 0 || attendeeLineCount > 0 || (attendeeTable?.rows.length ?? 0) > 0;

  const showFilenamePick =
    attendeeTable &&
    !isAttendeeLinesMode(attendeeTable) &&
    attendeeTable.headers.length > 1;

  const filenameSelectValue = useMemo(() => {
    if (!showFilenamePick || !attendeeTable) return "";
    const headers = attendeeTable.headers;
    const p = attendeeFilenameColumnPick?.trim() ?? "";
    if (p && headers.includes(p)) return p;
    return headers[0] ?? "";
  }, [showFilenamePick, attendeeTable, attendeeFilenameColumnPick]);

  return (
    <div id="easycert-onboarding-attendee-upload" className="min-w-0">
      <div className="flex items-center gap-1">
        <Label className="uppercase font-semibold">Attendee List</Label>
        <GenerateHelpHint label="Help: attendee list">
          <span>
            Add attendees by pasting names, or upload a TXT, CSV, JSON, or Excel file.
            For CSV and Excel, we use row 1 as the column names and read the first sheet in Excel.
          </span>
        </GenerateHelpHint>
      </div>
      <Tabs
        value={attendeeEntryTab}
        onValueChange={handleAttendeeEntryTabChange}
        className="mt-2"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="manual">Paste Names</TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="mt-2 p-0">
          <div
            className={cn(
              "flex min-h-[300px] w-full flex-col items-center justify-center rounded-md border-2 p-8 transition-[border-color,box-shadow,background-color]",
              hasAttendees
                ? "border-success bg-success/5 shadow-[0_0_0_4px_hsl(var(--success)/0.12)]"
                : "border-dashed border-border"
            )}
          >
            <label
              htmlFor="attendees"
              className="group flex cursor-pointer flex-col items-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                <FileType className="h-6 w-6 text-primary" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground transition-colors group-hover:text-primary">
                Click to upload attendee file (.txt, .json, .csv, .xlsx)
              </p>
              <Input
                id="attendees"
                type="file"
                accept=".txt,.json,.csv,.xlsx,.xlsm,text/plain,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12"
                className="hidden"
                onChange={handleAttendeeFileUpload}
              />
            </label>
          </div>
        </TabsContent>
        <TabsContent value="manual" className="mt-2 p-0">
          <p className="mb-2 text-xs text-muted-foreground">
            Paste mode is only for manual typing. Uploaded files are managed in the Upload File tab.
          </p>
          <textarea
            id="manual-attendees"
            className={cn(
              "min-h-[300px] w-full rounded-md border-2 bg-background px-3 py-2 text-sm ring-offset-background transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              hasAttendees
                ? "border-success shadow-[0_0_0_4px_hsl(var(--success)/0.12)]"
                : "border-input"
            )}
            placeholder={`John Doe\nJane Smith\nAlex Johnson`}
            value={attendeeList}
            onChange={(e) => handleManualAttendeeChange(e.target.value)}
          />
        </TabsContent>
      </Tabs>
      {showFilenamePick && attendeeTable && filenameSelectValue ? (
        <div className="mt-4 space-y-2 rounded-md border border-border/80 bg-muted/15 p-3">
          <div className="flex flex-wrap items-center gap-1">
            <Label className="text-xs font-semibold uppercase">Filename column</Label>
            <GenerateHelpHint label="Help: filenames from CSV">
              <span>
                We use this column when naming your downloaded files.
                Pick something clear like full name or ID.
              </span>
            </GenerateHelpHint>
          </div>
          <Select value={filenameSelectValue} onValueChange={onFilenameColumnChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {attendeeTable.headers.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {(attendeeList || attendeeRowCountEstimate > 0) && (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className={cn("text-sm", hasAttendees ? "text-success" : "text-muted-foreground")}>
            {attendeeCsvColumnCount > 1
              ? `${attendeeRowCountEstimate} attendee${attendeeRowCountEstimate === 1 ? "" : "s"} · ${attendeeCsvColumnCount} columns`
              : `${attendeeRowCountEstimate} attendee${attendeeRowCountEstimate === 1 ? "" : "s"} loaded`}
          </p>
          <Button variant="outline" size="sm" onClick={handleClearAttendees}>
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
