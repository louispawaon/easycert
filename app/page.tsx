import { FileUpload } from "@/components/file-upload/index";
import { CertificateDesigner } from "@/components/certificate-designer/index";
import { ModeToggle } from "@/components/mode-toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Smartphone } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="md:hidden">
        <Alert className="bg-yellow-50 border-yellow-400">
          <AlertDescription className="flex items-center gap-2 justify-center text-sm">
            <Smartphone className="w-4 h-4" />
            For the best experience, we recommend using EasyCert on a desktop or tablet.
          </AlertDescription>
        </Alert>
      </div>
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold">EasyCert</h1>
          </div>
          <ModeToggle />
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 text-center px-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Certificate Generation Made Easy</h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
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