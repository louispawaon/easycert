"use client";

import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFileUpload } from "@/hooks/useFileUpload";
import { CertificateUpload } from "@/components/file-upload/CertificateUpload";
import { AttendeeUpload } from "@/components/file-upload/AttendeeUpload";

export interface FileUploadProps {
  wizardFooter?: ReactNode;
}

export function FileUpload({ wizardFooter }: FileUploadProps) {
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
        <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-semibold">Upload your files</CardTitle>
        <CardDescription className="text-sm sm:text-base lg:text-lg text-muted-foreground font-light">
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
      {wizardFooter ? (
        <CardFooter className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          {wizardFooter}
        </CardFooter>
      ) : null}
    </Card>
  );
} 