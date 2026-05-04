import type { TextElement } from "@/types/types";

/**
 * Ensures every font referenced by `elements` has been loaded, then waits for
 * `document.fonts.ready` to resolve. Without this, canvas text can silently
 * fall back to a system font when called before web/custom fonts settle.
 *
 * Safe to call in non-browser environments (no-op).
 */
export async function awaitFontsReady(elements: TextElement[] = []): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;

  const fontSet = new Set<string>();
  for (const el of elements) {
    if (!el.fontFamily) continue;
    fontSet.add(`${el.fontWeight} ${Math.max(1, Math.round(el.fontSize))}px "${el.fontFamily}"`);
  }

  const loadPromises: Promise<unknown>[] = [];
  for (const spec of fontSet) {
    try {
      loadPromises.push(document.fonts.load(spec));
    } catch {
      /* ignore — bad spec strings should not block rendering */
    }
  }

  if (loadPromises.length > 0) {
    await Promise.allSettled(loadPromises);
  }

  try {
    await document.fonts.ready;
  } catch {
    /* ignore — proceed even if the FontFaceSet rejects */
  }
}
