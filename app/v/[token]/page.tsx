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

function ProofPageBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      <div className="ditto-hero-grid ditto-hero-grid--animated absolute inset-0" />
      <div className="ditto-hero-aurora ditto-hero-aurora--primary" />
      <div className="ditto-hero-aurora ditto-hero-aurora--secondary" />
    </div>
  );
}

export default async function ProofPage({ params }: Props) {
  const { token } = await params;
  const decoded = decodeURIComponent(token);
  const payload = await verifyProofToken(decoded);
  const valid = payload !== null;

  return (
    <div className="relative min-h-screen bg-background">
      <ProofPageBackground />
      <div className="relative z-10">
        <Header />
        <main
          id="proof-page-main"
          className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12"
        >
          <div className="w-full max-w-xl">
            <ProofResult valid={valid} payload={valid ? payload : undefined} />
          </div>
        </main>
      </div>
    </div>
  );
}
