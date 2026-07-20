import type { ProofPayload, IssueProofResponse } from './types';

export async function issueProofTokens(
  payloads: ProofPayload[]
): Promise<string[]> {
  if (payloads.length === 0) return [];

  const res = await fetch('/api/proof/issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payloads }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`Failed to issue proof tokens: ${text}`);
  }

  const data: IssueProofResponse = await res.json();
  return data.tokens;
}
