import './globals.css';
import type { Metadata } from 'next';
import { FONT_CLASSES } from '@/lib/fonts';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'EasyCert - Certificate Generation Made Easy',
  description: 'Automate your certificate generation process with EasyCert',
  openGraph:{
    title: 'EasyCert - Certificate Generation Made Easy',
    description: 'Automate your certificate generation process with EasyCert',
    url: "https://easycert.vercel.app/"
  }
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