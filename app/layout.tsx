import './globals.css';
import type { Metadata } from 'next';
import { FONT_CLASSES } from '@/lib/fonts';
import { QueryProvider } from '@/components/query-provider';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from "@vercel/analytics/react"

export const metadata: Metadata = {
  metadataBase: new URL('https://easycert.vercel.app/'),
  title: {
    default: 'EasyCert',
    template: '%s | EasyCert',
  },
  description: 'Create and distribute personalized certificates at scale.',
  openGraph: {
    title: 'EasyCert',
    description: 'Create and distribute personalized certificates at scale.',
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
    description: 'Create and distribute personalized certificates at scale.',
    images: ['/opengraph-image.png'],
  },
};

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