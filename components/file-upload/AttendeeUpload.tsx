import { FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AttendeeUploadProps {
  attendeeList: string;
  handleAttendeeFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleManualAttendeeChange: (value: string) => void;
  handleClearAttendees: () => void;
}

export function AttendeeUpload({
  attendeeList,
  handleAttendeeFileUpload,
  handleManualAttendeeChange,
  handleClearAttendees
}: AttendeeUploadProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Attendee List</Label>
        <Tabs defaultValue="upload">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <FileType className="h-6 w-6 text-primary" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload a .txt or .json file with attendee names
              </p>
              <Input
                id="attendees"
                type="file"
                accept=".txt,.json"
                className="mt-4"
                onChange={handleAttendeeFileUpload}
              />
            </div>
          </TabsContent>
          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-attendees">Enter attendee names (one per line)</Label>
              <textarea
                id="manual-attendees"
                className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="John Doe&#10;Jane Smith&#10;Alex Johnson"
                value={attendeeList}
                onChange={(e) => handleManualAttendeeChange(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>
        {attendeeList && (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {attendeeList.split('\n').filter(line => line.trim()).length} attendees loaded
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
    </div>
  );
} 