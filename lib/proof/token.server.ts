import "server-only";
import type { ProofPayload } from "./types";

const COMPACT_VERSION = 1;
const COMPACT_SIG_BYTES = 16;

function base64urlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getSecret(): string {
  const secret = process.env.VERIFY_SECRET;
  if (!secret) {
    throw new Error("VERIFY_SECRET environment variable is not set");
  }
  return secret;
}

const ALGO = { name: "HMAC", hash: "SHA-256" } as const;

async function importKey(secret: string, usage: KeyUsage): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret).buffer as ArrayBuffer,
    ALGO,
    false,
    [usage]
  );
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function uuidToBytes(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, "");
  if (hex.length !== 32) throw new Error("Invalid jti UUID");
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function packCompactPayload(payload: ProofPayload): Uint8Array {
  const enc = new TextEncoder();
  const name = (payload.name ?? payload.sub).trim();
  const issuer = payload.issuer?.trim() ?? "";
  const nameBytes = enc.encode(name);
  const issuerBytes = enc.encode(issuer);

  if (nameBytes.length === 0 || nameBytes.length > 255) {
    throw new Error("Recipient name must be between 1 and 255 characters");
  }
  if (issuerBytes.length > 255) {
    throw new Error("Issuer must be 255 characters or fewer");
  }

  const packed = new Uint8Array(1 + 16 + 4 + 1 + nameBytes.length + 1 + issuerBytes.length);
  let offset = 0;
  packed[offset++] = COMPACT_VERSION;
  packed.set(uuidToBytes(payload.jti), offset);
  offset += 16;

  const iat = payload.iat >>> 0;
  packed[offset++] = (iat >> 24) & 255;
  packed[offset++] = (iat >> 16) & 255;
  packed[offset++] = (iat >> 8) & 255;
  packed[offset++] = iat & 255;
  packed[offset++] = nameBytes.length;
  packed.set(nameBytes, offset);
  offset += nameBytes.length;
  packed[offset++] = issuerBytes.length;
  packed.set(issuerBytes, offset);
  return packed;
}

function unpackCompactPayload(packed: Uint8Array): ProofPayload | null {
  if (packed.length < 1 + 16 + 4 + 1 + 1 || packed[0] !== COMPACT_VERSION) return null;

  let offset = 1;
  const jti = bytesToUuid(packed.slice(offset, offset + 16));
  offset += 16;

  const iat =
    (packed[offset] << 24) |
    (packed[offset + 1] << 16) |
    (packed[offset + 2] << 8) |
    packed[offset + 3];
  offset += 4;

  const nameLen = packed[offset++];
  if (offset + nameLen + 1 > packed.length) return null;
  const name = new TextDecoder().decode(packed.slice(offset, offset + nameLen));
  offset += nameLen;

  const issuerLen = packed[offset++];
  if (offset + issuerLen !== packed.length) return null;
  const issuer = issuerLen > 0 ? new TextDecoder().decode(packed.slice(offset, offset + issuerLen)) : undefined;

  return {
    jti,
    iat: iat >>> 0,
    sub: name,
    name,
    issuer,
  };
}

async function signCompactPayload(packed: Uint8Array): Promise<Uint8Array> {
  const key = await importKey(getSecret(), "sign");
  const fullSig = new Uint8Array(await crypto.subtle.sign("HMAC", key, packed.buffer as ArrayBuffer));
  return fullSig.slice(0, COMPACT_SIG_BYTES);
}

async function verifyCompactSignature(packed: Uint8Array, signature: Uint8Array): Promise<boolean> {
  const key = await importKey(getSecret(), "sign");
  const fullSig = new Uint8Array(await crypto.subtle.sign("HMAC", key, packed.buffer as ArrayBuffer));
  return timingSafeEqual(fullSig.slice(0, COMPACT_SIG_BYTES), signature);
}

async function createCompactProofToken(payload: ProofPayload): Promise<string> {
  const packed = packCompactPayload(payload);
  const signature = await signCompactPayload(packed);
  const token = new Uint8Array(packed.length + signature.length);
  token.set(packed);
  token.set(signature, packed.length);
  return base64urlEncode(token);
}

async function verifyCompactToken(token: string): Promise<ProofPayload | null> {
  try {
    const bytes = base64urlDecode(token);
    if (bytes.length < 1 + 16 + 4 + 1 + 1 + COMPACT_SIG_BYTES) return null;

    const packed = bytes.slice(0, bytes.length - COMPACT_SIG_BYTES);
    const signature = bytes.slice(bytes.length - COMPACT_SIG_BYTES);
    if (!(await verifyCompactSignature(packed, signature))) return null;

    const payload = unpackCompactPayload(packed);
    if (!payload?.jti || !payload.iat || !payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}

const HEADER = { alg: "HS256", typ: "JWT" };

async function createJwtProofToken(payload: ProofPayload): Promise<string> {
  const encoder = new TextEncoder();
  const headerB64 = base64urlEncode(encoder.encode(JSON.stringify(HEADER)));
  const payloadB64 = base64urlEncode(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await importKey(getSecret(), "sign");
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signingInput));
  const sigB64 = base64urlEncode(signature);

  return `${signingInput}.${sigB64}`;
}

async function verifyJwtToken(token: string): Promise<ProofPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    if (!headerB64 || !payloadB64 || !sigB64) return null;

    const encoder = new TextEncoder();
    const signingInput = `${headerB64}.${payloadB64}`;
    const key = await importKey(getSecret(), "verify");
    const signature = base64urlDecode(sigB64);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature.buffer as ArrayBuffer,
      encoder.encode(signingInput)
    );
    if (!valid) return null;

    const payloadRaw = JSON.parse(
      new TextDecoder().decode(base64urlDecode(payloadB64))
    ) as ProofPayload;
    if (!payloadRaw.jti || !payloadRaw.iat || !payloadRaw.sub) return null;
    return payloadRaw;
  } catch {
    return null;
  }
}

/** Compact signed token for proof links; much shorter than JWT. */
export async function createProofToken(payload: ProofPayload): Promise<string> {
  return createCompactProofToken(payload);
}

/** Accepts compact tokens (current) and legacy JWT links. */
export async function verifyProofToken(token: string): Promise<ProofPayload | null> {
  if (token.includes(".")) {
    const jwt = await verifyJwtToken(token);
    if (jwt) return jwt;
  }
  return verifyCompactToken(token);
}

export const __test = {
  packCompactPayload,
  unpackCompactPayload,
  createJwtProofToken,
};
