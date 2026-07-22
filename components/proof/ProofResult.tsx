"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  ChevronDown,
  Lock,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { ProofPayload } from "@/lib/proof/types";
import {
  formatIssuedAt,
  formatProofId,
  getRecipientName,
} from "@/lib/proof/display";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

interface ProofResultProps {
  valid: boolean;
  payload?: ProofPayload;
}

type GuillocheVariant = "success" | "destructive";

function ProofGuilloche({ variant = "success" }: { variant?: GuillocheVariant }) {
  const patternId = `proof-guilloche-${variant}`;
  const stroke =
    variant === "destructive"
      ? "color-mix(in oklch, var(--destructive) 28%, transparent)"
      : "color-mix(in oklch, var(--primary) 22%, transparent)";

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35]"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id={patternId}
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(12)"
        >
          <ellipse
            cx="24"
            cy="24"
            rx="18"
            ry="10"
            fill="none"
            stroke={stroke}
            strokeWidth="0.6"
          />
          <ellipse
            cx="24"
            cy="24"
            rx="10"
            ry="18"
            fill="none"
            stroke={stroke}
            strokeWidth="0.6"
          />
          <path
            d="M0 24 Q12 12 24 24 T48 24"
            fill="none"
            stroke={stroke}
            strokeWidth="0.5"
          />
          <path
            d="M24 0 Q36 12 24 24 T24 48"
            fill="none"
            stroke={stroke}
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

function ProofSeal({
  valid,
  reducedMotion,
}: {
  valid: boolean;
  reducedMotion: boolean;
}) {
  const checkPath = "M32 52 L44 64 L68 38";

  return (
    <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
      <div
        className={cn(
          "absolute inset-0 rounded-full",
          valid
            ? "bg-success/10 ring-1 ring-success/25"
            : "bg-destructive/10 ring-1 ring-destructive/25"
        )}
      />
      <div
        className={cn(
          "ditto-proof-foil absolute inset-1 rounded-full",
          !reducedMotion && valid && "opacity-70"
        )}
      />
      <svg
        viewBox="0 0 96 96"
        className="relative h-full w-full"
        aria-hidden
      >
        <circle
          cx="48"
          cy="48"
          r="42"
          fill="none"
          className={cn(
            valid ? "ditto-proof-seal-ring" : "stroke-destructive/40"
          )}
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <circle
          cx="48"
          cy="48"
          r="34"
          fill="none"
          className={cn(
            valid ? "ditto-proof-seal-ring" : "stroke-destructive/30"
          )}
          strokeWidth="1"
          strokeDasharray="2 4"
        />
        {valid ? (
          reducedMotion ? (
            <path
              d={checkPath}
              fill="none"
              stroke="var(--success)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <motion.path
              d={checkPath}
              fill="none"
              stroke="var(--success)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            />
          )
        ) : (
          <g transform="translate(48 48)">
            <line
              x1="-14"
              y1="-14"
              x2="14"
              y2="14"
              stroke="var(--destructive)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <line
              x1="14"
              y1="-14"
              x2="-14"
              y2="14"
              stroke="var(--destructive)"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>
        )}
      </svg>
    </div>
  );
}

function CredentialBand({ valid }: { valid: boolean }) {
  return (
    <div className="relative z-10 flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="relative h-6 w-6 shrink-0">
          <Image
            src="/ditto_logo.svg"
            alt=""
            fill
            className="object-contain dark:invert"
            aria-hidden
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">
            {valid ? "Verified by Ditto" : "Ditto Proof Link"}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">
            {valid ? "Authenticity credential" : "Verification failed"}
          </p>
        </div>
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider",
          valid
            ? "border-success/30 bg-success/10 text-success"
            : "border-destructive/30 bg-destructive/10 text-destructive"
        )}
      >
        {valid ? (
          <>
            <Lock className="h-3 w-3" aria-hidden />
            Secure
          </>
        ) : (
          <>
            <XCircle className="h-3 w-3" aria-hidden />
            Void
          </>
        )}
      </span>
    </div>
  );
}

function SecurityStrip({
  valid,
  proofIdShort,
  proofIdFull,
}: {
  valid: boolean;
  proofIdShort?: string;
  proofIdFull?: string;
}) {
  return (
    <div
      className={cn(
        "relative z-10 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t px-5 py-2.5 font-mono text-[10px] uppercase tracking-wide",
        valid
          ? "border-border/60 bg-muted/30 text-muted-foreground"
          : "border-destructive/20 bg-destructive/5 text-destructive/80"
      )}
    >
      {valid && proofIdShort ? (
        <>
          <span title={proofIdFull}>
            Proof ID <span className="text-foreground">{proofIdShort}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="ditto-signed-pulse inline-block size-1.5 rounded-full"
              aria-hidden
            />
            Cryptographically signed
          </span>
        </>
      ) : (
        <>
          <span>Signature mismatch</span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block size-1.5 rounded-full bg-destructive/70"
              aria-hidden
            />
            Link not verified
          </span>
        </>
      )}
    </div>
  );
}

