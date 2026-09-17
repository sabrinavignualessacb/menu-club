import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { BackgroundItem, PhotoCategoryDef, PhotoLibraryItem, WeeklyMenuData } from '../types';

const MENU_DOC_ID = 'current_weekly_menu';
const MENU_COLLECTION = 'menus';
const MENU_DAYS_COLLECTION = 'menu_days';
const PHOTOS_COLLECTION = 'custom_photos';
const BACKGROUNDS_COLLECTION = 'custom_backgrounds';
const CATEGORIES_DOC_ID = 'photo_categories';

function cleanPhotoForCloud(photo: PhotoLibraryItem): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(photo)) {
    if (val !== undefined) {
      // If originalUrl is unreasonably huge, don't store it in Firestore to save space
      if (key === 'originalUrl' && typeof val === 'string' && val.length > 250000) {
        continue;
      }
      clean[key] = val;
    }
  }
  return clean;
}

/**
 * Subscribes to real-time changes of the weekly menu in Firestore.
 * Listens to the `menu_days` multi-document collection (where each day has its own document,
 * completely immune to the 1MB document limit). Falls back to the single-doc `menus` collection if needed.
 */
export function subscribeToCloudMenu(
  onData: (menu: WeeklyMenuData, clientTimestamp?: number) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const menuDaysColRef = collection(db, MENU_DAYS_COLLECTION);
    return onSnapshot(
      menuDaysColRef,
      (snapshot) => {
        // Skip local uncommitted writes to prevent race condition loops
        if (snapshot.metadata.hasPendingWrites) {
          return;
        }
        if (!snapshot.empty) {
          const days: Record<string, any> = {};
          let meta: any = {};
          let maxTs = 0;
          let countDays = 0;

          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const ts =
              typeof data.clientTimestamp === 'number' && data.clientTimestamp > 0
                ? data.clientTimestamp
                : data.updatedAt?.toMillis
                ? data.updatedAt.toMillis()
                : 0;
            if (ts > maxTs) maxTs = ts;

            if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(docSnap.id)) {
              if (data.day) {
                days[docSnap.id] = data.day;
                countDays++;
              }
            } else if (docSnap.id === 'metadata') {
              meta = data;
            }
          });

          // If we have day documents, construct full WeeklyMenuData
          if (countDays > 0) {
            const assembledMenu: WeeklyMenuData = {
              id: meta.id || 'weekly-menu-current',
              weekLabel: meta.weekLabel || 'Menu du Chef',
              templateId: meta.templateId || 'classic-navy',
              backgroundOpacity: meta.backgroundOpacity ?? 70,
              typography: meta.typography,
              cover: meta.cover || {
                id: 'cover',
                brandName: "LE CHEF'S CLUB",
                title: 'Menu de la Semaine',
                subtitlePrefix: 'Du',
                startDate: 'Lundi',
                subtitleMiddle: 'au',
                endDate: 'Vendredi',
                year: '2026',
                tagline: 'Cuisine Maison & Produits Frais',
                backgroundId: 'bg-slate-dark',
                featuredPhotos: [],
              },
              days: days as any,
            };
            onData(assembledMenu, maxTs);
            return;
          }
        }

        // Fallback to legacy single document if menu_days collection is not yet populated
        const menuDocRef = doc(db, MENU_COLLECTION, MENU_DOC_ID);
        getDoc(menuDocRef)
          .then((singleSnap) => {
            if (singleSnap.exists()) {
              const d = singleSnap.data();
              if (d && d.menu) {
                const ts =
                  typeof d.clientTimestamp === 'number' && d.clientTimestamp > 0
                    ? d.clientTimestamp
                    : d.updatedAt?.toMillis
                    ? d.updatedAt.toMillis()
                    : 0;
                onData(d.menu as WeeklyMenuData, ts);
              }
            }
          })
          .catch((e) => console.warn('Fallback single doc fetch failed', e));
      },
      (error) => {
        console.warn('Firestore menu_days subscription error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('Failed to setup Firestore menu listener:', err);
    return () => {};
  }
}

/**
 * Persists the weekly menu to Firestore so it is accessible across all devices.
 * Dual-writes to both the main document and individual day documents for unbreakable persistence.
 */
