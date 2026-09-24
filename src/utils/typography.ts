import type { CSSProperties } from 'react';
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
  { id: 'md', label: 'Normal' },
  { id: 'lg', label: 'Grand (+25%)' },
  { id: 'xl', label: 'Très grand (+50%)' },
  { id: '2xl', label: 'Extra grand (+75%)' },
  { id: '3xl', label: 'Maximum (+100%)' },
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

export function getFontFamily(fontKey?: string, fallback = "'Plus Jakarta Sans', sans-serif"): string {
  switch (fontKey) {
    case 'outfit':
      return "'Outfit', sans-serif";
    case 'playfair':
      return "'Playfair Display', serif";
    case 'cormorant':
      return "'Cormorant Garamond', Georgia, serif";
    case 'cinzel':
      return "'Cinzel', serif";
    case 'script':
      return "'Dancing Script', cursive";
    case 'sans':
    default:
      return fallback;
  }
}

export function getDishTitleClass(
  name: string,
  sizePref?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl',
  dishCount: 2 | 3 = 2
): string {
  const len = (name || '').trim().length;

  if (dishCount === 2) {
    // 2-dish layout: wide columns (320px+), titles can be bold and significantly larger!
    if (sizePref === 'sm') {
      if (len <= 28) return 'text-[20px] leading-[1.20]';
      if (len <= 48) return 'text-[18px] leading-[1.18]';
      return 'text-[16px] leading-[1.16]';
    }
    if (sizePref === 'lg') {
      if (len <= 24) return 'text-[28px] leading-[1.22]';
      if (len <= 42) return 'text-[25px] leading-[1.20]';
      if (len <= 62) return 'text-[22px] leading-[1.18]';
      return 'text-[19px] leading-[1.16]';
    }
    if (sizePref === 'xl') {
      if (len <= 24) return 'text-[32px] leading-[1.22]';
      if (len <= 42) return 'text-[28px] leading-[1.20]';
      if (len <= 62) return 'text-[25px] leading-[1.18]';
      return 'text-[22px] leading-[1.16]';
    }
    if (sizePref === '2xl') {
      if (len <= 24) return 'text-[36px] leading-[1.22]';
      if (len <= 42) return 'text-[32px] leading-[1.20]';
      if (len <= 62) return 'text-[28px] leading-[1.18]';
      return 'text-[24px] leading-[1.16]';
    }
    if (sizePref === '3xl') {
      if (len <= 24) return 'text-[40px] leading-[1.22]';
      if (len <= 42) return 'text-[35px] leading-[1.20]';
      if (len <= 62) return 'text-[30px] leading-[1.18]';
      return 'text-[26px] leading-[1.16]';
    }
    // Default 'md' for 2 dishes
    if (len <= 24) return 'text-[24px] leading-[1.22]';
    if (len <= 42) return 'text-[21px] leading-[1.20]';
    if (len <= 62) return 'text-[19px] leading-[1.18]';
    return 'text-[17px] leading-[1.16]';
  }

  // 3-dish layout: columns - boosted for legibility & visual parity with 2 dishes
  if (sizePref === 'sm') {
    if (len <= 26) return 'text-[19px] leading-[1.20]';
    if (len <= 46) return 'text-[17px] leading-[1.18]';
    return 'text-[15.5px] leading-[1.15]';
  }
  if (sizePref === 'lg') {
    if (len <= 24) return 'text-[26px] leading-[1.22]';
    if (len <= 42) return 'text-[23.5px] leading-[1.20]';
    if (len <= 62) return 'text-[21px] leading-[1.18]';
    return 'text-[19px] leading-[1.16]';
  }
  if (sizePref === 'xl') {
    if (len <= 24) return 'text-[30px] leading-[1.22]';
    if (len <= 42) return 'text-[26.5px] leading-[1.20]';
    if (len <= 62) return 'text-[23.5px] leading-[1.18]';
    return 'text-[21px] leading-[1.16]';
  }
  if (sizePref === '2xl') {
    if (len <= 24) return 'text-[34px] leading-[1.22]';
    if (len <= 42) return 'text-[30px] leading-[1.20]';
    if (len <= 62) return 'text-[26px] leading-[1.18]';
    return 'text-[23px] leading-[1.16]';
  }
  if (sizePref === '3xl') {
    if (len <= 24) return 'text-[38px] leading-[1.22]';
    if (len <= 42) return 'text-[33px] leading-[1.20]';
    if (len <= 62) return 'text-[28px] leading-[1.18]';
    return 'text-[25px] leading-[1.16]';
  }

  // Default 'md' for 3 dishes
  if (len <= 24) return 'text-[23px] leading-[1.22]';
  if (len <= 42) return 'text-[20.5px] leading-[1.20]';
  if (len <= 62) return 'text-[18.5px] leading-[1.18]';
  return 'text-[17px] leading-[1.16]';
}

/**
 * Returns inline CSS fontSize and lineHeight for fine-grained slider scaling.
 * When an array of dishes is provided, calculates a STRICTLY UNIFORM font size
 * for all dishes based on the longest title, guaranteeing that Plat 1, Plat 2, and Plat 3
 * have the exact same font size regardless of character length.
 */
