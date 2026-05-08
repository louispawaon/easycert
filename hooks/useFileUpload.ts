"use client";

import { useState, useEffect, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useToast } from "@/hooks/useToast";
import { easyCertDb, type AttendeeEntryTab } from "@/lib/db/easycert-db";
import {
  saveCertificateImage,
  saveAttendeeListText,
  saveAttendeeTable,
  saveAttendeeEntryTab,
  saveFilenameColumn,
} from "@/lib/db/app-state";
import { defaultFilenameColumn } from "@/lib/attendees/attendee-dataset";
import { mirrorLinesFromFirstColumn, parseAttendeeCsv } from "@/lib/csv/parse-attendee-csv";
import type { ParseCsvResult } from "@/lib/csv/parse-attendee-csv";
import {
  notifyCertificateImageCleared,
  notifyCertificateImageUploaded,
} from "@/store/certificate-image-bridge";

export function useFileUpload() {
  const { toast } = useToast();
  const row = useLiveQuery(() => easyCertDb.appState.get("default"));
  const [attendeeList, setAttendeeList] = useState("");
  const [attendeeEntryTab, setAttendeeEntryTab] = useState<AttendeeEntryTab>("upload");
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (row === undefined) return;
    if (row.attendeeTable) {
      // File-backed datasets should not populate the manual textarea.
      setAttendeeList("");
      return;
    }
    setAttendeeList(row.attendeeListText ?? "");
  }, [row?.attendeeListText, row?.attendeeTable]);

  useEffect(() => {
    if (row?.attendeeEntryTab === "upload" || row?.attendeeEntryTab === "manual") {
      setAttendeeEntryTab(row.attendeeEntryTab);
    }
  }, [row?.attendeeEntryTab]);

  const handleAttendeeEntryTabChange = (value: string) => {
    if (value !== "upload" && value !== "manual") return;
    setAttendeeEntryTab(value);
    void saveAttendeeEntryTab(value);
  };

  const imagePreview = localImagePreview ?? row?.certificateImageUrl ?? null;

  const attendeeTable = row?.attendeeTable;
  const attendeeFilenameColumnPick = attendeeTable?.headers.length
    ? (row?.filenameColumn ?? defaultFilenameColumn(attendeeTable.headers) ?? attendeeTable.headers[0])
    : undefined;

  const processCertificateFile = useCallback(
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
          description: "Please upload an image file for the certificate template.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setLocalImagePreview(imageUrl);
        setIsUploading(false);
        notifyCertificateImageUploaded(imageUrl);
        void saveCertificateImage(imageUrl);
        toast({
          title: "Certificate template uploaded",
          description: "Your certificate template has been uploaded successfully.",
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

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processCertificateFile(file);
  };

  const handleAttendeeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      await saveAttendeeTable(parsed.table, mirrored);
      // Keep manual tab clean; uploaded file data is represented in upload mode summary.
      setAttendeeList("");
      setAttendeeEntryTab("upload");
      await saveAttendeeEntryTab("upload");
      toast({
        title: `Attendee ${sourceLabel} uploaded`,
        description: `${parsed.table.rows.length} rows · ${parsed.table.headers.length} columns`,
      });
    };

    const reader = new FileReader();
    reader.onload = (event) => {
      void (async () => {
        try {
          if (lower.endsWith(".xlsx") || lower.endsWith(".xlsm")) {
            const content = event.target?.result as ArrayBuffer;
            const { parseAttendeeXlsx } = await import("@/lib/xlsx/parse-attendee-xlsx");
            const parsed = await parseAttendeeXlsx(content);
            await persistParsedTable(parsed, "Excel file");
            return;
          }

          const content = event.target?.result as string;
          if (lower.endsWith(".csv")) {
            const parsed = parseAttendeeCsv(content);
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

          setAttendeeList(listText);
          void saveAttendeeListText(listText);

          toast({
            title: "Attendee list uploaded",
            description: "Your attendee list has been uploaded successfully.",
          });
        } catch {
          toast({
            title: "Error parsing file",
            description: "There was an error parsing the attendee file.",
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

  const handleClearCertificate = () => {
    setLocalImagePreview(null);
    notifyCertificateImageCleared();
    void saveCertificateImage(null);
  };

  const handleClearAttendees = () => {
    setAttendeeList("");
    void saveAttendeeListText("");
  };

  const handleManualAttendeeChange = (value: string) => {
    setAttendeeList(value);
    void saveAttendeeListText(value);
  };

  const persistFilenameColumn = useCallback((headerKey: string) => {
    void saveFilenameColumn(headerKey);
  }, []);

  return {
    attendeeList,
    attendeeEntryTab,
    imagePreview,
    isUploading,
    attendeeTable,
    attendeeRowCount: attendeeTable?.rows.length ?? attendeeList.split("\n").filter((l) => l.trim()).length,
    attendeeCsvColumnCount: attendeeTable?.headers.length ?? 0,
    attendeeFilenameColumnPick,
    persistFilenameColumn,
    processCertificateFile,
    handleCertificateUpload,
    handleAttendeeFileUpload,
    handleClearCertificate,
    handleClearAttendees,
    handleManualAttendeeChange,
    handleAttendeeEntryTabChange,
  };
}
