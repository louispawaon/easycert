export type TextElementType = 'name' | 'static';

export type TextElement = {
  id: string;
  type: TextElementType;
  /** When set on a `name` element, value comes from this CSV column key (tabData). */
  variableColumn?: string;
  /** Center-anchor X as fraction of canvas width (0.0 - 1.0). */
  x: number;
  /** Center-anchor Y as fraction of canvas height (0.0 - 1.0). */
  y: number;
  /** Max text width as fraction of canvas width (0.0 - 1.0). */
  maxWidthPct: number;
  /** Base font size in px on the full-resolution canvas. */
  fontSize: number;
  fontFamily: string;
  fontStyle: 'normal' | 'italic';
  fontWeight: 'normal' | 'bold';
  textDecoration: 'none' | 'underline';
  color: string;
  /** Static text value. `null` for `type === 'name'` (resolved per-attendee at draw time). */
  value: string | null;
};

export interface ImageDimensions {
  width: number;
  height: number;
}

export const NAME_PLACEHOLDER = 'Attendee Name';

export function createNameElement(variableColumn?: string): TextElement {
  const el: TextElement = {
    id: crypto.randomUUID(),
    type: "name",
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
  if (col) el.variableColumn = col;
  return el;
}

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
