// import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { CertificateDesigner } from "@/components/certificate-designer";
import { ModeToggle } from "@/components/mode-toggle";
import { GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            <h1 className="text-xl font-bold">EasyCert</h1>
          </div>
          <ModeToggle />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Certificate Generation Made Easy</h2>
          <p className="mt-2 text-muted-foreground">
            Upload your certificate design, add your attendee list, and generate personalized certificates in seconds.
          </p>
        </div>
        <div className="grid gap-8">
          <FileUpload />
          <CertificateDesigner />
        </div>
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} EasyCert. All rights reserved.
        </div>
      </footer>
    </div>
  );
}