export { cn } from "./cn";
export { renderImage } from "./render-image";

export function addEventListener(event: string, handler: EventListener): void {
  window.addEventListener(event, handler);
}

export function removeEventListener(event: string, handler: EventListener): void {
  window.removeEventListener(event, handler);
}

export function dispatchEvent(event: CustomEvent): void {
  window.dispatchEvent(event);
}

/** Normalize a complete 6-digit hex color to lowercase; pass through partial values while typing. */
export function normalizeHexColor(value: string): string {
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return trimmed;
}
