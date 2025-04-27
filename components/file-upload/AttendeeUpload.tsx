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
    <div>
      <Label>Attendee List</Label>
      <Tabs defaultValue="upload" className="mt-2">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="p-0 mt-2">
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 w-full min-h-[300px]">
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
            className="min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={`John Doe\nJane Smith\nAlex Johnson`}  
            value={attendeeList}
            onChange={(e) => handleManualAttendeeChange(e.target.value)}
          />
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
  );
}