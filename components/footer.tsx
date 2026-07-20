import type { ReactNode } from "react";
import Link from "next/link";

interface FooterProps {
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function Footer({ leading, trailing }: FooterProps) {
  const hasNav = leading != null || trailing != null;

  if (!hasNav) {
    return (
      <footer className="shrink-0 border-t bg-background px-4 py-2">
        <p className="text-center text-xs text-muted-foreground">
          <FooterCredits />
        </p>
      </footer>
    );
  }

  return (
    <footer className="shrink-0 border-t bg-background px-4 py-2">
      <div
        id="ditto-onboarding-wizard-nav"
        className="flex items-center gap-3"
      >
        <div className="flex w-24 shrink-0 items-center justify-start sm:w-28">
          {leading}
        </div>
        <p className="min-w-0 flex-1 text-center text-xs leading-snug text-muted-foreground">
          <FooterCredits />
        </p>
        <div className="flex w-24 shrink-0 items-center justify-end sm:w-28">
          {trailing}
        </div>
      </div>
    </footer>
  );
}

function FooterCredits() {
  return (
    <>
      &copy; {new Date().getFullYear()} Ditto. Made with ❤️ by{" "}
      <Link href="https://louispawaon.pages.dev/" className="font-semibold">
        @miggy_pawaon
      </Link>
      <span className="mx-1.5">|</span>
      <Link href="/privacy" className="hover:underline">
        Privacy Policy
      </Link>
    </>
  );
}