export function getUniformDishTitleStyle(
  allDishes: { name?: string }[],
  sizePref?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl',
  scalePercent = 100,
  dishCount: 2 | 3 = 2
): CSSProperties {
  // Find longest dish name to size all blocks uniformly
  const maxLen = allDishes.reduce(
    (max, d) => Math.max(max, (d?.name || '').trim().length),
    0
  );

  let basePx = dishCount === 2 ? 22 : 18;

  if (dishCount === 2) {
    if (sizePref === 'sm') basePx = maxLen <= 28 ? 20 : maxLen <= 48 ? 18 : 16;
    else if (sizePref === 'lg') basePx = maxLen <= 24 ? 28 : maxLen <= 42 ? 25 : maxLen <= 62 ? 22 : 19;
    else if (sizePref === 'xl') basePx = maxLen <= 24 ? 32 : maxLen <= 42 ? 28 : maxLen <= 62 ? 25 : 22;
    else if (sizePref === '2xl') basePx = maxLen <= 24 ? 36 : maxLen <= 42 ? 32 : maxLen <= 62 ? 28 : 24;
    else if (sizePref === '3xl') basePx = maxLen <= 24 ? 40 : maxLen <= 42 ? 35 : maxLen <= 62 ? 30 : 26;
    else basePx = maxLen <= 24 ? 24 : maxLen <= 42 ? 21 : maxLen <= 62 ? 19 : 17;
  } else {
    // 3 dishes - elevated sizes to avoid being too small compared to 2 dishes
    if (sizePref === 'sm') basePx = maxLen <= 26 ? 19 : maxLen <= 46 ? 17 : 15.5;
    else if (sizePref === 'lg') basePx = maxLen <= 24 ? 26 : maxLen <= 42 ? 23.5 : maxLen <= 62 ? 21 : 19;
    else if (sizePref === 'xl') basePx = maxLen <= 24 ? 30 : maxLen <= 42 ? 26.5 : maxLen <= 62 ? 23.5 : 21;
    else if (sizePref === '2xl') basePx = maxLen <= 24 ? 34 : maxLen <= 42 ? 30 : maxLen <= 62 ? 26 : 23;
    else if (sizePref === '3xl') basePx = maxLen <= 24 ? 38 : maxLen <= 42 ? 33 : maxLen <= 62 ? 28 : 25;
    else basePx = maxLen <= 24 ? 23 : maxLen <= 42 ? 20.5 : maxLen <= 62 ? 18.5 : 17;
  }

  const finalPx = Math.round(basePx * (scalePercent / 100) * 10) / 10;
  return {
    fontSize: `${finalPx}px`,
    lineHeight: 1.18,
  };
}

/**
 * Returns inline CSS fontSize and lineHeight for fine-grained slider scaling
 */
export function getDishTitleStyle(
  name: string,
  sizePref?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl',
  scalePercent = 100,
  dishCount: 2 | 3 = 2
): CSSProperties {
  const len = (name || '').trim().length;
  let basePx = dishCount === 2 ? 22 : 18;

  if (dishCount === 2) {
    if (sizePref === 'sm') basePx = len <= 28 ? 20 : len <= 48 ? 18 : 16;
    else if (sizePref === 'lg') basePx = len <= 24 ? 28 : len <= 42 ? 25 : len <= 62 ? 22 : 19;
    else if (sizePref === 'xl') basePx = len <= 24 ? 32 : len <= 42 ? 28 : len <= 62 ? 25 : 22;
    else if (sizePref === '2xl') basePx = len <= 24 ? 36 : len <= 42 ? 32 : len <= 62 ? 28 : 24;
    else if (sizePref === '3xl') basePx = len <= 24 ? 40 : len <= 42 ? 35 : len <= 62 ? 30 : 26;
    else basePx = len <= 24 ? 24 : len <= 42 ? 21 : len <= 62 ? 19 : 17;
  } else {
    if (sizePref === 'sm') basePx = len <= 26 ? 19 : len <= 46 ? 17 : 15.5;
    else if (sizePref === 'lg') basePx = len <= 24 ? 26 : len <= 42 ? 23.5 : len <= 62 ? 21 : 19;
    else if (sizePref === 'xl') basePx = len <= 24 ? 30 : len <= 42 ? 26.5 : len <= 62 ? 23.5 : 21;
    else if (sizePref === '2xl') basePx = len <= 24 ? 34 : len <= 42 ? 30 : len <= 62 ? 26 : 23;
    else if (sizePref === '3xl') basePx = len <= 24 ? 38 : len <= 42 ? 33 : len <= 62 ? 28 : 25;
    else basePx = len <= 24 ? 23 : len <= 42 ? 20.5 : len <= 62 ? 18.5 : 17;
  }

  const finalPx = Math.round(basePx * (scalePercent / 100) * 10) / 10;
  return {
    fontSize: `${finalPx}px`,
    lineHeight: 1.18,
  };
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
