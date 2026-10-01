/**
 * IndexedDB persistent storage utility for Chef's Club.
 * Provides virtually unlimited local storage for high-resolution dish photos
 * and full menu data, preventing localStorage 5MB QuotaExceededError.
 */

import { PhotoLibraryItem, WeeklyMenuData } from '../types';

const DB_NAME = 'chefs_club_db';
const DB_VERSION = 1;
const STORE_PHOTOS = 'photos';
const STORE_MENU = 'menus';
const STORE_BACKUP = 'backups';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        db.createObjectStore(STORE_PHOTOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_MENU)) {
        db.createObjectStore(STORE_MENU, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_BACKUP)) {
        db.createObjectStore(STORE_BACKUP, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves all photos to IndexedDB (completely immune to 5MB quota).
 */
export async function savePhotosToIndexedDb(photos: PhotoLibraryItem[]): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_PHOTOS, 'readwrite');
    const store = tx.objectStore(STORE_PHOTOS);

    // Clear and re-populate
    await new Promise<void>((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => resolve();
      clearReq.onerror = () => reject(clearReq.error);
    });

    for (const photo of photos) {
      if (photo && photo.id && photo.url) {
        store.put(photo);
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not save photos to IndexedDB:', err);
  }
}

/**
 * Loads all photos stored in IndexedDB.
 */
export async function loadPhotosFromIndexedDb(): Promise<PhotoLibraryItem[]> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_PHOTOS, 'readonly');
    const store = tx.objectStore(STORE_PHOTOS);

    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result;
        if (Array.isArray(results) && results.length > 0) {
          resolve(results as PhotoLibraryItem[]);
        } else {
          resolve([]);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not load photos from IndexedDB:', err);
    return [];
  }
}

/**
 * Saves a single photo to IndexedDB.
 */
export async function saveSinglePhotoToIndexedDb(photo: PhotoLibraryItem): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_PHOTOS, 'readwrite');
    const store = tx.objectStore(STORE_PHOTOS);
    store.put(photo);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not save single photo to IndexedDB:', err);
  }
}

/**
 * Deletes a single photo from IndexedDB.
 */
export async function deletePhotoFromIndexedDb(photoId: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_PHOTOS, 'readwrite');
    const store = tx.objectStore(STORE_PHOTOS);
    store.delete(photoId);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not delete photo from IndexedDB:', err);
  }
}

/**
 * Saves weekly menu data to IndexedDB.
 */
export async function saveMenuToIndexedDb(menu: WeeklyMenuData): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_MENU, 'readwrite');
    const store = tx.objectStore(STORE_MENU);
    store.put({ id: 'current_menu', data: menu, updatedAt: Date.now() });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not save menu to IndexedDB:', err);
  }
}

/**
 * Loads weekly menu data from IndexedDB.
 */
export async function loadMenuFromIndexedDb(): Promise<WeeklyMenuData | null> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_MENU, 'readonly');
    const store = tx.objectStore(STORE_MENU);
    return new Promise((resolve) => {
      const req = store.get('current_menu');
      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(req.result.data as WeeklyMenuData);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Could not load menu from IndexedDB:', err);
    return null;
  }
}

/**
 * Saves menu backup (for undoing reset) to IndexedDB.
 */
export async function saveMenuBackupToIndexedDb(menu: WeeklyMenuData): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_BACKUP, 'readwrite');
    const store = tx.objectStore(STORE_BACKUP);
    store.put({ id: 'previous_menu_backup', data: menu, backedUpAt: Date.now() });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not save menu backup to IndexedDB:', err);
  }
}

/**
 * Loads menu backup from IndexedDB.
 */
export async function loadMenuBackupFromIndexedDb(): Promise<WeeklyMenuData | null> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_BACKUP, 'readonly');
    const store = tx.objectStore(STORE_BACKUP);
    return new Promise((resolve) => {
      const req = store.get('previous_menu_backup');
      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(req.result.data as WeeklyMenuData);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}
