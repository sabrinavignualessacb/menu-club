import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { BackgroundItem, PhotoCategoryDef, PhotoLibraryItem, WeeklyMenuData } from '../types';

const MENU_DOC_ID = 'current_weekly_menu';
const MENU_COLLECTION = 'menus';
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
 * Subscribes to real-time changes of the shared weekly menu in Firestore.
 */
export function subscribeToCloudMenu(
  onData: (menu: WeeklyMenuData, clientTimestamp?: number) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const menuDocRef = doc(db, MENU_COLLECTION, MENU_DOC_ID);
    return onSnapshot(
      menuDocRef,
      (snapshot) => {
        // Skip local uncommitted writes to prevent race condition loops
        if (snapshot.metadata.hasPendingWrites) {
          return;
        }
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.menu) {
            onData(data.menu as WeeklyMenuData, data.clientTimestamp || 0);
          }
        }
      },
      (error) => {
        console.warn('Firestore menu subscription error:', error);
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
 */
export async function saveMenuToCloud(menu: WeeklyMenuData): Promise<void> {
  try {
    const menuDocRef = doc(db, MENU_COLLECTION, MENU_DOC_ID);
    await setDoc(
      menuDocRef,
      {
        menu,
        clientTimestamp: Date.now(),
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

