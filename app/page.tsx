import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/nav";
import { LandingHero } from "@/components/landing/hero";
import { LogosStrip } from "@/components/landing/logos-strip";
import { TheShift } from "@/components/landing/the-shift";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ProductPromises } from "@/components/landing/product-promises";
import { LivePreview } from "@/components/landing/live-preview";
import { UseCases } from "@/components/landing/use-cases";
import { DataAware } from "@/components/landing/data-aware";
import { FAQ } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { LandingFooter } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: { absolute: "Ditto" },
  description:
    "Bulk design personalization. Upload one design, add your data, and generate hundreds of personalized outputs.",
  openGraph: {
    title: "Ditto",
    description:
      "Bulk design personalization. One design. Your data. Hundreds of outputs.",
    siteName: "Ditto",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Ditto",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ditto",
    description:
      "Bulk design personalization. One design. Your data. Hundreds of outputs.",
    images: ["/opengraph-image.png"],
  },
};

export default function Home() {
  return (
    <div className="min-h-svh bg-background text-foreground antialiased">
      <LandingNav />
      <main>
        <LandingHero />
        <LogosStrip />
        <TheShift />
        <HowItWorks />
        <ProductPromises />
        <LivePreview />
        <UseCases />
        <DataAware />
        <FAQ />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
