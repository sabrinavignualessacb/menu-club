export type DayId = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export type MenuTemplateId = 'classic-navy' | 'chef-royal-blue' | 'bistro-slate' | 'emerald-luxury' | 'terracotta-sun' | 'modern-noir';

export interface DishBadge {
  id: string;
  label: string;
  fullName?: string;
  type?: 'flag-fr' | 'leaf' | 'sprout' | 'chef-hat' | 'fish' | 'award' | 'map-pin' | 'shield' | 'custom';
  bgClass?: string;
  isCustom?: boolean;
}

export interface Dish {
  id: string;
  name: string;
  label?: string; // Custom label, e.g., "Plat 1", "Plat 2", "Entrée", "Dessert", "Salade"
  titleColor?: string; // Custom title color override (e.g., #001489)
  labelColor?: string; // Custom label color override
  allergens: number[]; // Numbers 1 to 14 or custom numbers
  customAllergenText?: string;
  showFrenchMeat: boolean;
  badges?: string[]; // Array of badge IDs or custom badge labels
  imageUrl: string;
}

export interface TypographySettings {
  dishTitleFont?: 'sans' | 'outfit' | 'playfair' | 'cormorant' | 'cinzel' | 'script';
  dishTitleSize?: 'sm' | 'md' | 'lg' | 'xl';
  dishLabelFont?: 'sans' | 'outfit' | 'playfair' | 'cormorant' | 'cinzel' | 'script';
  dishLabelSize?: 'sm' | 'md' | 'lg' | 'xl';
  allergenFont?: 'sans' | 'outfit' | 'playfair' | 'cormorant' | 'cinzel' | 'script';
  allergenSize?: 'sm' | 'md' | 'lg';
  coverDateSize?: 'md' | 'lg' | 'xl' | '2xl';
  // Plate Circle Border Thickness & Styling
  plateBorderWidth?: number; // 0, 1, 1.5, 2, 3, 4 (default 1.5px)
  plateBorderColor?: string; // default #ffffff
  // Colors for Dish 1, Dish 2, and Others (Salade, Dish 3...)
  dish1Color?: string;
  dish2Color?: string;
  dishOtherColor?: string;
  dishLabelColor?: string;
  dish1LabelColor?: string;
  dish2LabelColor?: string;
  dishOtherLabelColor?: string;
}

export interface CoverPageData {
  id: 'cover';
  brandName: string;
  title: string;
  subtitlePrefix: string;
  startDate: string;
  subtitleMiddle: string;
  endDate: string;
  year: string;
  tagline: string;
  dateSize?: 'md' | 'lg' | 'xl' | '2xl';
  backgroundId: string;
  customBackgroundUrl?: string;
  backgroundOpacity?: number; // 5 to 100
  featuredPhotos: string[];
}

export interface DayMenu {
  id: DayId;
  dayName: string;
  dateFormatted: string;
  dishCount: 2 | 3;
  backgroundId: string;
  customBackgroundUrl?: string;
  backgroundOpacity?: number; // 5 to 100
  dishes: Dish[];
  isHoliday?: boolean;
  holidayText?: string;
  holidaySubtext?: string;
}

export interface WeeklyMenuData {
  id: string;
  weekLabel: string;
  templateId?: MenuTemplateId;
  backgroundOpacity?: number; // Default background opacity for the week (5 to 100)
  typography?: TypographySettings;
  cover: CoverPageData;
  days: {
    monday: DayMenu;
    tuesday: DayMenu;
    wednesday: DayMenu;
    thursday: DayMenu;
    friday: DayMenu;
  };
}

export interface BackgroundItem {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  isCustom?: boolean;
}

export type PhotoCategory = 'viande' | 'poisson' | 'vegetarien' | 'salade' | 'plat' | 'dessert' | 'entree' | 'autre' | string;

export interface PhotoCategoryDef {
  id: string;
  label: string;
  isCustom?: boolean;
}

export interface PhotoLibraryItem {
  id: string;
  name: string;
  category: PhotoCategory;
  url: string;
  originalUrl?: string;
  isCustom?: boolean;
  createdAt: number;
}

export interface AllergenDef {
  number: number;
  name: string;
  shortName: string;
  color?: string;
  textColor?: string;
  bgHex: string;
  isCustom?: boolean;
}

export interface MenuTemplateConfig {
  id: MenuTemplateId;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  cardBgGradient: string;
  borderColor: string;
  titleColor: string;
  crestBg: string;
  crestIconColor: string;
  swatchGradient: string;
}

