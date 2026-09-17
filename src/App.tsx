import React, { useState, useEffect, useRef } from 'react';
import {
  AllergenDef,
  BackgroundItem,
  DayId,
  PhotoLibraryItem,
  WeeklyMenuData,
} from './types';
import {
  loadAllergens,
  loadBackgrounds,
  loadMenuData,
  loadPhotos,
  saveAllergens,
  saveBackgrounds,
  saveMenuData,
  savePhotos,
  deduplicatePhotoList,
  saveMenuToCloud,
  subscribeToCloudMenu,
  subscribeToCloudPhotos,
  savePhotoToCloud,
  deletePhotoFromCloud,
  subscribeToCloudBackgrounds,
  saveBackgroundToCloud,
} from './utils/storage';
import { INITIAL_WEEKLY_MENU, DEFAULT_BACKGROUNDS, DEFAULT_PHOTOS } from './data/defaultData';
import { DayVisualCard } from './components/DayVisualCard';
import { CoverVisualCard } from './components/CoverVisualCard';
import { MenuEditor } from './components/MenuEditor';
import { ExportToolbar } from './components/ExportToolbar';
import { PhotoLibraryModal } from './components/PhotoLibraryModal';
import { BackgroundLibraryModal } from './components/BackgroundLibraryModal';
import { AllergenPickerModal } from './components/AllergenPickerModal';
import { TypographyModal } from './components/TypographyModal';
import { WeekGridView } from './components/WeekGridView';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  exportElementAsPng,
  exportElementAsPdf,
  exportAllVisualsAsZip,
  exportAllVisualsAsPdf,
  ExportProgress,
} from './utils/exportImage';
import {
  UtensilsCrossed,
  Sparkles,
  LayoutGrid,
  Edit,
  Image as ImageIcon,
  RotateCcw,
  Eye,
  ChefHat,
  Check,
  Type,
  Cloud,
  CloudCheck,
  CloudUpload,
  Loader2,
} from 'lucide-react';

