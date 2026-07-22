"use client";

import { MobileGenerateRecommendationDialog } from "@/components/mobile-generate-recommendation-dialog";
import { ProjectWorkspace } from "@/components/project-workspace";
import { Header } from "@/components/header";
import { TooltipProvider } from "@/components/ui/tooltip";

export function GeneratePageShell() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid h-dvh max-h-dvh grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-background">
        <MobileGenerateRecommendationDialog />
        <Header />
        <main className="min-h-0 overflow-hidden px-0 py-0">
          <ProjectWorkspace />
        </main>
      </div>
    </TooltipProvider>
  );
}