export async function saveMenuToCloud(menu: WeeklyMenuData): Promise<void> {
  const now = Date.now();
  try {
    // 1. Dual-write individual day sub-documents (each day doc is only ~40-70KB, 15x below Firestore limit)
    if (menu.days) {
      const dayWrites = Object.entries(menu.days).map(([dayKey, dayData]) => {
        const dayRef = doc(db, MENU_DAYS_COLLECTION, dayKey);
        return setDoc(
          dayRef,
          {
            day: dayData,
            clientTimestamp: now,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });
      const metaRef = doc(db, MENU_DAYS_COLLECTION, 'metadata');
      dayWrites.push(
        setDoc(
          metaRef,
          {
            cover: menu.cover,
            weekLabel: menu.weekLabel,
            templateId: menu.templateId,
            backgroundOpacity: menu.backgroundOpacity,
            typography: menu.typography,
            clientTimestamp: now,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      );
      // Run day backups in parallel
      await Promise.allSettled(dayWrites);
    }

    // 2. Primary document write
    const menuDocRef = doc(db, MENU_COLLECTION, MENU_DOC_ID);
    await setDoc(
      menuDocRef,
      {
        menu,
        clientTimestamp: now,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving menu to Firestore:', err);
    throw err;
  }
}

/**
 * Subscribes to real-time custom photos in Firestore.
 */
export function subscribeToCloudPhotos(
  onData: (photos: PhotoLibraryItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const photosColRef = collection(db, PHOTOS_COLLECTION);
    return onSnapshot(
      photosColRef,
      (snapshot) => {
        const photos: PhotoLibraryItem[] = [];
        snapshot.forEach((docSnap) => {
          photos.push(docSnap.data() as PhotoLibraryItem);
        });
        onData(photos);
      },
      (error) => {
        console.warn('Firestore photos subscription error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('Failed to setup Firestore photos listener:', err);
    return () => {};
  }
}

/**
 * Saves a custom photo item to Firestore.
 */
export async function savePhotoToCloud(photo: PhotoLibraryItem): Promise<void> {
  try {
    const photoDocRef = doc(db, PHOTOS_COLLECTION, photo.id);
    const cleaned = cleanPhotoForCloud(photo);
    await setDoc(
      photoDocRef,
      {
        ...cleaned,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving photo to Firestore:', err);
    throw err;
  }
}

/**
 * Deletes a custom photo item from Firestore.
 */
export async function deletePhotoFromCloud(photoId: string): Promise<void> {
  try {
    const photoDocRef = doc(db, PHOTOS_COLLECTION, photoId);
    await deleteDoc(photoDocRef);
  } catch (err) {
    console.error('Error deleting photo from Firestore:', err);
  }
}

/**
 * Subscribes to real-time custom backgrounds in Firestore.
 */
export function subscribeToCloudBackgrounds(
  onData: (backgrounds: BackgroundItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const bgColRef = collection(db, BACKGROUNDS_COLLECTION);
    return onSnapshot(
      bgColRef,
      (snapshot) => {
        const bgs: BackgroundItem[] = [];
        snapshot.forEach((docSnap) => {
          bgs.push(docSnap.data() as BackgroundItem);
        });
        onData(bgs);
      },
      (error) => {
        console.warn('Firestore backgrounds subscription error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('Failed to setup Firestore backgrounds listener:', err);
    return () => {};
  }
}

/**
 * Saves a custom background to Firestore.
 */
export async function saveBackgroundToCloud(bg: BackgroundItem): Promise<void> {
  try {
    const bgDocRef = doc(db, BACKGROUNDS_COLLECTION, bg.id);
    await setDoc(
      bgDocRef,
      {
        ...bg,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving background to Firestore:', err);
  }
}

/**
 * Deletes a custom background from Firestore.
 */
export async function deleteBackgroundFromCloud(bgId: string): Promise<void> {
  try {
    const bgDocRef = doc(db, BACKGROUNDS_COLLECTION, bgId);
    await deleteDoc(bgDocRef);
  } catch (err) {
    console.error('Error deleting background from Firestore:', err);
  }
}

/**
 * Subscribes to photo categories stored in Firestore.
 */
export function subscribeToCloudCategories(
  onData: (categories: PhotoCategoryDef[]) => void
): () => void {
  try {
    const catDocRef = doc(db, MENU_COLLECTION, CATEGORIES_DOC_ID);
    return onSnapshot(
      catDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && Array.isArray(data.categories)) {
            onData(data.categories as PhotoCategoryDef[]);
          }
        }
      },
      (err) => {
        console.warn('Firestore categories subscription error:', err);
      }
    );
  } catch (err) {
    console.warn('Failed to setup Firestore categories listener:', err);
    return () => {};
  }
}

/**
 * Saves photo categories to Firestore.
 */
export async function saveCategoriesToCloud(categories: PhotoCategoryDef[]): Promise<void> {
  try {
    const catDocRef = doc(db, MENU_COLLECTION, CATEGORIES_DOC_ID);
    await setDoc(
      catDocRef,
      {
        categories,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving categories to Firestore:', err);
  }
}

