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
  const sampleToken =
    'AavN7xI0VniQq83vEjRWeJBmZpmACEpvaG4gRG9lD1Rlc3QgVW5pdmVyc2l0eQAAAAAAAAAAAAAAAAAAAAA';
  return `${base}/v/${sampleToken}`;
}
