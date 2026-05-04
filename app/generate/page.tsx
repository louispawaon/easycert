import type { Metadata } from "next";
import { SessionRestoreGate } from "@/components/session-restore-gate";
import { ProjectWorkspace } from "@/components/project-workspace";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Smartphone } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Certificate Generation",
  description: "Automate your certificate generation process with EasyCert",
  openGraph: {
    title: "EasyCert - Certificate Generation Made Easy",
    description: "Automate your certificate generation process with EasyCert",
    siteName: "EasyCert",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "EasyCert - Certificate Generation Made Easy",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EasyCert - Certificate Generation Made Easy",
    description: "Automate your certificate generation process with EasyCert",
    images: ["/opengraph-image.png"],
  },
};

export default function GeneratePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="md:hidden">
        <Alert className="bg-yellow-50 dark:bg-yellow-900 border-yellow-400 dark:border-yellow-600">
          <AlertDescription className="flex items-center gap-2 justify-center text-sm text-yellow-900 dark:text-yellow-100">
            <Smartphone className="w-4 h-4" />
            For the best experience, we recommend using EasyCert on a desktop or tablet.
          </AlertDescription>
        </Alert>
      </div>
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 text-center px-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Certificate Generation Made Easy</h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Upload your certificate design, add your attendee list, and generate personalized certificates in seconds.
          </p>
        </div>
        <SessionRestoreGate>
          <ProjectWorkspace />
        </SessionRestoreGate>
      </main>
      <Footer />
    </div>
  );
}
