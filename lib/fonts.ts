import { 
  Inter, 
  Roboto, 
  Open_Sans, 
  Montserrat, 
  Lato, 
  Poppins, 
  Merriweather, 
  Playfair_Display, 
  Raleway, 
  Nunito, 
  Source_Sans_3 
} from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-roboto' });
const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });
const lato = Lato({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-lato' });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-poppins' });
const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-merriweather' });
const playfairDisplay = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair-display' });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' });
const sourceSans3 = Source_Sans_3({ subsets: ['latin'], variable: '--font-source-sans-pro' });

export const FONT_MAP = {
  Arial: { variable: '--font-arial' },
  'Times New Roman': { variable: '--font-times-new-roman' },
  'Courier New': { variable: '--font-courier-new' },
  Inter: inter,
  Roboto: roboto,
  'Open Sans': openSans,
  Montserrat: montserrat,
  Lato: lato,
  Poppins: poppins,
  Merriweather: merriweather,
  'Playfair Display': playfairDisplay,
  Raleway: raleway,
  Nunito: nunito,
  'Source Sans 3': sourceSans3
};

// Helper function to safely access localStorage
const getLocalStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

// Helper function to safely set localStorage
const setLocalStorageItem = (key: string, value: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

// Function to get custom fonts from localStorage
export function getCustomFonts(): Record<string, string> {
  try {
    const customFontsData = getLocalStorageItem('customFonts');
    if (!customFontsData) return {};
    
    const customFonts = JSON.parse(customFontsData);
    
    // Validate blob URLs and remove invalid ones
    const validFonts: Record<string, string> = {};
    const invalidFonts: string[] = [];
    
    Object.entries(customFonts).forEach(([name, url]) => {
      if (typeof url === 'string' && url.startsWith('blob:')) {
        // For blob URLs, we'll keep them but they might be invalid
        // The font loader will handle the error gracefully
        validFonts[name] = url;
      } else if (typeof url === 'string') {
        // Non-blob URLs are considered valid
        validFonts[name] = url;
      }
    });
    
    // If we found invalid fonts, update localStorage
    if (invalidFonts.length > 0) {
      const updatedFonts = { ...validFonts };
      setLocalStorageItem('customFonts', JSON.stringify(updatedFonts));
    }
    
    return validFonts;
  } catch (error) {
    console.error('Error parsing custom fonts from localStorage:', error);
    return {};
  }
}

// Function to clean up invalid blob URLs from localStorage
export function cleanupInvalidFonts(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const customFontsData = localStorage.getItem('customFonts');
    if (!customFontsData) return;
    
    const customFonts = JSON.parse(customFontsData);
    const validFonts: Record<string, string> = {};
    let hasChanges = false;
    
    Object.entries(customFonts).forEach(([name, url]) => {
      if (typeof url === 'string' && !url.startsWith('blob:')) {
        // Keep non-blob URLs (like base64 data URLs)
        validFonts[name] = url;
      } else if (typeof url === 'string' && url.startsWith('blob:')) {
        // Remove blob URLs as they're likely invalid
        hasChanges = true;
        console.warn(`Removing invalid blob URL for font: ${name}`);
      }
    });
    
    if (hasChanges) {
      localStorage.setItem('customFonts', JSON.stringify(validFonts));
      console.log('Cleaned up invalid font URLs from localStorage');
    }
  } catch (error) {
    console.error('Error cleaning up invalid fonts:', error);
  }
}

// Clean up invalid fonts on module load
if (typeof window !== 'undefined') {
  cleanupInvalidFonts();
}

// Legacy CUSTOM_FONTS export for backward compatibility
// This will be deprecated in favor of getCustomFonts()
export const CUSTOM_FONTS: Record<string, string> = getCustomFonts();

export function addCustomFont(name: string, fontUrl: string) {
  const customFonts = getCustomFonts();
  customFonts[name] = fontUrl;
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('customFonts', JSON.stringify(customFonts));
  }
  
  return { variable: `--font-custom-${name.toLowerCase().replace(/ /g, '-')}` };
}

export function removeCustomFont(name: string) {
  const customFonts = getCustomFonts();
  delete customFonts[name];
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('customFonts', JSON.stringify(customFonts));
  }
}

export function getFontOptions() {
  const baseOptions = [
    { label: 'Arial', value: 'Arial' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Courier New', value: 'Courier New' },
    ...Object.keys(FONT_MAP).filter(key => !['Arial', 'Times New Roman', 'Courier New'].includes(key))
      .map((key) => ({
        label: key,
        value: key
      }))
  ];

  const customFonts = getCustomFonts();
  const customOptions = Object.keys(customFonts).map((key) => ({
    label: key,
    value: key
  }));

  return [...baseOptions, ...customOptions];
}

export type FontKey = keyof typeof FONT_MAP;

export const FONT_CLASSES = Object.values(FONT_MAP)
  .map((font) => font.variable)
  .join(' '); 