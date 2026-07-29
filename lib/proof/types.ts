export interface ProofPayload {
  sub: string;
  name?: string;
  issuer?: string;
  iat: number;
  jti: string;
}

/** @deprecated Use `ProofPayload` instead. */
export type VerificationPayload = ProofPayload;

export interface IssueProofRequest {
  payloads: ProofPayload[];
}

export interface IssueProofResponse {
  tokens: string[];
}
