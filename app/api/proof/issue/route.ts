import { NextRequest, NextResponse } from 'next/server';
import { createProofToken } from '@/lib/proof/token.server';
import type { IssueProofRequest, IssueProofResponse } from '@/lib/proof/types';

export async function POST(request: NextRequest) {
  try {
    const body: IssueProofRequest = await request.json();

    if (!body.payloads || !Array.isArray(body.payloads) || body.payloads.length === 0) {
      return NextResponse.json({ error: 'payloads array is required' }, { status: 400 });
    }

    if (body.payloads.length > 1000) {
      return NextResponse.json({ error: 'Maximum 1000 tokens per request' }, { status: 400 });
    }

    const tokens: string[] = [];
    for (const payload of body.payloads) {
      if (!payload.sub || !payload.jti || !payload.iat) {
        return NextResponse.json({ error: 'Each payload requires sub, jti, and iat' }, { status: 400 });
      }
      tokens.push(await createProofToken(payload));
    }

    const response: IssueProofResponse = { tokens };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Token issuance error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Token issuance failed' },
      { status: 500 }
    );
  }
}
