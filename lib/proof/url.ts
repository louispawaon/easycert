export function buildProofUrl(token: string): string {
  const base = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL) ?? 'http://localhost:3000';
  return `${base}/v/${token}`;
}

/** @deprecated Use `buildProofUrl` instead. */
export { buildProofUrl as buildVerificationUrl };

export const PROOF_URL_TEMPLATE = '{NEXT_PUBLIC_SITE_URL}/v/{token}';

export const PROOF_TOKEN_PLACEHOLDER = '__PROOF_TOKEN__';

export function buildProofLinkUrlTemplate(): string {
  const base = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL) ?? 'http://localhost:3000';
  return `${base}/v/${PROOF_TOKEN_PLACEHOLDER}`;
}

/** Representative URL for proof link layout sizing (matches typical issued token length). */
export function buildProofSizingPlaceholderUrl(): string {
  const base = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL) ?? 'http://localhost:3000';
  // Low-entropy stand-in only — not a real proof token. Length ≈ compact tokens for "Name"/"Issuer".
  const sampleToken = "x".repeat(83);
  return `${base}/v/${sampleToken}`;
}
