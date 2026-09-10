import { TypographySettings } from '../types';

export const FONT_OPTIONS = [
  { id: 'sans', label: 'Moderne (Plus Jakarta Sans)', className: 'font-sans-clean' },
  { id: 'outfit', label: 'Géométrique (Outfit)', className: 'font-sans' },
  { id: 'playfair', label: 'Élégant (Playfair Display)', className: 'font-serif-title' },
  { id: 'cormorant', label: 'Gastronomique (Cormorant)', className: 'font-cormorant' },
  { id: 'cinzel', label: 'Héraldique (Cinzel)', className: 'font-cinzel' },
  { id: 'script', label: 'Manuscrit (Script)', className: 'font-script' },
] as const;

export const DISH_TITLE_SIZE_OPTIONS = [
  { id: 'sm', label: 'Compact' },
  { id: 'md', label: 'Normal (Automatique)' },
  { id: 'lg', label: 'Grand' },
  { id: 'xl', label: 'Très grand' },
] as const;

export const DISH_LABEL_SIZE_OPTIONS = [
  { id: 'sm', label: 'Discret (18px)' },
  { id: 'md', label: 'Normal (25px)' },
  { id: 'lg', label: 'Grand (30px)' },
  { id: 'xl', label: 'Marqué (36px)' },
] as const;

export const ALLERGEN_SIZE_OPTIONS = [
  { id: 'sm', label: 'Compact' },
  { id: 'md', label: 'Normal' },
  { id: 'lg', label: 'Grand' },
] as const;

export const COVER_DATE_SIZE_OPTIONS = [
  { id: 'md', label: 'Normal' },
  { id: 'lg', label: 'Grand' },
  { id: 'xl', label: 'Très grand' },
  { id: '2xl', label: 'Géant' },
] as const;

export function getFontFamilyClass(fontKey?: string, fallback = 'font-sans-clean'): string {
  switch (fontKey) {
    case 'outfit':
      return 'font-sans';
    case 'playfair':
      return 'font-serif-title';
    case 'cormorant':
      return 'font-cormorant';
    case 'cinzel':
      return 'font-cinzel';
    case 'script':
      return 'font-script';
    case 'sans':
    default:
      return fallback;
  }
}

export function getDishTitleClass(name: string, sizePref?: 'sm' | 'md' | 'lg' | 'xl'): string {
  const len = (name || '').trim().length;

  if (sizePref === 'sm') {
    if (len <= 30) return 'text-[17px] leading-[1.20]';
    if (len <= 50) return 'text-[15px] leading-[1.18]';
    return 'text-[13px] leading-[1.15]';
  }

  if (sizePref === 'lg') {
    if (len <= 26) return 'text-[23px] leading-[1.24]';
    if (len <= 44) return 'text-[20px] leading-[1.22]';
    if (len <= 64) return 'text-[18px] leading-[1.20]';
    return 'text-[16px] leading-[1.18]';
  }

  if (sizePref === 'xl') {
    if (len <= 26) return 'text-[26px] leading-[1.26]';
    if (len <= 44) return 'text-[22px] leading-[1.22]';
    if (len <= 64) return 'text-[19px] leading-[1.20]';
    return 'text-[17px] leading-[1.18]';
  }

  // Default 'md'
  if (len <= 26) return 'text-[20px] leading-[1.22]';
  if (len <= 44) return 'text-[18px] leading-[1.20]';
  if (len <= 64) return 'text-[16px] leading-[1.18]';
  return 'text-[14.5px] leading-[1.15]';
}

export function getDishLabelSizeClass(sizePref?: 'sm' | 'md' | 'lg' | 'xl'): string {
  switch (sizePref) {
    case 'sm':
      return 'text-[18px]';
    case 'lg':
      return 'text-[30px]';
    case 'xl':
      return 'text-[36px]';
    case 'md':
    default:
      return 'text-[25px]';
  }
}
