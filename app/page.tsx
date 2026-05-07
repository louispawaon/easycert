import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { CertificateHero } from "@/components/certificate-hero";

const archivoHero = Archivo({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-archivo-hero",
});

export const metadata: Metadata = {
  title: { absolute: "EasyCert" },
  description:
    "Automate personalized certificate design and bulk delivery. Open the generator to upload templates, map attendees, and export in seconds.",
  openGraph: {
    title: "EasyCert",
    description:
      "Automate personalized certificate design and bulk delivery. Open the generator to get started.",
    siteName: "EasyCert",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "EasyCert",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EasyCert",
    description:
      "Automate personalized certificate design and bulk delivery. Open the generator to get started.",
    images: ["/opengraph-image.png"],
  },
};

export default function Home() {
  return (
    <div
      className={`${archivoHero.variable} h-[min(100dvh,100svh)] max-h-[min(100dvh,100svh)] overflow-hidden bg-background text-foreground antialiased [font-family:var(--font-archivo-hero),system-ui,sans-serif]`}
    >
      <CertificateHero />
    </div>
  );
}
