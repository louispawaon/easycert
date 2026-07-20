import type { Metadata } from "next";
import { GeneratePageShell } from "@/components/generate-page-shell";
export const metadata: Metadata = {
  title: "Design Personalization",
  description: "Personalize your designs with structured data using Ditto",
  openGraph: {
    title: "Ditto",
    description: "One design. Your data. Hundreds of personalized outputs.",
    siteName: "Ditto",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Ditto - Bulk Design Personalization",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ditto",
    description: "One design. Your data. Hundreds of personalized outputs.",
    images: ["/opengraph-image.png"],
  },
};

export default function GeneratePage() {
  return <GeneratePageShell />;
}
