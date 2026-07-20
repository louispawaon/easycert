import Image from "next/image";
import Link from "next/link";

const PRODUCT_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#promises", label: "Promises" },
  { href: "#preview", label: "Live preview" },
  { href: "#faq", label: "FAQ" },
] as const;

const USE_CASE_LINKS = [
  { href: "#use-cases", label: "Certificates" },
  { href: "#use-cases", label: "Event badges" },
  { href: "#use-cases", label: "Name cards" },
  { href: "#use-cases", label: "Invitations" },
  { href: "#use-cases", label: "ID cards" },
] as const;

const PROJECT_LINKS = [
  { href: "#shift", label: "From EasyCert to Ditto" },
  { href: "/privacy", label: "Privacy" },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40 py-14">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="relative size-8 shrink-0">
                <Image
                  src="/ditto_logo.svg"
                  alt=""
                  width={32}
                  height={32}
                  className="size-full object-contain dark:invert"
                />
              </div>
              <span className="text-lg font-semibold tracking-tight">Ditto</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              You made one. Ditto the rest. A bulk design personalization tool
              for any repeatable, data-driven output.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Product</h4>
            <ul className="mt-4 space-y-2">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Use cases</h4>
            <ul className="mt-4 space-y-2">
              {USE_CASE_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Project</h4>
            <ul className="mt-4 space-y-2">
              {PROJECT_LINKS.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("/") ? (
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} Ditto. Same design. Different data.
            No repetitive edits.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
