import './globals.css';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { FONT_CLASSES } from '@/lib/fonts';
import { QueryProvider } from '@/components/query-provider';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from "@vercel/analytics/react"

const FALLBACK_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

const BASE_METADATA: Metadata = {
  title: {
    default: 'EasyCert',
    template: '%s | EasyCert',
  },
  description: 'Certificate generation, made easy.',
  openGraph: {
    title: 'EasyCert',
    description: 'Certificate generation, made easy.',
    siteName: 'EasyCert',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'EasyCert',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EasyCert',
    description: 'Certificate generation, made easy.',
    images: ['/opengraph-image.png'],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const forwardedProto = headerStore.get('x-forwarded-proto') ?? 'https';
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host');
  const origin = host ? `${forwardedProto}://${host}` : FALLBACK_SITE_URL;

  if (!origin) {
    return BASE_METADATA;
  }

  return {
    ...BASE_METADATA,
    metadataBase: new URL(origin),
    alternates: {
      canonical: origin,
    },
    openGraph: {
      ...BASE_METADATA.openGraph,
      url: origin,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${FONT_CLASSES}`} suppressHydrationWarning>
      <body>
        <QueryProvider>
          {children}
          <Analytics />
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}