"use client";

import { useEffect, useState } from 'react';
import { getCustomFonts, removeCustomFont } from '@/lib/fonts';

export function useFontLoader(fontFamily?: string) {
  const [isFontLoaded, setIsFontLoaded] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Custom fonts from in-memory cache (hydrated from IndexedDB on app load)
    const customFonts = getCustomFonts();

    // Load all custom fonts on initial mount
    Object.entries(customFonts).forEach(([name, url]) => {
      // Skip invalid URLs
      if (!url || typeof url !== 'string') return;
      
      const style = document.createElement('style');
      style.textContent = `
        @font-face {
          font-family: '${name}';
          src: url(${url});
        }
      `;
      document.head.appendChild(style);
    });

    // Load specific font if requested
    if (fontFamily && customFonts[fontFamily]) {
      const fontUrl = customFonts[fontFamily];
      
      // Skip if URL is invalid
      if (!fontUrl || typeof fontUrl !== 'string') {
        console.warn(`Invalid font URL for ${fontFamily}`);
        return;
      }

      const fontFace = new FontFace(
        fontFamily,
        `url(${fontUrl})`
      );

      fontFace.load().then(() => {
        document.fonts.add(fontFace);
        setIsFontLoaded(true);
      }).catch((error) => {
        console.error('Failed to load font:', error);
        
        // If it's a blob URL error, remove the invalid font from persistence
        if (fontUrl.startsWith('blob:')) {
          console.warn(`Removing invalid blob URL for font: ${fontFamily}`);
          removeCustomFont(fontFamily);
        }
      });
    }

    return () => {
      // Cleanup if needed
    };
  }, [fontFamily]);

  return { isFontLoaded };
}