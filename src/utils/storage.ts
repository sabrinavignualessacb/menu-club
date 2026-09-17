import { AllergenDef, BackgroundItem, PhotoCategoryDef, PhotoLibraryItem, WeeklyMenuData } from '../types';
import { DEFAULT_BACKGROUNDS, DEFAULT_PHOTOS, INITIAL_WEEKLY_MENU } from '../data/defaultData';
import { OFFICIAL_ALLERGENS } from '../data/allergens';
import {
  saveMenuToCloud,
  subscribeToCloudMenu,
  subscribeToCloudPhotos,
  savePhotoToCloud,
  deletePhotoFromCloud,
  subscribeToCloudBackgrounds,
  saveBackgroundToCloud,
  deleteBackgroundFromCloud,
  subscribeToCloudCategories,
  saveCategoriesToCloud,
} from '../firebase/storageService';

export {
  saveMenuToCloud,
  subscribeToCloudMenu,
  subscribeToCloudPhotos,
  savePhotoToCloud,
  deletePhotoFromCloud,
  subscribeToCloudBackgrounds,
  saveBackgroundToCloud,
  deleteBackgroundFromCloud,
  subscribeToCloudCategories,
  saveCategoriesToCloud,
};

const MENU_STORAGE_KEY = 'chefs_club_weekly_menu_v5';
const PHOTOS_STORAGE_KEY = 'chefs_club_photo_library_v5';
const BACKGROUNDS_STORAGE_KEY = 'chefs_club_background_library_v5';
const ALLERGENS_STORAGE_KEY = 'chefs_club_allergens_library_v5';
const PHOTO_CATEGORIES_STORAGE_KEY = 'chefs_club_photo_categories_v5';

export const DEFAULT_PHOTO_CATEGORIES: PhotoCategoryDef[] = [
  { id: 'viande', label: 'Viandes' },
  { id: 'poisson', label: 'Poissons' },
  { id: 'salade', label: 'Salades' },
  { id: 'vegetarien', label: 'Végétarien' },
  { id: 'plat', label: 'Plats cuisinés' },
  { id: 'entree', label: 'Entrées' },
  { id: 'dessert', label: 'Desserts' },
  { id: 'autre', label: 'Autre' },
];

export function loadPhotoCategories(): PhotoCategoryDef[] {
  try {
    const raw = localStorage.getItem(PHOTO_CATEGORIES_STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw);
      if (Array.isArray(stored) && stored.length > 0) {
        // Ensure 'salade' is present if not already
        const hasSalade = stored.some(
          (c: any) => c && (c.id === 'salade' || (typeof c.label === 'string' && c.label.toLowerCase().includes('salade')))
        );
        if (!hasSalade) {
          stored.splice(2, 0, { id: 'salade', label: 'Salades' });
        }
        return stored.filter((c: any) => c && c.id && c.label);
      }
    }
  } catch (err) {
    console.warn('Could not load photo categories from localStorage', err);
  }
  return DEFAULT_PHOTO_CATEGORIES;
}

