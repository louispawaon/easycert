import './globals.css';
import type { Metadata } from 'next';
import { FONT_CLASSES } from '@/lib/fonts';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'EasyCert - Certificate Generation Made Easy',
  description: 'Automate your certificate generation process with EasyCert',
  openGraph: {
    title: 'EasyCert - Certificate Generation Made Easy',
    description: 'Automate your certificate generation process with EasyCert',
    url: 'https://easycert.vercel.app/',
    siteName: 'EasyCert',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'EasyCert - Certificate Generation Made Easy',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EasyCert - Certificate Generation Made Easy',
    description: 'Automate your certificate generation process with EasyCert',
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}