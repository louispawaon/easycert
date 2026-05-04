"use client";

import { useCallback, useRef, useState } from "react";
import { FileUpload } from "@/components/file-upload/index";
import { CertificateDesigner } from "@/components/certificate-designer/index";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import {
  applyImportedAppState,
  loadAppState,
  stashCurrentProjectAsRecovery,
} from "@/lib/db/app-state";
import type { AppStateRecord } from "@/lib/db/easycert-db";
import { isRestorableProject } from "@/lib/db/session-utils";
import { readFileAsUtf8, downloadEasycertFile } from "@/lib/project/easycert-file";
import { Download, Upload } from "lucide-react";

export function ProjectWorkspace() {
  const [mountKey, setMountKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [overwriteOpen, setOverwriteOpen] = useState(false);
  const pendingAppRef = useRef<AppStateRecord | null>(null);

  const bumpMount = () => setMountKey((k) => k + 1);

  const handleExport = useCallback(async () => {
    try {
      const row = await loadAppState();
      if (!row || !isRestorableProject(row)) {
        toast({
          title: "Nothing to export",
          description: "Add a template, attendees, or text before exporting.",
          variant: "destructive",
        });
        return;
      }
      downloadEasycertFile(row, "easycert-project");
      toast({
        title: "Project exported",
        description: "Your .easycert file has been downloaded.",
      });
    } catch (e) {
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [toast]);

  const runImport = useCallback(
    async (app: AppStateRecord) => {
      try {
        await applyImportedAppState(app);
        bumpMount();
        toast({
          title: "Project imported",
          description: "Your workspace has been updated.",
        });
      } catch (e) {
        toast({
          title: "Import failed",
          description: e instanceof Error ? e.message : "Unknown error",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const finishImportIfNeeded = useCallback(
    async (app: AppStateRecord) => {
      const current = await loadAppState();
      if (isRestorableProject(current)) {
        pendingAppRef.current = app;
        setOverwriteOpen(true);
        return;
      }
      await runImport(app);
    },
    [runImport]
  );

  const onFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".easycert") && !lower.endsWith(".json")) {
        toast({
          title: "Unsupported file",
          description: "Choose a .easycert file (or a legacy backup .json).",
          variant: "destructive",
        });
        return;
      }
      const parsed = await readFileAsUtf8(file);
      if (!parsed.ok) {
        toast({ title: "Invalid file", description: parsed.error, variant: "destructive" });
        return;
      }
      await finishImportIfNeeded(parsed.app);
    },
    [finishImportIfNeeded, toast]
  );

  const confirmOverwrite = useCallback(async () => {
    const app = pendingAppRef.current;
    pendingAppRef.current = null;
    setOverwriteOpen(false);
    if (!app) return;
    try {
      await stashCurrentProjectAsRecovery();
    } catch (e) {
      console.error(e);
    }
    await runImport(app);
  }, [runImport]);

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2 mb-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".easycert,.json,application/json"
          onChange={onFileSelected}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          Import .easycert
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => void handleExport()}>
          <Download className="h-4 w-4 mr-2" />
          Export .easycert
        </Button>
      </div>

      <Dialog
        open={overwriteOpen}
        onOpenChange={(open) => {
          if (!open) pendingAppRef.current = null;
          setOverwriteOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace current project?</DialogTitle>
            <DialogDescription>
              This will overwrite the project in this browser. The current project will be kept as
              the last recovery snapshot in IndexedDB (no automatic download).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                pendingAppRef.current = null;
                setOverwriteOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void confirmOverwrite()}>
              Replace and import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div key={mountKey} className="grid gap-8">
        <FileUpload />
        <CertificateDesigner />
      </div>
    </>
  );
}
