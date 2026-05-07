import type { Metadata } from "next";
import { GeneratePageShell } from "@/components/generate-page-shell";
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
  return <GeneratePageShell />;
}
