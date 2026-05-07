"use client";

import { MobileGenerateRecommendationDialog } from "@/components/mobile-generate-recommendation-dialog";
import { ProjectWorkspace } from "@/components/project-workspace";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { TooltipProvider } from "@/components/ui/tooltip";

export function GeneratePageShell() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen min-w-0 bg-background">
        <MobileGenerateRecommendationDialog />
        <Header />
        <main className="container mx-auto max-w-full min-w-0 overflow-x-clip px-4 py-6 sm:py-8">
          <ProjectWorkspace />
        </main>
        <Footer />
      </div>
    </TooltipProvider>
  );
}
