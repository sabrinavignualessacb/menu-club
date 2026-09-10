import { AllergenDef } from '../types';

export const OFFICIAL_ALLERGENS: AllergenDef[] = [
  { number: 1, name: 'Gluten (blé, seigle, orge, avoine)', shortName: 'Gluten', color: 'bg-amber-600', bgHex: '#d97706' },
  { number: 2, name: 'Crustacés (crevettes, crabes, homards)', shortName: 'Crustacés', color: 'bg-orange-600', bgHex: '#ea580c' },
  { number: 3, name: 'Œufs et produits à base d’œufs', shortName: 'Œufs', color: 'bg-yellow-600', bgHex: '#ca8a04' },
  { number: 4, name: 'Poissons et préparations', shortName: 'Poissons', color: 'bg-sky-600', bgHex: '#0284c7' },
  { number: 5, name: 'Arachides et dérivés', shortName: 'Arachides', color: 'bg-amber-800', bgHex: '#92400e' },
  { number: 6, name: 'Soja et produits dérivés', shortName: 'Soja', color: 'bg-lime-600', bgHex: '#65a30d' },
  { number: 7, name: 'Lait et produits laitiers (lactose)', shortName: 'Lait', color: 'bg-cyan-600', bgHex: '#0891b2' },
  { number: 8, name: 'Fruits à coque (amandes, noisettes, noix)', shortName: 'Fruits à coque', color: 'bg-stone-700', bgHex: '#57534e' },
  { number: 9, name: 'Céleri et produits à base de céleri', shortName: 'Céleri', color: 'bg-emerald-600', bgHex: '#059669' },
  { number: 10, name: 'Moutarde et dérivés', shortName: 'Moutarde', color: 'bg-yellow-500', bgHex: '#eab308' },
  { number: 11, name: 'Graines de sésame', shortName: 'Sésame', color: 'bg-amber-700', bgHex: '#b45309' },
  { number: 12, name: 'Sulfites (dioxyde de soufre)', shortName: 'Sulfites', color: 'bg-purple-600', bgHex: '#7c3aed' },
  { number: 13, name: 'Lupin et dérivés', shortName: 'Lupin', color: 'bg-indigo-600', bgHex: '#4f46e5' },
  { number: 14, name: 'Mollusques (moules, huîtres, calmars)', shortName: 'Mollusques', color: 'bg-blue-600', bgHex: '#2563eb' },
];

export const getAllergenColor = (num: number, customList?: AllergenDef[]): string => {
  const list = customList || OFFICIAL_ALLERGENS;
  const allergen = list.find((a) => a.number === num);
  if (allergen) return allergen.bgHex;
  // Fallback dynamic colors for higher numbers
  const colors = ['#dc2626', '#d97706', '#059669', '#0284c7', '#7c3aed', '#db2777', '#475569', '#0891b2', '#ea580c'];
  return colors[num % colors.length];
};

export const getAllergenInfo = (num: number, customList?: AllergenDef[]): AllergenDef | undefined => {
  const list = customList || OFFICIAL_ALLERGENS;
  return list.find((a) => a.number === num);
};

