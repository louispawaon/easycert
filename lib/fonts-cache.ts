/** In-memory cache for custom fonts; persisted via IndexedDB (see lib/db/app-state). */

let customFontsCache: Record<string, string> = {};

export function getCustomFontsCache(): Record<string, string> {
  return customFontsCache;
}

export function setCustomFontsCache(fonts: Record<string, string>): void {
  customFontsCache = { ...fonts };
}

export function updateCustomFontsCache(mutator: (current: Record<string, string>) => Record<string, string>): void {
  customFontsCache = mutator({ ...customFontsCache });
}
