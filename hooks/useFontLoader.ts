"use client";

import { useEffect, useState } from 'react';
import { CUSTOM_FONTS } from '@/lib/fonts';

export function useFontLoader(fontFamily?: string) {
  const [isFontLoaded, setIsFontLoaded] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Load all custom fonts on initial mount
    Object.entries(CUSTOM_FONTS).forEach(([name, url]) => {
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
    if (fontFamily && CUSTOM_FONTS[fontFamily]) {
      const fontFace = new FontFace(
        fontFamily,
        `url(${CUSTOM_FONTS[fontFamily]})`
      );

      fontFace.load().then(() => {
        document.fonts.add(fontFace);
        setIsFontLoaded(true);
      }).catch((error) => {
        console.error('Failed to load font:', error);
      });
    }

    return () => {
      // Cleanup if needed
    };
  }, [fontFamily]);

  return { isFontLoaded };
}