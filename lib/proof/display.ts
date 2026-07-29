import type { ProofPayload } from "./types";

export function getRecipientName(payload: ProofPayload): string {
  const name = (payload.name ?? payload.sub).trim();
  return name.length > 0 ? name : "Unknown recipient";
}

export function formatIssuedAt(iat: number): string {
  return new Date(iat * 1000).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export type ProofIdDisplay = {
  short: string;
  full: string;
};

export function formatProofId(jti: string): ProofIdDisplay {
  const trimmed = jti.trim();
  if (trimmed.length <= 12) {
    return { short: trimmed, full: trimmed };
  }
  const short = `${trimmed.slice(0, 8)}…${trimmed.slice(-4)}`;
  return { short, full: trimmed };
}
