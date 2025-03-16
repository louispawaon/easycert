"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFileUpload } from "@/hooks/useFileUpload";
import { CertificateUpload } from "@/components/file-upload/CertificateUpload";
import { AttendeeUpload } from "@/components/file-upload/AttendeeUpload";

export function FileUpload() {
  const {
    attendeeList,
    imagePreview,
    isUploading,
    handleCertificateUpload,
    handleAttendeeFileUpload,
    handleClearCertificate,
    handleClearAttendees,
    handleManualAttendeeChange
  } = useFileUpload();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Files</CardTitle>
        <CardDescription>
          Upload your certificate template and attendee list to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <CertificateUpload
            imagePreview={imagePreview}
            handleCertificateUpload={handleCertificateUpload}
            handleClearCertificate={handleClearCertificate}
            isUploading={isUploading}
          />
          <AttendeeUpload
            attendeeList={attendeeList}
            handleAttendeeFileUpload={handleAttendeeFileUpload}
            handleManualAttendeeChange={handleManualAttendeeChange}
            handleClearAttendees={handleClearAttendees}
          />
        </div>
      </CardContent>
    </Card>
  );
} 