function VoidStamp() {
  return (
    <div
      className="pointer-events-none absolute inset-x-6 top-1/2 z-20 flex -translate-y-1/2 justify-center"
      aria-hidden
    >
      <div className="rotate-[-8deg] rounded border-2 border-destructive/50 px-6 py-2 text-center">
        <p className="font-heading text-xl font-bold uppercase tracking-[0.2em] text-destructive/70">
          Void
        </p>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-destructive/50">
          Signature mismatch
        </p>
      </div>
    </div>
  );
}

function ProofFooter() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-5 space-y-3 text-center">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        aria-expanded={expanded}
      >
        How verification works
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            expanded && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      {expanded && (
        <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground">
          Opening this link confirms that Ditto generated a personalized design for
          the recipient shown. The link is uniquely signed and the information
          embedded here was sealed at export time.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Ditto is a bulk design personalization tool.{" "}
        <Link
          href="/generate"
          className="inline-flex items-center gap-1 font-medium text-foreground/80 transition-colors hover:text-foreground"
        >
          Create your own
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </p>
    </div>
  );
}

function FailureFooter() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-5 space-y-3 text-center">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        aria-expanded={expanded}
      >
        What might have gone wrong
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            expanded && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      {expanded && (
        <ul className="mx-auto max-w-md space-y-1 text-left text-xs leading-relaxed text-muted-foreground">
          <li>The link was modified or truncated after it was created</li>
          <li>The URL was copied incorrectly or is incomplete</li>
          <li>The signature does not match the embedded information</li>
          <li>The link uses an unsupported or outdated format</li>
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        Contact the issuer for a new proof link.{" "}
        <Link
          href="/generate"
          className="inline-flex items-center gap-1 font-medium text-foreground/80 transition-colors hover:text-foreground"
        >
          Create your own
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </p>
    </div>
  );
}

function CredentialShell({
  valid,
  children,
  footer,
}: {
  valid: boolean;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="w-full">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-card/80 shadow-2xl ring-1 backdrop-blur-xl",
          valid ? "ring-border/50" : "ring-destructive/20"
        )}
      >
        <ProofGuilloche variant={valid ? "success" : "destructive"} />
        {!valid && <VoidStamp />}
        <CredentialBand valid={valid} />
        {children}
      </div>
      {footer}
    </div>
  );
}

function ProofSuccess({ payload }: { payload: ProofPayload }) {
  const reducedMotion = usePrefersReducedMotion();
  const recipient = getRecipientName(payload);
  const proofId = formatProofId(payload.jti);
  const issuer = payload.issuer?.trim();

  return (
    <CredentialShell valid={true} footer={<ProofFooter />}>
      <div className="relative z-10 space-y-5 px-5 py-6">
        <div className="space-y-3 text-center">
          <ProofSeal valid reducedMotion={reducedMotion} />
          <div>
            <p className="font-heading text-lg font-semibold tracking-tight text-foreground">
              Design Verified
            </p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
              Personalized design issued through Ditto
            </p>
          </div>
        </div>

        <section aria-labelledby="recipient-heading" className="text-center">
          <p
            id="recipient-heading"
            className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
          >
            Issued to
          </p>
          <p className="font-display text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
            {recipient}
          </p>
        </section>

        <section
          aria-labelledby="meta-heading"
          className="grid grid-cols-1 gap-4 rounded-xl border border-border/60 bg-background/40 px-4 py-3 sm:grid-cols-2"
        >
          <h2 id="meta-heading" className="sr-only">
            Issuer and issue date
          </h2>
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Issued by
            </p>
            <p
              className={cn(
                "text-sm font-medium",
                issuer ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {issuer || "Not provided"}
            </p>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Issued on
            </p>
            <p className="text-sm font-medium text-foreground">
              {formatIssuedAt(payload.iat)}
            </p>
          </div>
        </section>
      </div>

      <SecurityStrip
        valid
        proofIdShort={proofId.short}
        proofIdFull={proofId.full}
      />
    </CredentialShell>
  );
}

function ProofFailure() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <CredentialShell valid={false} footer={<FailureFooter />}>
      <div className="relative z-10 space-y-5 px-5 py-6">
        <div className="space-y-3 text-center">
          <ProofSeal valid={false} reducedMotion={reducedMotion} />
          <div>
            <p className="font-heading text-lg font-semibold tracking-tight text-foreground">
              Proof Failed
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              This link could not be verified as a valid Ditto proof.
            </p>
          </div>
        </div>

        <section className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-center text-sm text-muted-foreground">
          <p>
            The cryptographic signature on this link is invalid or missing. Do not
            treat this as proof of authenticity.
          </p>
        </section>
      </div>

      <SecurityStrip valid={false} />
    </CredentialShell>
  );
}

export function ProofResult({ valid, payload }: ProofResultProps) {
  if (valid && payload) {
    return <ProofSuccess payload={payload} />;
  }

  return <ProofFailure />;
}