export function savePhotoCategories(categories: PhotoCategoryDef[]): void {
  try {
    if (!Array.isArray(categories)) return;
    localStorage.setItem(PHOTO_CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (err) {
    console.warn('Could not save photo categories to localStorage', err);
  }
}

export function loadMenuData(): WeeklyMenuData {
  try {
    const raw = localStorage.getItem(MENU_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.days && parsed.cover) {
        if (parsed.backgroundOpacity === undefined) {
          parsed.backgroundOpacity = 70;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not load menu data from localStorage', err);
  }
  return INITIAL_WEEKLY_MENU;
}

export function saveMenuData(data: WeeklyMenuData): void {
  try {
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Could not save menu data to localStorage, attempting recovery', err);
    try {
      const legacyKeys = [
        'chefs_club_weekly_menu_v4',
        'chefs_club_weekly_menu_v3',
        'chefs_club_weekly_menu_v2',
        'chefs_club_weekly_menu_v1',
      ];
      legacyKeys.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(data));
    } catch (e2) {
      console.error('Final attempt to save menu data failed', e2);
    }
  }
}

export function deduplicatePhotoList(photos: PhotoLibraryItem[]): PhotoLibraryItem[] {
  if (!photos || !Array.isArray(photos)) return [];
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const seenCustomNames = new Set<string>();
  const result: PhotoLibraryItem[] = [];

  for (const photo of photos) {
    if (!photo || !photo.url) continue;

    // 1. Never duplicate exact same ID
    if (photo.id && seenIds.has(photo.id)) continue;

    // 2. Never duplicate exact same image URL
    if (seenUrls.has(photo.url)) continue;

    // 3. For custom photos, never duplicate exact same dish name (trimmed, lowercased)
    if (photo.isCustom && photo.name) {
      const normName = photo.name.trim().toLowerCase();
      if (normName && seenCustomNames.has(normName)) {
        continue;
      }
      if (normName) {
        seenCustomNames.add(normName);
      }
    }

    if (photo.id) {
      seenIds.add(photo.id);
    }
    seenUrls.add(photo.url);
    result.push(photo);
  }

  return result;
}

export function loadPhotos(): PhotoLibraryItem[] {
  try {
    const raw = localStorage.getItem(PHOTOS_STORAGE_KEY);
    if (raw) {
      const storedPhotos = JSON.parse(raw);
      if (Array.isArray(storedPhotos)) {
        // Filter out any default sample photos to respect user intent:
        // "j'ai vidé toutes les photos mises par défaut, et elles reviennent quand je les supprime, je ne veux conserver que celle que j'insère dans la bibliotheque"
        const userPhotos = storedPhotos.filter((p: PhotoLibraryItem) => {
          if (!p || !p.id || !p.url) return false;
          const isDefault = DEFAULT_PHOTOS.some((dp) => dp.id === p.id || dp.url === p.url);
          return !isDefault || p.isCustom;
        });
        return deduplicatePhotoList(userPhotos);
      }
    }
  } catch (err) {
    console.warn('Could not load photos from localStorage', err);
  }
  // Return empty list so only user inserted photos are displayed
  return [];
}

export function savePhotos(photos: PhotoLibraryItem[]): void {
  try {
    const deduped = deduplicatePhotoList(photos);
    // Strip redundant or bloated originalUrls from storage to protect localStorage quota
    const lightweightPhotos = deduped.map((p) => {
      if (p.originalUrl && (p.originalUrl === p.url || p.originalUrl.length > 150000)) {
        const { originalUrl, ...rest } = p;
        return rest;
      }
      return p;
    });
    localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(lightweightPhotos));
  } catch (err) {
    console.warn('Could not save photos to localStorage, applying quota safeguard', err);
    try {
      const minimalPhotos = deduplicatePhotoList(photos).map(({ originalUrl, ...rest }) => rest);
      localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(minimalPhotos));
    } catch (e2) {
      console.error('Fallback saving photos failed', e2);
    }
  }
}

export function loadAllergens(): AllergenDef[] {
  try {
    const raw = localStorage.getItem(ALLERGENS_STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw);
      if (Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
    }
  } catch (err) {
    console.warn('Could not load allergens from localStorage', err);
  }
  return OFFICIAL_ALLERGENS;
}

export function saveAllergens(allergens: AllergenDef[]): void {
  try {
    localStorage.setItem(ALLERGENS_STORAGE_KEY, JSON.stringify(allergens));
  } catch (err) {
    console.warn('Could not save allergens to localStorage', err);
  }
}

export function loadBackgrounds(): BackgroundItem[] {

  try {
    const raw = localStorage.getItem(BACKGROUNDS_STORAGE_KEY);
    if (raw) {
      const customBgs = JSON.parse(raw);
      if (Array.isArray(customBgs) && customBgs.length > 0) {
        const existingIds = new Set(customBgs.map((b) => b.id));
        const nonDuplicateDefaults = DEFAULT_BACKGROUNDS.filter((b) => !existingIds.has(b.id));
        return [...customBgs, ...nonDuplicateDefaults];
      }
    }
  } catch (err) {
    console.warn('Could not load backgrounds from localStorage', err);
  }
  return DEFAULT_BACKGROUNDS;
}

export function saveBackgrounds(backgrounds: BackgroundItem[]): void {
  try {
    localStorage.setItem(BACKGROUNDS_STORAGE_KEY, JSON.stringify(backgrounds));
  } catch (err) {
    console.warn('Could not save backgrounds to localStorage', err);
  }
}

/**
 * Resizes an image file to a max dimension and returns a compressed data URL.
 * Keeps localStorage lightweight and avoids quota crashes.
 */
export function compressImageFile(file: File, maxDimension = 800, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('Image failed to load'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsDataURL(file);
  });
}
