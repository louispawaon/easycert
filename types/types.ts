import { PROOF_LINK_DEFAULT_SIZE_PCT } from "@/lib/canvas/proof-link-render";

export type TextElementType = 'dynamic-text' | 'static' | 'name';

export type TextElement = {
  id: string;
  type: TextElementType;
  variable?: string;
  x: number;
  y: number;
  maxWidthPct: number;
  fontSize: number;
  fontFamily: string;
  fontStyle: 'normal' | 'italic';
  fontWeight: 'normal' | 'bold';
  textDecoration: 'none' | 'underline';
  color: string;
  value: string | null;
  /** @deprecated Use `variable` instead. */
  variableColumn?: string;
};

export type ProofLinkElement = {
  id: string;
  type: 'proof-link';
  x: number;
  y: number;
  /** Width/height as fraction of canvas width (square). */
  sizePct: number;
  /** Foreground color. */
  color: string;
  /** Background color. Default white. */
  bgColor: string;
  /** When true, background is fully transparent (bgColor is ignored at draw time). */
  transparentBg: boolean;
  /** URL template with {token} placeholder. */
  urlTemplate: string;
};

/** @deprecated Use `ProofLinkElement` instead. */
export type QrElement = ProofLinkElement;

export type DesignElement = TextElement | ProofLinkElement;

export interface ImageDimensions {
  width: number;
  height: number;
}

export const DYNAMIC_TEXT_PLACEHOLDER = 'Record Name';

export function createDynamicTextElement(variableColumn?: string): TextElement {
  const el: TextElement = {
    id: crypto.randomUUID(),
    type: "dynamic-text",
    x: 0.5,
    y: 0.5,
    maxWidthPct: 0.7,
    fontSize: 52,
    fontFamily: "Georgia",
    fontStyle: "normal",
    fontWeight: "normal",
    textDecoration: "none",
    color: "#1a1a18",
    value: null,
  };
  const col = variableColumn?.trim();
  if (col) el.variable = col;
  return el;
}

/** @deprecated Use `createDynamicTextElement` instead. */
export function createNameElement(variableColumn?: string): TextElement {
  return createDynamicTextElement(variableColumn);
}

/** @deprecated Use `DYNAMIC_TEXT_PLACEHOLDER` instead. */
export { DYNAMIC_TEXT_PLACEHOLDER as NAME_PLACEHOLDER };

export function createStaticElement(): TextElement {
  return {
    id: crypto.randomUUID(),
    type: 'static',
    x: 0.5,
    y: 0.5,
    maxWidthPct: 0.6,
    fontSize: 24,
    fontFamily: 'Georgia',
    fontStyle: 'normal',
    fontWeight: 'normal',
    textDecoration: 'none',
    color: '#1a1a18',
    value: 'Enter text here',
  };
}

export function createProofLinkElement(urlTemplate: string): ProofLinkElement {
  return {
    id: crypto.randomUUID(),
    type: 'proof-link',
    x: 0.85,
    y: 0.15,
    sizePct: PROOF_LINK_DEFAULT_SIZE_PCT,
    color: '#000000',
    bgColor: '#ffffff',
    transparentBg: false,
    urlTemplate,
  };
}

/** @deprecated Use `createProofLinkElement` instead. */
export function createQrElement(urlTemplate: string): ProofLinkElement {
  return createProofLinkElement(urlTemplate);
}

export function isTextElement(el: DesignElement): el is TextElement {
  return el.type === 'dynamic-text' || el.type === 'name' || el.type === 'static';
}

export function isProofLinkElement(el: DesignElement): el is ProofLinkElement {
  return (el as ProofLinkElement).type === 'proof-link' || (el as Record<string, unknown>).type === 'qr';
}

/** @deprecated Use `isProofLinkElement` instead. */
export function isQrElement(el: DesignElement): el is ProofLinkElement {
  return isProofLinkElement(el);
}
