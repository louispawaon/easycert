"use client";

import type { ReactNode } from "react";
import type { ProofPayload } from "@/lib/proof/types";
import {
  getRecipientName,
  formatIssuedAt,
  formatProofId,
} from "@/lib/proof/display";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface ProofResultProps {
  valid: boolean;
  payload?: ProofPayload;
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-3 gap-y-1 border-b border-border/60 py-3 last:border-b-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm text-foreground wrap-break-word">{children}</dd>
    </div>
  );
}

function ProofFooter() {
  return (
    <div className="border-t pt-5 text-center">
      <p className="mb-3 text-xs text-muted-foreground">
        Ditto is a bulk design personalization tool. Create personalized outputs in
        minutes.
      </p>
      <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground">
        <Link href="/generate">
          Create your own
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}

function ProofSuccess({ payload }: { payload: ProofPayload }) {
  const recipient = getRecipientName(payload);
  const proofId = formatProofId(payload.jti);
  const issuer = payload.issuer?.trim();

  return (
    <>
      <CardHeader className="border-b bg-muted/30 pb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Design Verified</CardTitle>
        <CardDescription className="text-sm">
          This personalized design was issued through Ditto.
        </CardDescription>
        <Badge className="mx-auto mt-4 w-fit px-4 py-1.5 text-sm">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Verified by Ditto
          </span>
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <section aria-labelledby="recipient-heading">
          <p
            id="recipient-heading"
            className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Recipient
          </p>
          <p className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
            {recipient}
          </p>
        </section>

        <section aria-labelledby="issuer-heading">
          <p
            id="issuer-heading"
            className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Issued by
          </p>
          <p className={issuer ? "text-lg font-medium text-foreground" : "text-lg text-muted-foreground"}>
            {issuer || "Not provided"}
          </p>
        </section>

        <section aria-labelledby="details-heading">
          <p
            id="details-heading"
            className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Proof details
          </p>
          <dl>
            <DetailRow label="Issued on">{formatIssuedAt(payload.iat)}</DetailRow>
            <DetailRow label="Proof ID">
              <span title={proofId.full} className="font-mono text-xs sm:text-sm">
                {proofId.short}
              </span>
            </DetailRow>
            <DetailRow label="Signature">
              <span className="text-success">Valid — link verified cryptographically</span>
            </DetailRow>
          </dl>
        </section>

        <section
          aria-labelledby="about-heading"
          className="rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground"
        >
          <p id="about-heading" className="mb-2 font-medium text-foreground">
            About this proof
          </p>
          <p className="leading-relaxed">
            Opening this link confirms that Ditto generated a personalized design for the recipient
            above. The link is uniquely signed and the information shown here is embedded in the
            proof link at export time.
          </p>
        </section>

        <ProofFooter />
      </CardContent>
    </>
  );
}

function ProofFailure() {
  return (
    <>
      <CardHeader className="border-b bg-destructive/5 pb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-8 w-8 text-destructive" aria-hidden />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Proof Failed</CardTitle>
        <CardDescription className="text-sm">
          This link could not be verified as a valid Ditto proof.
        </CardDescription>
        <Badge variant="destructive" className="mx-auto mt-4 w-fit px-4 py-1.5 text-sm">
          <span className="flex items-center gap-1.5">
            <XCircle className="h-4 w-4" aria-hidden />
            Invalid or tampered link
          </span>
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 text-foreground">
          <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden />
          <AlertTitle>What might have gone wrong</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
              <li>The link was modified or truncated after it was created</li>
              <li>The URL was copied incorrectly or is incomplete</li>
              <li>The signature does not match the embedded information</li>
              <li>The link uses an unsupported or outdated format</li>
            </ul>
          </AlertDescription>
        </Alert>

        <section className="rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">What you can do</p>
          <p className="mt-2 leading-relaxed">
            Contact the organization that issued this design and ask them to resend your output
            or provide a new proof link.
          </p>
        </section>

        <ProofFooter />
      </CardContent>
    </>
  );
}

export function ProofResult({ valid, payload }: ProofResultProps) {
  return (
    <Card className="mx-auto w-full max-w-lg overflow-hidden shadow-lg">
      {valid && payload ? (
        <ProofSuccess payload={payload} />
      ) : (
        <ProofFailure />
      )}
    </Card>
  );
}
