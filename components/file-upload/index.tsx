"use client";

import { useFileUpload } from "@/hooks/useFileUpload";
import { TemplateUpload } from "@/components/file-upload/TemplateUpload";
import { RecordUpload } from "@/components/file-upload/RecordUpload";
import { UploadEditorShell } from "@/components/file-upload/upload-editor-shell";

export interface FileUploadProps {
  className?: string;
}

export function FileUpload({ className }: FileUploadProps) {
  const {
    recordListText,
    imagePreview,
    isUploading,
    processTemplateFile,
    handleRecordFileUpload,
    handleClearTemplate,
    handleClearRecords,
    handleManualRecordChange,
    recordEntryTab,
    handleRecordEntryTabChange,
    recordManualMode,
    handleRecordManualModeChange,
    handleManualSimpleChange,
    handleManualTableChange,
    handleManualJsonChange,
    recordTable,
    recordRowCount,
    recordCsvColumnCount,
    recordFilenameColumnPick,
    persistFilenameColumn,
  } = useFileUpload();

  return (
    <UploadEditorShell
      className={className}
      templateUpload={
        <TemplateUpload
          imagePreview={imagePreview}
          onTemplateFile={processTemplateFile}
          handleClearTemplate={handleClearTemplate}
          isUploading={isUploading}
        />
      }
      recordUpload={
        <RecordUpload
          recordListText={recordListText}
          recordEntryTab={recordEntryTab}
          handleRecordEntryTabChange={handleRecordEntryTabChange}
          recordManualMode={recordManualMode}
          handleRecordManualModeChange={handleRecordManualModeChange}
          handleRecordFileUpload={handleRecordFileUpload}
          handleManualRecordChange={handleManualRecordChange}
          handleManualSimpleChange={handleManualSimpleChange}
          handleManualTableChange={handleManualTableChange}
          handleManualJsonChange={handleManualJsonChange}
          handleClearRecords={handleClearRecords}
          recordTable={recordTable}
          recordRowCountEstimate={recordRowCount}
          recordCsvColumnCount={recordCsvColumnCount}
          recordFilenameColumnPick={recordFilenameColumnPick}
          onFilenameColumnChange={persistFilenameColumn}
        />
      }
    />
  );
}
