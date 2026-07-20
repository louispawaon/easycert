import type { Metadata } from "next";
import { verifyProofToken } from "@/lib/proof/token.server";
import { ProofResult } from "@/components/proof/ProofResult";
import { Header } from "@/components/header";

type Props = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const decoded = decodeURIComponent(token);
  const payload = await verifyProofToken(decoded);
  const valid = payload !== null;

  return {
    title: valid ? "Verified Design | Ditto" : "Invalid Link | Ditto",
    description: valid
      ? `Design verified for ${payload?.name ?? "a recipient"}`
      : "This proof link is invalid or has been tampered with.",
  };
}

export default async function ProofPage({ params }: Props) {
  const { token } = await params;
  const decoded = decodeURIComponent(token);
  const payload = await verifyProofToken(decoded);
  const valid = payload !== null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main
        id="proof-page-main"
        aria-labelledby="proof-page-label"
        className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12"
      >
        <div className="w-full max-w-lg space-y-3">
          <p
            id="proof-page-label"
            className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground"
          >
            Proof Link
          </p>
          <ProofResult valid={valid} payload={valid ? payload : undefined} />
        </div>
      </main>
    </div>
  );
}
