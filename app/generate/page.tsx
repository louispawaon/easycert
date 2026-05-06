import type { Metadata } from "next";
import { ProjectWorkspace } from "@/components/project-workspace";
import { MobileGenerateRecommendationDialog } from "@/components/mobile-generate-recommendation-dialog";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
export const metadata: Metadata = {
  title: "Certificate Generation",
  description: "Automate your certificate generation process with EasyCert",
  openGraph: {
    title: "EasyCert",
    description: "Certificate generation, made easy.",
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
    title: "EasyCert",
    description: "Certificate generation, made easy.",
    images: ["/opengraph-image.png"],
  },
};

export default function GeneratePage() {
  return (
    <div className="min-h-screen bg-background">
      <MobileGenerateRecommendationDialog />
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <ProjectWorkspace />
      </main>
      <Footer />
    </div>
  );
}
