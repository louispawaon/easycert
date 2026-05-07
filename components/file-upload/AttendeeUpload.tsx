"use client";

import { useMemo } from "react";
import { FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AttendeeEntryTab } from "@/lib/db/easycert-db";
import { cn } from "@/lib/cn";
import { GenerateHelpHint } from "@/components/generate-help-hint";

interface AttendeeUploadProps {
  attendeeList: string;
  attendeeEntryTab: AttendeeEntryTab;
  handleAttendeeEntryTabChange: (value: string) => void;
  handleAttendeeFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleManualAttendeeChange: (value: string) => void;
  handleClearAttendees: () => void;
}

export function AttendeeUpload({
  attendeeList,
  attendeeEntryTab,
  handleAttendeeEntryTabChange,
  handleAttendeeFileUpload,
  handleManualAttendeeChange,
  handleClearAttendees
}: AttendeeUploadProps) {
  const attendeeLineCount = useMemo(
    () => attendeeList.split("\n").filter((line) => line.trim()).length,
    [attendeeList]
  );
  const hasAttendees = attendeeLineCount > 0;

  return (
    <div id="easycert-onboarding-attendee-upload" className="min-w-0">
      <div className="flex items-center gap-1">
        <Label className="uppercase font-semibold">Attendee List</Label>
        <GenerateHelpHint label="Help: attendee list">
          <span>
            Put one full name per line, or upload a plain text file with one name per line. These names
            match the order of your certificates when you generate them.
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
        <TabsContent value="upload" className="p-0 mt-2">
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
              className="cursor-pointer group flex flex-col items-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <FileType className="h-6 w-6 text-primary" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                Click to upload .txt or .json file
              </p>
              <Input
                id="attendees"
                type="file"
                accept=".txt,.json"
                className="hidden"
                onChange={handleAttendeeFileUpload}
              />
            </label>
          </div>
        </TabsContent>
        <TabsContent value="manual" className="p-0 mt-2">
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
      {attendeeList && (
        <div className="mt-2 flex items-center justify-between">
          <p className={cn("text-sm", hasAttendees ? "text-success" : "text-muted-foreground")}>
            {attendeeLineCount} attendees loaded
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearAttendees}
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}