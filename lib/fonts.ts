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

// Add custom fonts storage
export const CUSTOM_FONTS: Record<string, string> = JSON.parse(
  getLocalStorageItem('customFonts') || '{}'
);

export function addCustomFont(name: string, fontUrl: string) {
  CUSTOM_FONTS[name] = fontUrl;
  if (typeof window !== 'undefined') {
    localStorage.setItem('customFonts', JSON.stringify(CUSTOM_FONTS));
  }
  return { variable: `--font-custom-${name.toLowerCase().replace(/ /g, '-')}` };
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

  const customOptions = Object.keys(CUSTOM_FONTS).map((key) => ({
    label: key,
    value: key
  }));

  return [...baseOptions, ...customOptions];
}

export type FontKey = keyof typeof FONT_MAP;

export const FONT_CLASSES = Object.values(FONT_MAP)
  .map((font) => font.variable)
  .join(' '); 