export default function App() {
  // Main State
  const [menuData, setMenuData] = useState<WeeklyMenuData>(loadMenuData);
  const [photos, setPhotos] = useState<PhotoLibraryItem[]>(loadPhotos);
  const [backgrounds, setBackgrounds] = useState<BackgroundItem[]>(loadBackgrounds);
  const [allergensList, setAllergensList] = useState<AllergenDef[]>(loadAllergens);
  const [activeTab, setActiveTab] = useState<'cover' | DayId>('monday');
  const [viewMode, setViewMode] = useState<'editor' | 'grid'>('editor');

  // Modals state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [isAllergenModalOpen, setIsAllergenModalOpen] = useState(false);
  const [isTypographyModalOpen, setIsTypographyModalOpen] = useState(false);
  const [typographyModalTab, setTypographyModalTab] = useState<
    'all' | 'dishTitle' | 'dishLabel' | 'labelPosition' | 'dishColors' | 'plateCircle' | 'allergen' | 'backgroundOpacity'
  >('all');

  const handleOpenTypographyModal = (
    tab: 'all' | 'dishTitle' | 'dishLabel' | 'labelPosition' | 'dishColors' | 'plateCircle' | 'allergen' | 'backgroundOpacity' = 'all'
  ) => {
    setTypographyModalTab(tab);
    setIsTypographyModalOpen(true);
  };

  // Targets for modals
  const [activeDishIndex, setActiveDishIndex] = useState<number | undefined>(undefined);
  const [activeCoverPhotoIndex, setActiveCoverPhotoIndex] = useState<number | undefined>(undefined);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refs for export DOM nodes
  const livePreviewRef = useRef<HTMLDivElement>(null);
  const exportTargetCoverRef = useRef<HTMLDivElement>(null);
  const exportTargetMondayRef = useRef<HTMLDivElement>(null);
  const exportTargetTuesdayRef = useRef<HTMLDivElement>(null);
  const exportTargetWednesdayRef = useRef<HTMLDivElement>(null);
  const exportTargetThursdayRef = useRef<HTMLDivElement>(null);
  const exportTargetFridayRef = useRef<HTMLDivElement>(null);

  // Cloud Sync state
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<Date | null>(null);

  // References to break circular synchronization loops
  const menuDataRef = useRef<WeeklyMenuData>(menuData);
  menuDataRef.current = menuData;
  const isIncomingCloudUpdate = useRef(false);
  const lastSavedMenuJson = useRef<string>(JSON.stringify(menuData));

  // 1. Subscribe to Cloud Menu changes from Firestore in real-time
  useEffect(() => {
    const unsubscribe = subscribeToCloudMenu(
      (cloudMenu) => {
        if (cloudMenu && cloudMenu.days && cloudMenu.cover) {
          const incomingJson = JSON.stringify(cloudMenu);
          const currentLocalJson = JSON.stringify(menuDataRef.current);

          // Only apply update if it differs from current state
          if (incomingJson !== currentLocalJson) {
            isIncomingCloudUpdate.current = true;
            lastSavedMenuJson.current = incomingJson;
            setMenuData(cloudMenu);
            saveMenuData(cloudMenu);
          }
          setCloudSyncStatus('synced');
          setLastCloudSyncTime(new Date());
        }
      },
      (err) => {
        console.warn('Firebase Cloud sync listener issue:', err);
        setCloudSyncStatus('offline');
      }
    );
    return () => unsubscribe();
  }, []);

  // 1b. Subscribe to Cloud Photos from Firestore in real-time
  useEffect(() => {
    const unsubscribe = subscribeToCloudPhotos(
      (cloudPhotos) => {
        if (cloudPhotos && Array.isArray(cloudPhotos)) {
          setPhotos(() => {
            const customCloud = cloudPhotos.map((p) => ({ ...p, isCustom: true }));
            const combined = deduplicatePhotoList([...customCloud, ...DEFAULT_PHOTOS]);
            combined.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            savePhotos(combined);
            return combined;
          });
        }
      },
      (err) => {
        console.warn('Firebase Cloud photos sync listener issue:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  // 1d. Subscribe to Cloud Backgrounds from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToCloudBackgrounds((cloudBackgrounds) => {
      if (cloudBackgrounds && Array.isArray(cloudBackgrounds) && cloudBackgrounds.length > 0) {
        setBackgrounds((prevLocal) => {
          const bgMap = new Map<string, BackgroundItem>();
          DEFAULT_BACKGROUNDS.forEach((b) => bgMap.set(b.id, b));
          prevLocal.forEach((b) => {
            if (b.isCustom || !bgMap.has(b.id)) bgMap.set(b.id, b);
          });
          cloudBackgrounds.forEach((b) => bgMap.set(b.id, b));
          const merged = Array.from(bgMap.values());
          saveBackgrounds(merged);
          return merged;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Auto-save to localStorage immediately and debounce save to Cloud Firestore
  useEffect(() => {
    saveMenuData(menuData);

    // If change was caused by remote Firestore sync, do not echo it back
    if (isIncomingCloudUpdate.current) {
      isIncomingCloudUpdate.current = false;
      return;
    }

    const currentJson = JSON.stringify(menuData);
    // If exact same data was already saved, no need to push
    if (currentJson === lastSavedMenuJson.current) {
      return;
    }

    setCloudSyncStatus('saving');

    const timer = setTimeout(async () => {
      try {
        lastSavedMenuJson.current = currentJson;
        await saveMenuToCloud(menuData);
        setCloudSyncStatus('synced');
        setLastCloudSyncTime(new Date());
      } catch (err) {
        console.warn('Failed to sync menu to Firestore:', err);
        setCloudSyncStatus('offline');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [menuData]);

  // Force manual cloud sync
  const handleForceCloudSync = async () => {
    setCloudSyncStatus('saving');
    try {
      await saveMenuToCloud(menuData);
      const customPhotos = photos.filter((p) => p.isCustom);
      await Promise.all(customPhotos.map((p) => savePhotoToCloud(p)));
      setCloudSyncStatus('synced');
      setLastCloudSyncTime(new Date());
      showToast('Menu & Bibliothèque synchronisés dans le Cloud');
    } catch (err) {
      setCloudSyncStatus('offline');
      showToast('Erreur de synchronisation cloud');
    }
  };

  useEffect(() => {
    savePhotos(photos);
  }, [photos]);

  useEffect(() => {
    saveBackgrounds(backgrounds);
  }, [backgrounds]);

  useEffect(() => {
    saveAllergens(allergensList);
  }, [allergensList]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handlers for Photos
  const handleOpenPhotoModal = (dishIdx?: number, coverPhotoIdx?: number) => {
    setActiveDishIndex(dishIdx);
    setActiveCoverPhotoIndex(coverPhotoIdx);
    setIsPhotoModalOpen(true);
  };

  const handleSelectPhoto = (photoUrl: string) => {
    if (activeCoverPhotoIndex !== undefined) {
      // Cover page featured photo
      const targetCoverIdx = activeCoverPhotoIndex;
      setMenuData((prev) => {
        const newFeatured = [...(prev.cover.featuredPhotos || [])];
        newFeatured[targetCoverIdx] = photoUrl;
        return {
          ...prev,
          cover: {
            ...prev.cover,
            featuredPhotos: newFeatured,
          },
        };
      });
      showToast('Photo de vitrine mise à jour');
    } else if (activeDishIndex !== undefined && activeTab !== 'cover') {
      // Day Dish Photo
      const dayKey = activeTab as DayId;
      const targetDishIdx = activeDishIndex;
      setMenuData((prev) => {
        const currentDay = prev.days[dayKey];
        if (!currentDay) return prev;
        const newDishes = [...currentDay.dishes];
        if (!newDishes[targetDishIdx]) return prev;
        newDishes[targetDishIdx] = {
          ...newDishes[targetDishIdx],
          imageUrl: photoUrl,
        };
        return {
          ...prev,
          days: {
            ...prev.days,
            [dayKey]: {
              ...currentDay,
              dishes: newDishes,
            },
          },
        };
      });
      showToast('Photo du plat mise à jour');
    }
    setActiveDishIndex(undefined);
    setActiveCoverPhotoIndex(undefined);
  };

  const handleAddCustomPhoto = async (newPhoto: PhotoLibraryItem) => {
    setPhotos((prev) => [newPhoto, ...prev]);
    showToast('Photo ajoutée et synchronisée au Cloud');
    setCloudSyncStatus('saving');
    try {
      await savePhotoToCloud(newPhoto);
      setCloudSyncStatus('synced');
      setLastCloudSyncTime(new Date());
    } catch (err) {
      console.error('Erreur sauvegarde photo Cloud:', err);
      setCloudSyncStatus('offline');
    }
  };

  const handleUpdatePhoto = async (updatedPhoto: PhotoLibraryItem) => {
    setPhotos((prev) => prev.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p)));
    showToast('Photo mise à jour dans le Cloud');
    setCloudSyncStatus('saving');
    try {
      await savePhotoToCloud(updatedPhoto);
      setCloudSyncStatus('synced');
      setLastCloudSyncTime(new Date());
    } catch (err) {
      console.error('Erreur mise à jour photo Cloud:', err);
      setCloudSyncStatus('offline');
    }
  };

  const handleDeletePhoto = async (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    showToast('Photo supprimée de la bibliothèque');
    try {
      await deletePhotoFromCloud(id);
    } catch (err) {
      console.error('Erreur suppression photo Cloud:', err);
    }
  };

  const handleResetDefaultPhotos = () => {
    setPhotos(DEFAULT_PHOTOS);
    showToast('Catalogue de photos par défaut restauré');
  };

  const handleImportPhotos = async (importedPhotos: PhotoLibraryItem[]) => {
    if (!importedPhotos || importedPhotos.length === 0) return;

    let mergedCustomCount = 0;
    setPhotos((prev) => {
      const sanitized = importedPhotos.map((p) => {
        const isDef = DEFAULT_PHOTOS.some((d) => d.id === p.id || d.url === p.url);
        return { ...p, isCustom: !isDef };
      });
      const merged = deduplicatePhotoList([...sanitized, ...prev, ...DEFAULT_PHOTOS]);
      merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      savePhotos(merged);
      mergedCustomCount = merged.filter((p) => p.isCustom).length;
      return merged;
    });

    setCloudSyncStatus('saving');
    showToast(`Photos importées et dédoublées. Envoi vers le Cloud...`);
    try {
      const customOnes = importedPhotos.filter((p) => !DEFAULT_PHOTOS.some((d) => d.id === p.id || d.url === p.url));
      for (const p of customOnes) {
        await savePhotoToCloud({ ...p, isCustom: true });
      }
      setCloudSyncStatus('synced');
      setLastCloudSyncTime(new Date());
      showToast(`Bibliothèque synchronisée (${mergedCustomCount} photos)`);
    } catch (err) {
      console.warn('Erreur sauvegarde Cloud import photos:', err);
      setCloudSyncStatus('offline');
      showToast('Photos importées localement');
    }
  };

  // Handlers for Backgrounds
  const handleSelectBackground = (bgId: string, applyToAll: boolean, opacity?: number) => {
    setMenuData((prev) => {
      const opacityToApply = opacity !== undefined ? opacity : (prev.backgroundOpacity ?? 70);
      if (applyToAll) {
        return {
          ...prev,
          backgroundOpacity: opacityToApply,
          cover: { ...prev.cover, backgroundId: bgId, customBackgroundUrl: undefined, backgroundOpacity: opacityToApply },
          days: {
            monday: { ...prev.days.monday, backgroundId: bgId, customBackgroundUrl: undefined, backgroundOpacity: opacityToApply },
            tuesday: { ...prev.days.tuesday, backgroundId: bgId, customBackgroundUrl: undefined, backgroundOpacity: opacityToApply },
            wednesday: { ...prev.days.wednesday, backgroundId: bgId, customBackgroundUrl: undefined, backgroundOpacity: opacityToApply },
            thursday: { ...prev.days.thursday, backgroundId: bgId, customBackgroundUrl: undefined, backgroundOpacity: opacityToApply },
            friday: { ...prev.days.friday, backgroundId: bgId, customBackgroundUrl: undefined, backgroundOpacity: opacityToApply },
          },
        };
      } else {
        if (activeTab === 'cover') {
          return {
            ...prev,
            cover: { ...prev.cover, backgroundId: bgId, customBackgroundUrl: undefined, backgroundOpacity: opacityToApply },
          };
        } else {
          const dayKey = activeTab as DayId;
          return {
            ...prev,
            days: {
              ...prev.days,
              [dayKey]: {
                ...prev.days[dayKey],
                backgroundId: bgId,
                customBackgroundUrl: undefined,
                backgroundOpacity: opacityToApply,
              },
            },
          };
        }
      }
    });
    showToast(applyToAll ? 'Fond et opacité appliqués à toute la semaine' : 'Fond et opacité du visuel mis à jour');
  };

  const handleAddCustomBackground = async (newBg: BackgroundItem) => {
    setBackgrounds((prev) => [newBg, ...prev]);
    showToast('Fond personnalisé ajouté et synchronisé');
    try {
      await saveBackgroundToCloud(newBg);
    } catch (err) {
      console.warn('Erreur sauvegarde fond cloud:', err);
    }
  };

  // Handlers for Allergens
  const handleOpenAllergenModal = (dishIdx: number) => {
    setActiveDishIndex(dishIdx);
    setIsAllergenModalOpen(true);
  };

  const handleSaveAllergens = (allergens: number[], customText?: string) => {
    if (activeDishIndex !== undefined && activeTab !== 'cover') {
      const dayKey = activeTab as DayId;
      const targetDishIdx = activeDishIndex;
      setMenuData((prev) => {
        const currentDay = prev.days[dayKey];
        if (!currentDay) return prev;
        const newDishes = [...currentDay.dishes];
        if (!newDishes[targetDishIdx]) return prev;
        newDishes[targetDishIdx] = {
          ...newDishes[targetDishIdx],
          allergens,
          customAllergenText: customText,
        };
        return {
          ...prev,
          days: {
            ...prev.days,
            [dayKey]: {
              ...currentDay,
              dishes: newDishes,
            },
          },
        };
      });
      showToast('Allergènes mis à jour');
    }
    setActiveDishIndex(undefined);
  };

  const handleAddCustomAllergen = (newAllergen: AllergenDef) => {
    setAllergensList((prev) => [...prev, newAllergen]);
    showToast(`Allergène "${newAllergen.shortName}" ajouté`);
  };

  const handleUpdateAllergen = (updatedAllergen: AllergenDef) => {
    setAllergensList((prev) =>
      prev.map((a) => (a.number === updatedAllergen.number ? updatedAllergen : a))
    );
    showToast(`Allergène n°${updatedAllergen.number} mis à jour`);
  };

  const handleDeleteCustomAllergen = (num: number) => {
    setAllergensList((prev) => prev.filter((a) => a.number !== num));
    showToast('Allergène personnalisé supprimé');
  };

  // Reset / Load Sample
  const handleLoadExample = () => {
    setMenuData(INITIAL_WEEKLY_MENU);
    showToast('Menu gastronomique de saison chargé');
  };

  const handleResetToBlank = () => {
    const blankMenu: WeeklyMenuData = {
      id: 'blank-week',
      weekLabel: 'Menu de la Semaine',
      templateId: 'classic-navy',
      cover: {
        id: 'cover',
        brandName: "CHEF'S CLUB",
        title: "Chef's Club vous présente le menu de la semaine",
        subtitlePrefix: 'du',
        startDate: '01 Septembre',
        subtitleMiddle: 'au',
        endDate: '05 Septembre',
        year: '2026',
        tagline: 'Cuisine fraîche & de saison au restaurant d\'entreprise',
        backgroundId: DEFAULT_BACKGROUNDS[0].id,
        featuredPhotos: [DEFAULT_PHOTOS[0].url, DEFAULT_PHOTOS[1].url, DEFAULT_PHOTOS[2].url],
      },
      days: {
        monday: {
          id: 'monday',
          dayName: 'Lundi',
          dateFormatted: '01/09',
          dishCount: 2,
          backgroundId: DEFAULT_BACKGROUNDS[0].id,
          dishes: [
            {
              id: 'dish-mon-1',
              name: 'Nom du premier plat',
              allergens: [1, 7],
              showFrenchMeat: false,
              imageUrl: DEFAULT_PHOTOS[0].url,
            },
            {
              id: 'dish-mon-2',
              name: 'Nom du deuxième plat',
              allergens: [4],
              showFrenchMeat: true,
              imageUrl: DEFAULT_PHOTOS[1].url,
            },
          ],
        },
        tuesday: {
          id: 'tuesday',
          dayName: 'Mardi',
          dateFormatted: '02/09',
          dishCount: 2,
          backgroundId: DEFAULT_BACKGROUNDS[0].id,
          dishes: [
            {
              id: 'dish-tue-1',
              name: 'Nom du premier plat',
              allergens: [1],
              showFrenchMeat: true,
              imageUrl: DEFAULT_PHOTOS[2].url,
            },
            {
              id: 'dish-tue-2',
              name: 'Nom du deuxième plat',
              allergens: [7],
              showFrenchMeat: false,
              imageUrl: DEFAULT_PHOTOS[3].url,
            },
          ],
        },
        wednesday: {
          id: 'wednesday',
          dayName: 'Mercredi',
          dateFormatted: '03/09',
          dishCount: 2,
          backgroundId: DEFAULT_BACKGROUNDS[0].id,
          dishes: [
            {
              id: 'dish-wed-1',
              name: 'Nom du premier plat',
              allergens: [1, 10],
              showFrenchMeat: true,
              imageUrl: DEFAULT_PHOTOS[4].url,
            },
            {
              id: 'dish-wed-2',
              name: 'Nom du deuxième plat',
              allergens: [6],
              showFrenchMeat: false,
              imageUrl: DEFAULT_PHOTOS[5].url,
            },
          ],
        },
        thursday: {
          id: 'thursday',
          dayName: 'Jeudi',
          dateFormatted: '04/09',
          dishCount: 2,
          backgroundId: DEFAULT_BACKGROUNDS[0].id,
          dishes: [
            {
              id: 'dish-thu-1',
              name: 'Nom du premier plat',
              allergens: [12],
              showFrenchMeat: true,
              imageUrl: DEFAULT_PHOTOS[6].url,
            },
            {
              id: 'dish-thu-2',
              name: 'Nom du deuxième plat',
              allergens: [4, 7],
              showFrenchMeat: false,
              imageUrl: DEFAULT_PHOTOS[7].url,
            },
          ],
        },
        friday: {
          id: 'friday',
          dayName: 'Vendredi',
          dateFormatted: '05/09',
          dishCount: 2,
          backgroundId: DEFAULT_BACKGROUNDS[0].id,
          dishes: [
            {
              id: 'dish-fri-1',
              name: 'Nom du premier plat',
              allergens: [1, 4],
              showFrenchMeat: false,
              imageUrl: DEFAULT_PHOTOS[8].url,
            },
            {
              id: 'dish-fri-2',
              name: 'Nom du deuxième plat',
              allergens: [3, 7],
              showFrenchMeat: true,
              imageUrl: DEFAULT_PHOTOS[9].url,
            },
          ],
        },
      },
    };
    setMenuData(blankMenu);
    showToast('Menu réinitialisé');
  };

  // Helper to get element by day id
  const getExportElement = (tabId: 'cover' | DayId): HTMLElement | null => {
    switch (tabId) {
      case 'cover':
        return exportTargetCoverRef.current;
      case 'monday':
        return exportTargetMondayRef.current;
      case 'tuesday':
        return exportTargetTuesdayRef.current;
      case 'wednesday':
        return exportTargetWednesdayRef.current;
      case 'thursday':
        return exportTargetThursdayRef.current;
      case 'friday':
        return exportTargetFridayRef.current;
      default:
        return null;
    }
  };

  const getFileName = (tabId: 'cover' | DayId): string => {
    if (tabId === 'cover') {
      const dates = `${menuData.cover.startDate || ''}-${menuData.cover.endDate || ''}`.replace(/\s+/g, '-');
      return `chefs-club-00-garde-${dates}`.toLowerCase();
    }
    const day = menuData.days[tabId];
    const dateSlug = (day.dateFormatted || '').replace(/\//g, '-').replace(/\s+/g, '-');
    return `chefs-club-${day.dayName.toLowerCase()}-${dateSlug}`;
  };

  // Export single page
  const handleExportCurrent = async (res: 500 | 1080 | 1440 | 2160 = 1080) => {
    const el = getExportElement(activeTab);
    if (!el) {
      alert("Élément introuvable pour l'export");
      return;
    }

    setIsExporting(true);
    setExportProgress({ current: 1, total: 1, label: `Génération du PNG ${activeTab}...` });
    try {
      await exportElementAsPng(el, getFileName(activeTab), res);
      showToast(`Image téléchargée avec succès (${res}x${res}px)`);
    } catch (err) {
      console.error('Export error', err);
      alert("Une erreur est survenue lors de l'export PNG.");
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Export single day from grid
  const handleExportSingleDay = async (tabId: 'cover' | DayId) => {
    const el = getExportElement(tabId);
    if (!el) return;
    setIsExporting(true);
    try {
      await exportElementAsPng(el, getFileName(tabId), 1080);
      showToast(`Image téléchargée : ${tabId}`);
    } catch (err) {
      console.error('Export error', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export ALL 6 pages as ZIP
  const handleExportAll = async (res: 500 | 1080 | 1440 | 2160 = 1080) => {
    const tabs: ('cover' | DayId)[] = ['cover', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const elementsWithNames = tabs
      .map((tab) => ({
        element: getExportElement(tab),
        fileName: getFileName(tab),
      }))
      .filter((item): item is { element: HTMLElement; fileName: string } => item.element !== null);

    if (elementsWithNames.length === 0) {
      alert("Éléments introuvables pour l'export.");
      return;
    }

    setIsExporting(true);
    try {
      await exportAllVisualsAsZip(elementsWithNames, (progress) => setExportProgress(progress), res);
      showToast('Pack des 6 visuels téléchargé en ZIP !');
    } catch (err) {
      console.error('Batch export error', err);
      alert("Une erreur est survenue lors de l'export groupé.");
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Export single page as PDF
  const handleExportCurrentPdf = async (res: 500 | 1080 | 1440 | 2160 = 1080) => {
    const el = getExportElement(activeTab);
    if (!el) {
      alert("Élément introuvable pour l'export PDF");
      return;
    }

    setIsExporting(true);
    setExportProgress({ current: 1, total: 1, label: `Génération du PDF ${activeTab}...` });
    try {
      await exportElementAsPdf(el, getFileName(activeTab), res);
      showToast(`Document PDF (${activeTabLabel}) téléchargé !`);
    } catch (err) {
      console.error('Export PDF error', err);
      alert("Une erreur est survenue lors de l'export PDF.");
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Export all 6 pages as a single multi-page PDF booklet
  const handleExportAllPdf = async (res: 500 | 1080 | 1440 | 2160 = 1080) => {
    const tabs: ('cover' | DayId)[] = ['cover', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const elementsWithNames = tabs
      .map((tab) => ({
        element: getExportElement(tab),
        fileName: getFileName(tab),
      }))
      .filter((item): item is { element: HTMLElement; fileName: string } => item.element !== null);

    if (elementsWithNames.length === 0) {
      alert("Éléments introuvables pour l'export PDF.");
      return;
    }

    setIsExporting(true);
    try {
      await exportAllVisualsAsPdf(elementsWithNames, (progress) => setExportProgress(progress), res);
      showToast('Livret PDF complet des 6 pages téléchargé !');
    } catch (err) {
      console.error('Batch export PDF error', err);
      alert("Une erreur est survenue lors de la création du livret PDF.");
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const activeTabLabel =
    activeTab === 'cover'
      ? 'Page de Garde'
      : menuData.days[activeTab as DayId]?.dayName || 'Jour';

  // Target dish for allergen modal
  const selectedDishForAllergen =
    activeDishIndex !== undefined && activeTab !== 'cover'
      ? menuData.days[activeTab as DayId]?.dishes[activeDishIndex]
      : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#cfd9df] to-[#e2ebf0] text-slate-800 flex flex-col font-sans-clean">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP NAVBAR (Translucent Frosted Panel) */}
      <header className="bg-white/45 backdrop-blur-xl border-b border-white/60 sticky top-0 z-40 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#132847] to-slate-900 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-md">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 uppercase">
                  Chef&apos;s Club
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 text-[10px] font-bold border border-amber-500/30">
                  Générateur de Menu
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Création et export de visuels carrés HD (500x500 à 4K)
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="bg-white/50 p-1 rounded-xl border border-white/70 shadow-xs flex items-center">
              <button
                onClick={() => setViewMode('editor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'editor'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Édition</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>6 Visuels</span>
              </button>
            </div>

            {/* Cloud Firestore Persistence Status */}
            <button
              onClick={handleForceCloudSync}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                cloudSyncStatus === 'synced'
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                  : cloudSyncStatus === 'saving'
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title={
                cloudSyncStatus === 'synced'
                  ? `Sauvegarde Cloud active (Firebase) - Dernier enregistrement: ${lastCloudSyncTime?.toLocaleTimeString() || 'récent'}. Cliquez pour synchroniser immédiatement.`
                  : cloudSyncStatus === 'saving'
                  ? 'Synchronisation cloud en cours...'
                  : 'Mode hors-ligne local - Cliquez pour tenter la synchronisation cloud'
              }
            >
              {cloudSyncStatus === 'saving' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              ) : cloudSyncStatus === 'synced' ? (
                <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span className="hidden lg:inline">
                {cloudSyncStatus === 'saving'
                  ? 'Sauvegarde...'
                  : cloudSyncStatus === 'synced'
                  ? 'Cloud synchronisé'
                  : 'Cloud hors-ligne'}
              </span>
            </button>

            {/* Typography & Sizes Modal Trigger */}
            <button
              id="header-typography-modal-btn"
              onClick={() => handleOpenTypographyModal('all')}
              className="px-3 py-2 bg-white/70 hover:bg-white text-blue-900 border border-blue-300/80 hover:border-blue-500 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Modifier les polices et tailles des plats, libellés et allergènes"
            >
              <Type className="w-4 h-4 text-blue-600" />
              <span>Polices &amp; Tailles</span>
            </button>

            {/* Photo Library Manager Button */}
            <button
              onClick={() => handleOpenPhotoModal(undefined, undefined)}
              className="px-3 py-2 bg-white/60 hover:bg-white/90 text-slate-800 border border-white/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              title="Ouvrir la bibliothèque de photos de plats"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden md:inline">Galerie Photos</span> ({photos.length})
            </button>

            {/* Reset / Sample Menu */}
            <button
              onClick={handleResetToBlank}
              className="p-2 bg-white/60 hover:bg-white/90 text-slate-500 hover:text-red-600 border border-white/80 rounded-xl transition-all shadow-xs"
              title="Vider et réinitialiser le menu"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {viewMode === 'grid' ? (
          /* Grid View Mode: All 6 Cards */
          <WeekGridView
            menuData={menuData}
            backgrounds={backgrounds}
            allergensList={allergensList}
            onSelectDayForEdit={(tab) => {
              setActiveTab(tab);
              setViewMode('editor');
            }}
            onExportSingleDay={handleExportSingleDay}
          />
        ) : (
          /* Editor Mode: Split View (Editor Form Left, Live Preview Right) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Editor */}
            <div className="lg:col-span-5 xl:col-span-5 h-[calc(100vh-190px)] min-h-[580px]">
              <MenuEditor
                menuData={menuData}
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                onUpdateMenu={setMenuData}
                backgrounds={backgrounds}
                photos={photos}
                allergensList={allergensList}
                onOpenPhotoModal={handleOpenPhotoModal}
                onOpenBackgroundModal={() => setIsBackgroundModalOpen(true)}
                onOpenAllergenModal={handleOpenAllergenModal}
                onOpenTypographyModal={handleOpenTypographyModal}
                onLoadExampleMenu={handleLoadExample}
              />
            </div>

            {/* Right Column: Live WYSIWYG Preview */}
            <div className="lg:col-span-7 xl:col-span-7 flex flex-col items-center space-y-4">
              <div className="w-full flex items-center justify-between px-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-600" />
                  Aperçu en Direct ({activeTabLabel})
                </span>

                <span className="text-[11px] text-slate-600 font-medium">
                  Rendu carré 1:1 fidèle à l&apos;export PNG
                </span>
              </div>

              {/* Live Preview Frame Container */}
              <div
                ref={livePreviewRef}
                className="w-full max-w-[560px] aspect-square rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/60 bg-white/40 backdrop-blur-md p-1"
              >
                {activeTab === 'cover' ? (
                  <CoverVisualCard
                    coverData={menuData.cover}
                    backgrounds={backgrounds}
                    templateId={menuData.templateId}
                    backgroundOpacity={menuData.backgroundOpacity}
                  />
                ) : (
                  <DayVisualCard
                    dayMenu={menuData.days[activeTab as DayId]}
                    backgrounds={backgrounds}
                    templateId={menuData.templateId}
                    backgroundOpacity={menuData.backgroundOpacity}
                    allergensList={allergensList}
                    typography={menuData.typography}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. EXPORT TOOLBAR */}
        <ExportToolbar
          onExportCurrent={handleExportCurrent}
          onExportAll={handleExportAll}
          onExportCurrentPdf={handleExportCurrentPdf}
          onExportAllPdf={handleExportAllPdf}
          isExporting={isExporting}
          exportProgress={exportProgress}
          activeTabLabel={activeTabLabel}
        />
      </main>

      {/* 4. HIDDEN 1080x1080 CAPTURE NODES (Guarantees exact, razor-sharp renders without browser coordinate culling) */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '1080px',
          height: '1080px',
          pointerEvents: 'none',
          opacity: 0.001,
          zIndex: -100,
          overflow: 'hidden',
        }}
        aria-hidden="true"
      >
        {/* Cover Page */}
        <div ref={exportTargetCoverRef} className="w-[1080px] h-[1080px]">
          <CoverVisualCard
            coverData={menuData.cover}
            backgrounds={backgrounds}
            templateId={menuData.templateId}
            backgroundOpacity={menuData.backgroundOpacity}
            isExporting
          />
        </div>

        {/* Monday */}
        <div ref={exportTargetMondayRef} className="w-[1080px] h-[1080px]">
          <DayVisualCard
            dayMenu={menuData.days.monday}
            backgrounds={backgrounds}
            templateId={menuData.templateId}
            backgroundOpacity={menuData.backgroundOpacity}
            allergensList={allergensList}
            typography={menuData.typography}
            isExporting
          />
        </div>

        {/* Tuesday */}
        <div ref={exportTargetTuesdayRef} className="w-[1080px] h-[1080px]">
          <DayVisualCard
            dayMenu={menuData.days.tuesday}
            backgrounds={backgrounds}
            templateId={menuData.templateId}
            backgroundOpacity={menuData.backgroundOpacity}
            allergensList={allergensList}
            typography={menuData.typography}
            isExporting
          />
        </div>

        {/* Wednesday */}
        <div ref={exportTargetWednesdayRef} className="w-[1080px] h-[1080px]">
          <DayVisualCard
            dayMenu={menuData.days.wednesday}
            backgrounds={backgrounds}
            templateId={menuData.templateId}
            backgroundOpacity={menuData.backgroundOpacity}
            allergensList={allergensList}
            typography={menuData.typography}
            isExporting
          />
        </div>

        {/* Thursday */}
        <div ref={exportTargetThursdayRef} className="w-[1080px] h-[1080px]">
          <DayVisualCard
            dayMenu={menuData.days.thursday}
            backgrounds={backgrounds}
            templateId={menuData.templateId}
            backgroundOpacity={menuData.backgroundOpacity}
            allergensList={allergensList}
            typography={menuData.typography}
            isExporting
          />
        </div>

        {/* Friday */}
        <div ref={exportTargetFridayRef} className="w-[1080px] h-[1080px]">
          <DayVisualCard
            dayMenu={menuData.days.friday}
            backgrounds={backgrounds}
            templateId={menuData.templateId}
            backgroundOpacity={menuData.backgroundOpacity}
            allergensList={allergensList}
            typography={menuData.typography}
            isExporting
          />
        </div>
      </div>

      {/* 5. MODALS */}
      {/* Photo Library Modal */}
      <ErrorBoundary
        fallbackTitle="Erreur dans la galerie de photos"
        fallbackMessage="La galerie photo a rencontré une anomalie lors de son chargement. Vous pouvez la relancer ou la refermer."
        onReset={() => {
          setIsPhotoModalOpen(false);
          setActiveDishIndex(undefined);
          setActiveCoverPhotoIndex(undefined);
        }}
      >
        <PhotoLibraryModal
          isOpen={isPhotoModalOpen}
          onClose={() => {
            setIsPhotoModalOpen(false);
            setActiveDishIndex(undefined);
            setActiveCoverPhotoIndex(undefined);
          }}
          photos={photos}
          onSelectPhoto={handleSelectPhoto}
          onAddPhoto={handleAddCustomPhoto}
          onDeletePhoto={handleDeletePhoto}
          onUpdatePhoto={handleUpdatePhoto}
          onResetDefaultPhotos={handleResetDefaultPhotos}
          onImportPhotos={handleImportPhotos}
          currentSelectedUrl={
            activeCoverPhotoIndex !== undefined
              ? menuData.cover.featuredPhotos?.[activeCoverPhotoIndex]
              : activeDishIndex !== undefined && activeTab !== 'cover'
              ? menuData.days[activeTab as DayId]?.dishes[activeDishIndex]?.imageUrl
              : undefined
          }
        />
      </ErrorBoundary>

      {/* Background Library Modal */}
      <BackgroundLibraryModal
        isOpen={isBackgroundModalOpen}
        onClose={() => setIsBackgroundModalOpen(false)}
        backgrounds={backgrounds}
        currentBackgroundId={
          activeTab === 'cover'
            ? menuData.cover.backgroundId
            : menuData.days[activeTab as DayId]?.backgroundId || backgrounds[0].id
        }
        currentOpacity={menuData.backgroundOpacity ?? 70}
        onSelectBackground={handleSelectBackground}
        onAddCustomBackground={handleAddCustomBackground}
      />

      {/* Allergen Picker Modal */}
      {selectedDishForAllergen && (
        <AllergenPickerModal
          isOpen={isAllergenModalOpen}
          onClose={() => {
            setIsAllergenModalOpen(false);
            setActiveDishIndex(undefined);
          }}
          selectedAllergens={selectedDishForAllergen.allergens}
          customText={selectedDishForAllergen.customAllergenText}
          onSave={handleSaveAllergens}
          dishName={selectedDishForAllergen.name}
          allergensList={allergensList}
          onAddCustomAllergen={handleAddCustomAllergen}
          onUpdateAllergen={handleUpdateAllergen}
          onDeleteCustomAllergen={handleDeleteCustomAllergen}
        />
      )}

      {/* Typography & Sizes Modal */}
      <TypographyModal
        isOpen={isTypographyModalOpen}
        onClose={() => setIsTypographyModalOpen(false)}
        menuData={menuData}
        onUpdateMenu={setMenuData}
        allergensList={allergensList}
        initialTab={typographyModalTab}
      />
    </div>
  );
}

