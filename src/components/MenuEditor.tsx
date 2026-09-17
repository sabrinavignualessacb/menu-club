import React, { useState, useRef } from 'react';
import {
  AllergenDef,
  BackgroundItem,
  DayId,
  DayMenu,
  Dish,
  DishBadge,
  MenuTemplateId,
  PhotoLibraryItem,
  TypographySettings,
  WeeklyMenuData,
} from '../types';
import { MENU_TEMPLATES } from '../data/templates';
import { AllergenBadge } from './AllergenBadge';
import { BadgeRenderer, BadgesList } from './BadgeRenderer';
import { DEFAULT_BADGES } from '../data/badges';
import { ImageCropModal } from './ImageCropModal';
import { compressImage } from '../utils/cropImage';
import {
  Calendar,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Palette,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Crop,
  Award,
  Plus,
  X,
  Upload,
  Trash2,
  CalendarOff,
  Type,
  Leaf,
  Sprout,
  Sliders,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import {
  parseFrenchDate,
  computeWeekDaysFromStartDate,
  computeWeekDaysFromEndDate,
  computeWeekDaysFromMondayDate,
  getMondayOfWeek,
  formatDateToIso,
} from '../utils/dateUtils';
import {
  FONT_OPTIONS,
  DISH_TITLE_SIZE_OPTIONS,
  DISH_LABEL_SIZE_OPTIONS,
  ALLERGEN_SIZE_OPTIONS,
  COVER_DATE_SIZE_OPTIONS,
  getFontFamilyClass,
} from '../utils/typography';

interface MenuEditorProps {
  menuData: WeeklyMenuData;
  activeTab: 'cover' | DayId;
  onSelectTab: (tab: 'cover' | DayId) => void;
  onUpdateMenu: (updated: WeeklyMenuData | ((prev: WeeklyMenuData) => WeeklyMenuData)) => void;
  backgrounds: BackgroundItem[];
  photos: PhotoLibraryItem[];
  allergensList?: AllergenDef[];
  onOpenPhotoModal: (dishIndex?: number, isCoverPhotoIndex?: number) => void;
  onOpenBackgroundModal: () => void;
  onOpenAllergenModal: (dishIndex: number) => void;
  onOpenTypographyModal?: (
    section?: 'all' | 'dishTitle' | 'dishLabel' | 'labelPosition' | 'dishColors' | 'plateCircle' | 'allergen' | 'backgroundOpacity'
  ) => void;
  onLoadExampleMenu: () => void;
}

export const MenuEditor: React.FC<MenuEditorProps> = ({
  menuData,
  activeTab,
  onSelectTab,
  onUpdateMenu,
  backgrounds,
  photos,
  allergensList,
  onOpenPhotoModal,
  onOpenBackgroundModal,
  onOpenAllergenModal,
  onOpenTypographyModal,
  onLoadExampleMenu,
}) => {
  const isCover = activeTab === 'cover';
  const currentDay: DayMenu | undefined = !isCover ? menuData.days[activeTab as DayId] : undefined;
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [isTypographyOpen, setIsTypographyOpen] = useState(false);

  const typography = menuData.typography || {};

  const updateTypography = (partial: Partial<TypographySettings>) => {
    onUpdateMenu((prev) => ({
      ...prev,
      typography: {
        ...prev.typography,
        ...partial,
      },
    }));
  };

  // ----------------- Date Synchronization (Cover -> Days) -----------------
  const [autoSyncDates, setAutoSyncDates] = useState(true);
  const [dateSyncToast, setDateSyncToast] = useState<string | null>(null);

  const showDateFeedback = (msg: string) => {
    setDateSyncToast(msg);
    setTimeout(() => setDateSyncToast(null), 3200);
  };

  // Synchronize from start date input
  const handleStartDateChange = (newStart: string) => {
    onUpdateMenu((prev) => {
      if (!autoSyncDates) {
        return {
          ...prev,
          cover: { ...prev.cover, startDate: newStart },
        };
      }

      const computed = computeWeekDaysFromStartDate(newStart, prev.cover.year);
      if (computed) {
        return {
          ...prev,
          cover: {
            ...prev.cover,
            startDate: newStart,
            endDate: computed.endDateCover,
            year: computed.year || prev.cover.year,
          },
          days: {
            monday: { ...prev.days.monday, dateFormatted: computed.monday },
            tuesday: { ...prev.days.tuesday, dateFormatted: computed.tuesday },
            wednesday: { ...prev.days.wednesday, dateFormatted: computed.wednesday },
            thursday: { ...prev.days.thursday, dateFormatted: computed.thursday },
            friday: { ...prev.days.friday, dateFormatted: computed.friday },
          },
        };
      } else {
        return {
          ...prev,
          cover: { ...prev.cover, startDate: newStart },
        };
      }
    });
  };

  // Synchronize from end date input
  const handleEndDateChange = (newEnd: string) => {
    onUpdateMenu((prev) => {
      if (!autoSyncDates) {
        return {
          ...prev,
          cover: { ...prev.cover, endDate: newEnd },
        };
      }

      const parsed = parseFrenchDate(newEnd, prev.cover.year);
      if (parsed) {
        const fridayFormatted = `${String(parsed.day).padStart(2, '0')}/${String(parsed.month).padStart(2, '0')}`;
        return {
          ...prev,
          cover: { ...prev.cover, endDate: newEnd },
          days: {
            ...prev.days,
            friday: { ...prev.days.friday, dateFormatted: fridayFormatted },
          },
        };
      } else {
        return {
          ...prev,
          cover: { ...prev.cover, endDate: newEnd },
        };
      }
    });
  };

  // Synchronize from year input
  const handleYearChange = (newYear: string) => {
    onUpdateMenu((prev) => {
      if (autoSyncDates && prev.cover.startDate) {
        const computed = computeWeekDaysFromStartDate(prev.cover.startDate, newYear);
        if (computed) {
          return {
            ...prev,
            cover: { ...prev.cover, year: newYear, endDate: computed.endDateCover },
            days: {
              monday: { ...prev.days.monday, dateFormatted: computed.monday },
              tuesday: { ...prev.days.tuesday, dateFormatted: computed.tuesday },
              wednesday: { ...prev.days.wednesday, dateFormatted: computed.wednesday },
              thursday: { ...prev.days.thursday, dateFormatted: computed.thursday },
              friday: { ...prev.days.friday, dateFormatted: computed.friday },
            },
          };
        }
      }
      return {
        ...prev,
        cover: { ...prev.cover, year: newYear },
      };
    });
  };

  // Apply a week from an ISO date picked in the native calendar
  const handleApplyCalendarDate = (dateIso: string) => {
    if (!dateIso) return;
    const parts = dateIso.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const pickedDate = new Date(y, m, d);
      const dayOfWeek = pickedDate.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(y, m, d + diffToMonday);

      const computed = computeWeekDaysFromMondayDate(monday, true);
      onUpdateMenu((prev) => ({
        ...prev,
        cover: {
          ...prev.cover,
          startDate: computed.startDateCover,
          endDate: computed.endDateCover,
          year: computed.year,
        },
        days: {
          monday: { ...prev.days.monday, dateFormatted: computed.monday },
          tuesday: { ...prev.days.tuesday, dateFormatted: computed.tuesday },
          wednesday: { ...prev.days.wednesday, dateFormatted: computed.wednesday },
          thursday: { ...prev.days.thursday, dateFormatted: computed.thursday },
          friday: { ...prev.days.friday, dateFormatted: computed.friday },
        },
      }));
      showDateFeedback(`Semaine du ${computed.startDateCover} au ${computed.endDateCover} synchronisée`);
    }
  };

  // Quick helper: current week (offset 0) or next week (offset 1)
  const handleApplyQuickWeek = (offsetWeeks: number) => {
    const monday = getMondayOfWeek(offsetWeeks);
    const computed = computeWeekDaysFromMondayDate(monday, true);
    onUpdateMenu((prev) => ({
      ...prev,
      cover: {
        ...prev.cover,
        startDate: computed.startDateCover,
        endDate: computed.endDateCover,
        year: computed.year,
      },
      days: {
        monday: { ...prev.days.monday, dateFormatted: computed.monday },
        tuesday: { ...prev.days.tuesday, dateFormatted: computed.tuesday },
        wednesday: { ...prev.days.wednesday, dateFormatted: computed.wednesday },
        thursday: { ...prev.days.thursday, dateFormatted: computed.thursday },
        friday: { ...prev.days.friday, dateFormatted: computed.friday },
      },
    }));
    showDateFeedback(`Semaine du ${computed.startDateCover} au ${computed.endDateCover} synchronisée`);
  };

  // Force chronological resynchronization
  const handleForceResyncDates = () => {
    const computed =
      computeWeekDaysFromStartDate(menuData.cover.startDate, menuData.cover.year) ||
      computeWeekDaysFromEndDate(menuData.cover.endDate, menuData.cover.year);

    if (computed) {
      onUpdateMenu((prev) => ({
        ...prev,
        cover: {
          ...prev.cover,
          startDate: computed.startDateCover,
          endDate: computed.endDateCover,
          year: computed.year || prev.cover.year,
        },
        days: {
          monday: { ...prev.days.monday, dateFormatted: computed.monday },
          tuesday: { ...prev.days.tuesday, dateFormatted: computed.tuesday },
          wednesday: { ...prev.days.wednesday, dateFormatted: computed.wednesday },
          thursday: { ...prev.days.thursday, dateFormatted: computed.thursday },
          friday: { ...prev.days.friday, dateFormatted: computed.friday },
        },
      }));
      showDateFeedback('Dates des 5 jours synchronisées chronologiquement !');
    } else {
      showDateFeedback('Date non reconnue. Exemple: 31 Août ou 31/08');
    }
  };

  // Compute current Monday ISO for calendar input
  const parsedStart = parseFrenchDate(menuData.cover.startDate, menuData.cover.year);
  const currentMondayIso = parsedStart
    ? formatDateToIso(new Date(parsedStart.year, parsedStart.month - 1, parsedStart.day))
    : '';

  // In-place Dish Cropping
  const [dishCropperTarget, setDishCropperTarget] = useState<{
    dishIndex: number;
    imageSrc: string;
    dishName: string;
  } | null>(null);
  const dishDirectFileInputRef = useRef<HTMLInputElement>(null);
  const [directUploadIndex, setDirectUploadIndex] = useState<number | null>(null);

  // Custom Badge Input per dish
  const [newCustomBadgeText, setNewCustomBadgeText] = useState<{ [dishIdx: number]: string }>({});

  // Helper to determine meat badge when migrating legacy showFrenchMeat flag
  const FRENCH_MEAT_IDS = ['vbf', 'pf', 'vof', 'vaf', 'vvf', 'vf', 'viande-francaise'];
  const getDishInitialMeatBadge = (dishName: string = ''): string => {
    const lower = dishName.toLowerCase();
    if (lower.includes('poulet') || lower.includes('volaille') || lower.includes('dinde') || lower.includes('canard')) {
      return 'vf';
    }
    if (lower.includes('porc') || lower.includes('cochon') || lower.includes('jambon')) {
      return 'pf';
    }
    if (lower.includes('veau')) {
      return 'vvf';
    }
    if (lower.includes('agneau')) {
      return 'vaf';
    }
    return 'vbf';
  };

  const toggleDishBadge = (dishIdx: number, badgeId: string) => {
    if (!currentDay) return;
    const dish = currentDay.dishes[dishIdx];
    if (!dish) return;

    let currentBadges: string[] = [];
    if (Array.isArray(dish.badges)) {
      currentBadges = dish.badges.map((b) => (b === 'viande-francaise' ? 'vf' : b));
    } else if (dish.showFrenchMeat) {
      currentBadges = [getDishInitialMeatBadge(dish.name)];
    }

    let updatedBadges: string[];
    if (currentBadges.includes(badgeId)) {
      updatedBadges = currentBadges.filter((id) => id !== badgeId);
    } else {
      updatedBadges = [...currentBadges, badgeId];
    }

    const hasFrenchMeat = updatedBadges.some((id) => FRENCH_MEAT_IDS.includes(id));

    updateDish(dishIdx, {
      badges: updatedBadges,
      showFrenchMeat: hasFrenchMeat,
    });
  };

  const handleAddCustomBadge = (dishIdx: number) => {
    const text = (newCustomBadgeText[dishIdx] || '').trim();
    if (!text) return;
    toggleDishBadge(dishIdx, text);
    setNewCustomBadgeText((prev) => ({ ...prev, [dishIdx]: '' }));
  };

  const handleDirectDishFilePicked = (file: File, dishIndex: number) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawUrl = e.target?.result as string;
      if (!rawUrl) return;
      try {
        const compressed = await compressImage(rawUrl, 900, 0.85);
        setDishCropperTarget({
          dishIndex,
          imageSrc: compressed,
          dishName: currentDay?.dishes[dishIndex]?.name || `Plat ${dishIndex + 1}`,
        });
      } catch {
        setDishCropperTarget({
          dishIndex,
          imageSrc: rawUrl,
          dishName: currentDay?.dishes[dishIndex]?.name || `Plat ${dishIndex + 1}`,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDishCropConfirmed = (croppedDataUrl: string) => {
    if (dishCropperTarget) {
      updateDish(dishCropperTarget.dishIndex, { imageUrl: croppedDataUrl });
      setDishCropperTarget(null);
    }
  };

  // Template Updater - explicitly preserves backgroundOpacity so changing themes never resets or affects background opacity
  const currentTemplateId = menuData.templateId || 'classic-navy';
  const currentTemplate = MENU_TEMPLATES[currentTemplateId] || MENU_TEMPLATES['classic-navy'];

  const handleSelectTemplate = (templateId: MenuTemplateId) => {
    onUpdateMenu((prev) => ({
      ...prev,
      templateId,
      backgroundOpacity: prev.backgroundOpacity ?? 70,
    }));
  };

  // Background Opacity Controls
  const [applyOpacityToAll, setApplyOpacityToAll] = useState(true);
  const currentBgOpacity = isCover
    ? (menuData.cover.backgroundOpacity !== undefined ? menuData.cover.backgroundOpacity : (menuData.backgroundOpacity ?? 70))
    : (currentDay?.backgroundOpacity !== undefined ? currentDay.backgroundOpacity : (menuData.backgroundOpacity ?? 70));

  const handleOpacityChange = (newVal: number, applyAll: boolean = applyOpacityToAll) => {
    if (applyAll) {
      onUpdateMenu((prev) => ({
        ...prev,
        backgroundOpacity: newVal,
        cover: { ...prev.cover, backgroundOpacity: newVal },
        days: {
          monday: { ...prev.days.monday, backgroundOpacity: newVal },
          tuesday: { ...prev.days.tuesday, backgroundOpacity: newVal },
          wednesday: { ...prev.days.wednesday, backgroundOpacity: newVal },
          thursday: { ...prev.days.thursday, backgroundOpacity: newVal },
          friday: { ...prev.days.friday, backgroundOpacity: newVal },
        },
      }));
    } else {
      if (isCover) {
        onUpdateMenu((prev) => ({
          ...prev,
          cover: { ...prev.cover, backgroundOpacity: newVal },
        }));
      } else {
        const dayKey = activeTab as DayId;
        onUpdateMenu((prev) => ({
          ...prev,
          days: {
            ...prev.days,
            [dayKey]: {
              ...prev.days[dayKey],
              backgroundOpacity: newVal,
            },
          },
        }));
      }
    }
  };

  // Day Updater
  const updateDayData = (updater: (prev: DayMenu) => DayMenu) => {
    if (isCover) return;
    const dayKey = activeTab as DayId;
    onUpdateMenu((prevMenu) => {
      const currentDayData = prevMenu.days[dayKey];
      if (!currentDayData) return prevMenu;
      const updatedDay = updater(currentDayData);
      return {
        ...prevMenu,
        days: {
          ...prevMenu.days,
          [dayKey]: updatedDay,
        },
      };
    });
  };

  // Dish Updater
  const updateDish = (index: number, partial: Partial<Dish>) => {
    updateDayData((prev) => {
      const newDishes = [...prev.dishes];
      newDishes[index] = { ...newDishes[index], ...partial };
      return { ...prev, dishes: newDishes };
    });
  };

  // Toggle Dish Count (2 or 3)
  const setDishCount = (count: 2 | 3) => {
    updateDayData((prev) => {
      let dishes = [...prev.dishes];
      if (dishes.length < count) {
        // Add a default third dish if missing
        dishes.push({
          id: `dish-${prev.id}-3`,
          name: 'Plat Végétarien du Chef & garniture de saison',
          allergens: [1, 7],
          showFrenchMeat: false,
          imageUrl: photos[2]?.url || photos[0]?.url || '',
        });
      }
      return {
        ...prev,
        dishCount: count,
        dishes,
      };
    });
  };

  // Days configuration for tabs
  const tabList: { id: 'cover' | DayId; label: string; sub: string }[] = [
    { id: 'cover', label: 'Garde', sub: 'Page de garde' },
    { id: 'monday', label: 'Lundi', sub: menuData.days.monday.dateFormatted || '31/08' },
    { id: 'tuesday', label: 'Mardi', sub: menuData.days.tuesday.dateFormatted || '01/09' },
    { id: 'wednesday', label: 'Mercredi', sub: menuData.days.wednesday.dateFormatted || '02/09' },
    { id: 'thursday', label: 'Jeudi', sub: menuData.days.thursday.dateFormatted || '03/09' },
    { id: 'friday', label: 'Vendredi', sub: menuData.days.friday.dateFormatted || '04/09' },
  ];

  // Active Background Name
  const currentBgId = isCover
    ? menuData.cover.backgroundId
    : currentDay?.backgroundId;
  const currentBg = backgrounds.find((b) => b.id === currentBgId) || backgrounds[0];

  return (
    <div className="flex flex-col bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-xl overflow-hidden h-full text-slate-800">
      {/* Top Navigation Tabs */}
      <div className="bg-white/50 p-2 border-b border-white/60">
        <div className="grid grid-cols-6 gap-1.5">
          {tabList.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDayHoliday = tab.id !== 'cover' && menuData.days[tab.id as DayId]?.isHoliday;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`py-2 px-1 rounded-xl text-center transition-all flex flex-col items-center justify-center relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md font-bold'
                    : isDayHoliday
                    ? 'bg-amber-50/80 text-amber-900 hover:bg-amber-100/90 border border-amber-300/80'
                    : 'bg-white/40 text-slate-700 hover:text-slate-900 hover:bg-white/70 border border-white/40'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs sm:text-sm leading-tight">{tab.label}</span>
                  {isDayHoliday && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-amber-300' : 'bg-amber-600'}`} />
                  )}
                </div>
                <span className={`text-[10px] truncate max-w-[55px] ${
                  isActive 
                    ? 'text-blue-100 font-semibold' 
                    : isDayHoliday 
                    ? 'text-amber-700 font-bold' 
                    : 'text-slate-500'
                }`}>
                  {isDayHoliday ? 'Férié' : tab.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        
        {/* Quick Typography & Text Sizes Banner */}
        <div className="p-3 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/90 rounded-xl border border-blue-200/90 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-blue-950">
                  Polices &amp; Tailles des Textes
                </span>
                <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded-md uppercase">
                  Personnalisable
                </span>
              </div>
              <span className="text-[11px] text-blue-700 block">
                Modifier la police &amp; taille des plats, libellés et allergènes
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenTypographyModal ? onOpenTypographyModal('all') : setIsTypographyOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Ouvrir le panneau complet des polices et tailles"
          >
            <Type className="w-3.5 h-3.5" />
            <span>Modifier</span>
          </button>
        </div>

        {/* Style Template & Background Bar */}
        <div className="space-y-2">
          <div className="p-3 bg-white/45 backdrop-blur-xs rounded-xl border border-white/60 flex flex-col gap-3 shadow-xs">
            {/* Template Selector Trigger */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  style={{ backgroundColor: currentTemplate.primaryColor }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/40 text-amber-300 shadow-xs shrink-0"
                >
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Template &amp; Thème Visuel
                  </span>
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[170px] sm:max-w-[240px] block">
                    {currentTemplate.name}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTemplatePickerOpen(!isTemplatePickerOpen)}
                className="px-2.5 py-1.5 bg-white/70 hover:bg-white text-slate-800 border border-white/80 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <span>Changer</span>
                {isTemplatePickerOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                )}
              </button>
            </div>

            {/* Template Chooser Drawer */}
            {isTemplatePickerOpen && (
              <div className="pt-3 border-t border-slate-200/80 grid grid-cols-1 gap-2 animate-in fade-in">
                {Object.values(MENU_TEMPLATES).map((tmpl) => {
                  const isSelected = tmpl.id === currentTemplateId;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        handleSelectTemplate(tmpl.id);
                        setIsTemplatePickerOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/80 text-blue-950 shadow-xs ring-1 ring-blue-400/40'
                          : 'border-white/60 bg-white/70 text-slate-700 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Swatch */}
                        <div
                          style={{
                            backgroundColor: tmpl.primaryColor,
                            borderColor: tmpl.accentColor,
                          }}
                          className="w-7 h-7 rounded-full border-2 shadow-xs shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-slate-900">{tmpl.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{tmpl.description}</p>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-[10px] uppercase font-bold text-blue-700 px-2 py-0.5 rounded bg-blue-100 shrink-0">
                          Actif
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Background Selector Quick Row */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md overflow-hidden border border-slate-300 shrink-0 shadow-xs">
                  <img
                    src={currentBg?.thumbnail || currentBg?.url}
                    alt="Fond"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs text-slate-600 truncate max-w-[150px]">
                  Fond : <span className="text-slate-900 font-semibold">{currentBg?.name}</span>
                </span>
              </div>

              <button
                onClick={onOpenBackgroundModal}
                className="px-2.5 py-1 bg-white/70 hover:bg-white text-slate-800 border border-white/80 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-all shadow-xs"
              >
                <ImageIcon className="w-3 h-3 text-blue-600" />
                Fonds ({backgrounds.length})
              </button>
            </div>

            {/* Background Opacity Manual Control */}
            <div className="pt-2.5 border-t border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Opacité de l&apos;image de fond
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-extrabold border border-blue-200">
                  {currentBgOpacity}%
                </span>
              </div>

              <div className="space-y-1">
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={currentBgOpacity}
                  onChange={(e) => handleOpacityChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-600 px-0.5">
                  <span>Subtil (20%)</span>
                  <span>Équilibré (60%)</span>
                  <span>Intense (100%)</span>
                </div>
              </div>

              {/* Presets & Apply all */}
              <div className="flex items-center gap-1 flex-wrap pt-1">
                {[
                  { label: '20%', val: 20 },
                  { label: '40%', val: 40 },
                  { label: '60%', val: 60 },
                  { label: '80%', val: 80 },
                  { label: '100%', val: 100 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => handleOpacityChange(preset.val)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      currentBgOpacity === preset.val
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}

                <label className="ml-auto flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-600 font-medium">
                  <input
                    type="checkbox"
                    checked={applyOpacityToAll}
                    onChange={(e) => setApplyOpacityToAll(e.target.checked)}
                    className="w-3 h-3 rounded border-slate-300 text-blue-600"
                  />
                  <span>Toute la semaine</span>
                </label>
              </div>
            </div>
          </div>

          {/* Typography & Fonts Customization Card */}
          <div className="p-4 bg-white/45 backdrop-blur-xs rounded-xl border border-white/60 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600 text-white shadow-xs shrink-0">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Typographie &amp; Tailles
                  </span>
                  <span className="text-xs font-bold text-slate-900 block">
                    Polices des plats, libellés &amp; allergènes
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {onOpenTypographyModal && (
                  <button
                    type="button"
                    onClick={() => onOpenTypographyModal('all')}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                    title="Ouvrir l'assistant typographie en grand écran"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Grand écran</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsTypographyOpen(!isTypographyOpen)}
                  className="px-2.5 py-1.5 bg-white/70 hover:bg-white text-slate-800 border border-white/80 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <span>{isTypographyOpen ? 'Fermer' : 'Aperçu'}</span>
                  {isTypographyOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Collapsible Typography Controls */}
            {isTypographyOpen && (
              <div className="pt-3 border-t border-slate-200/80 space-y-4 animate-in fade-in">
                {/* 1. Intitulé du plat */}
                <div className="p-3 bg-white/70 rounded-xl border border-slate-200/80 space-y-2.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Intitulé du Plat (Nom de la recette)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Police d&apos;écriture
                      </label>
                      <select
                        value={typography.dishTitleFont || 'sans'}
                        onChange={(e) =>
                          updateTypography({ dishTitleFont: e.target.value as TypographySettings['dishTitleFont'] })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:border-blue-500 shadow-2xs"
                      >
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Taille du texte
                      </label>
                      <select
                        value={typography.dishTitleSize || 'md'}
                        onChange={(e) =>
                          updateTypography({ dishTitleSize: e.target.value as TypographySettings['dishTitleSize'] })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:border-blue-500 shadow-2xs"
                      >
                        {DISH_TITLE_SIZE_OPTIONS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Plat 1, Plat 2 et libellés */}
                <div className="p-3 bg-white/70 rounded-xl border border-slate-200/80 space-y-2.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    Plat 1, Plat 2 et libellés
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Police d&apos;écriture
                      </label>
                      <select
                        value={typography.dishLabelFont || 'sans'}
                        onChange={(e) =>
                          updateTypography({ dishLabelFont: e.target.value as TypographySettings['dishLabelFont'] })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:border-blue-500 shadow-2xs"
                      >
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Taille du libellé
                      </label>
                      <select
                        value={typography.dishLabelSize || 'md'}
                        onChange={(e) =>
                          updateTypography({ dishLabelSize: e.target.value as TypographySettings['dishLabelSize'] })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:border-blue-500 shadow-2xs"
                      >
                        {DISH_LABEL_SIZE_OPTIONS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Allergènes */}
                <div className="p-3 bg-white/70 rounded-xl border border-slate-200/80 space-y-2.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Allergènes
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Police d&apos;écriture
                      </label>
                      <select
                        value={typography.allergenFont || 'sans'}
                        onChange={(e) =>
                          updateTypography({ allergenFont: e.target.value as TypographySettings['allergenFont'] })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:border-blue-500 shadow-2xs"
                      >
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Taille d&apos;affichage
                      </label>
                      <select
                        value={typography.allergenSize || 'md'}
                        onChange={(e) =>
                          updateTypography({ allergenSize: e.target.value as TypographySettings['allergenSize'] })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:border-blue-500 shadow-2xs"
                      >
                        {ALLERGEN_SIZE_OPTIONS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ----------------- COVER PAGE EDITOR ----------------- */}
        {isCover && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-4 bg-white/45 backdrop-blur-xs rounded-xl border border-white/60 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Paramètres de la Page de Garde
              </h3>

              {/* Brand Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom du Restaurant / Enseigne
                </label>
                <input
                  type="text"
                  value={menuData.cover.brandName}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateMenu((prev) => ({
                      ...prev,
                      cover: { ...prev.cover, brandName: val },
                    }));
                  }}
                  className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white font-semibold tracking-wider uppercase shadow-2xs"
                />
              </div>

              {/* Quick Week Selectors & Date Picker */}
              <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                    Sélection rapide de la semaine
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyQuickWeek(0)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                      title="Appliquer les dates de la semaine courante"
                    >
                      <span>Cette semaine</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyQuickWeek(1)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                      title="Appliquer les dates de la semaine prochaine"
                    >
                      <ArrowRight className="w-3 h-3 text-blue-600" />
                      <span>Semaine pro.</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-500 font-medium shrink-0">
                    Choisir sur calendrier :
                  </span>
                  <input
                    type="date"
                    value={currentMondayIso}
                    onChange={(e) => handleApplyCalendarDate(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 shadow-2xs cursor-pointer focus:outline-hidden focus:border-blue-500"
                    title="Choisir un jour pour synchroniser automatiquement la semaine du lundi au vendredi"
                  />
                </div>
              </div>

              {/* Date range fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Date de début (du...)
                    </label>
                    <span className="text-[10px] text-blue-600 font-medium">Lundi</span>
                  </div>
                  <input
                    type="text"
                    placeholder="ex: 31 Août ou 31/08"
                    value={menuData.cover.startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white font-medium shadow-2xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Date de fin (au...)
                    </label>
                    <span className="text-[10px] text-blue-600 font-medium">Vendredi</span>
                  </div>
                  <input
                    type="text"
                    placeholder="ex: 04 Septembre ou 04/09"
                    value={menuData.cover.endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white font-medium shadow-2xs"
                  />
                </div>
              </div>

              {/* Year / Extra */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Année (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="ex: 2026"
                  value={menuData.cover.year}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white shadow-2xs"
                />
              </div>

              {/* Chronological Synchronized Days Breakdown */}
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800">
                      Dates synchronisées sur les jours
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleForceResyncDates}
                    className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer bg-white/80 hover:bg-white px-2 py-0.5 rounded border border-blue-200 transition-colors shadow-2xs"
                    title="Recalculer les 5 jours de la semaine"
                  >
                    <RefreshCw className="w-3 h-3 text-blue-600" />
                    <span>Recalculer</span>
                  </button>
                </div>

                {/* Day badges */}
                <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                  {[
                    { label: 'Lun', name: 'Lundi', date: menuData.days.monday.dateFormatted },
                    { label: 'Mar', name: 'Mardi', date: menuData.days.tuesday.dateFormatted },
                    { label: 'Mer', name: 'Mercredi', date: menuData.days.wednesday.dateFormatted },
                    { label: 'Jeu', name: 'Jeudi', date: menuData.days.thursday.dateFormatted },
                    { label: 'Ven', name: 'Vendredi', date: menuData.days.friday.dateFormatted },
                  ].map((d) => (
                    <div
                      key={d.label}
                      className="bg-white rounded-lg p-1.5 border border-blue-100/90 text-center shadow-2xs"
                    >
                      <span className="block text-[10px] font-semibold text-slate-500 uppercase">
                        {d.label}
                      </span>
                      <span className="block text-xs font-bold text-slate-900 font-mono">
                        {d.date || '--/--'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-blue-100 text-[11px]">
                  <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSyncDates}
                      onChange={(e) => setAutoSyncDates(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 cursor-pointer"
                    />
                    <span>Synchronisation automatique active</span>
                  </label>
                  {dateSyncToast && (
                    <span className="text-emerald-700 font-semibold animate-in fade-in">
                      {dateSyncToast}
                    </span>
                  )}
                </div>
              </div>

              {/* Cover Date Size Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Taille d&apos;affichage de la date sur la page de garde
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {COVER_DATE_SIZE_OPTIONS.map((sz) => {
                    const isSelected = (menuData.cover.dateSize || 'md') === sz.id;
                    return (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() =>
                          onUpdateMenu((prev) => ({
                            ...prev,
                            cover: { ...prev.cover, dateSize: sz.id as 'md' | 'lg' | 'xl' | '2xl' },
                          }))
                        }
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
                        }`}
                      >
                        {sz.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cover layout information note */}
              <div className="pt-2 border-t border-slate-200/80 flex items-start gap-2 text-slate-600 text-xs">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  La page de garde met en valeur le titre de la semaine, les dates et l&apos;enseigne avec un style héraldique épuré.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- DAY PAGE EDITOR (Lundi to Vendredi) ----------------- */}
        {!isCover && currentDay && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Header: Date + Mode Toggle (Normal vs Férié/Fermé) + 2/3 Dishes Toggle */}
            <div className="p-4 bg-white/45 backdrop-blur-xs rounded-xl border border-white/60 space-y-3 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                {/* Date for the day */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date affichée pour {currentDay.dayName}
                  </label>
                  <input
                    type="text"
                    placeholder="ex: 31/08 ou 31 Août"
                    value={currentDay.dateFormatted}
                    onChange={(e) =>
                      updateDayData((prev) => ({ ...prev, dateFormatted: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white font-semibold shadow-2xs"
                  />
                </div>

                {/* Day status: Normal Menu vs Jour Férié / Fermé */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Statut de la journée
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-white/60 p-1 rounded-lg border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => updateDayData((prev) => ({ ...prev, isHoliday: false }))}
                      className={`py-1.5 px-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        !currentDay.isHoliday
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Menu servi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateDayData((prev) => ({
                          ...prev,
                          isHoliday: true,
                          holidayText: prev.holidayText || 'JOUR FÉRIÉ',
                          holidaySubtext:
                            prev.holidaySubtext ||
                            'Le restaurant est fermé ce jour. Nous aurons le plaisir de vous retrouver dès demain midi !',
                        }))
                      }
                      className={`py-1.5 px-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        currentDay.isHoliday
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <CalendarOff className="w-3.5 h-3.5" />
                      <span>Jour Férié / Fermé</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* When in normal menu mode, show 2 vs 3 dishes selector */}
              {!currentDay.isHoliday && (
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    Nombre de plats présentés :
                  </span>
                  <div className="inline-flex gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDishCount(2)}
                      className={`py-1 px-3 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        currentDay.dishCount === 2
                          ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      2 Plats
                    </button>
                    <button
                      type="button"
                      onClick={() => setDishCount(3)}
                      className={`py-1 px-3 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        currentDay.dishCount === 3
                          ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      3 Plats
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Holiday Configuration Panel */}
            {currentDay.isHoliday ? (
              <div className="p-5 bg-gradient-to-br from-amber-50/80 to-white/70 backdrop-blur-xs rounded-2xl border border-amber-200/80 space-y-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shadow-2xs shrink-0">
                    <CalendarOff className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Journée sans menu pour {currentDay.dayName}
                    </h4>
                    <p className="text-xs text-slate-600">
                      Un visuel officiel de fermeture élégant est automatiquement généré pour ce jour
                    </p>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Modèles rapides d&apos;intitulé :
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'JOUR FÉRIÉ',
                      'FERMETURE EXCEPTIONNELLE',
                      'PONT DU 1ER MAI',
                      'PONT DE L’ASCENSION',
                      '14 JUILLET',
                      'FERMETURE ANNUELLE',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          updateDayData((prev) => ({ ...prev, holidayText: preset }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          (currentDay.holidayText || 'JOUR FÉRIÉ') === preset
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-white/80 hover:bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Holiday Title Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Titre affiché au centre du visuel
                  </label>
                  <input
                    type="text"
                    value={currentDay.holidayText || 'JOUR FÉRIÉ'}
                    onChange={(e) =>
                      updateDayData((prev) => ({ ...prev, holidayText: e.target.value }))
                    }
                    placeholder="ex: JOUR FÉRIÉ"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:border-amber-500 shadow-2xs uppercase"
                  />
                </div>

                {/* Holiday Subtext Message */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Message d&apos;information aux convives
                  </label>
                  <textarea
                    rows={2}
                    value={
                      currentDay.holidaySubtext !== undefined
                        ? currentDay.holidaySubtext
                        : 'Le restaurant est fermé ce jour. Nous aurons le plaisir de vous retrouver dès demain midi !'
                    }
                    onChange={(e) =>
                      updateDayData((prev) => ({ ...prev, holidaySubtext: e.target.value }))
                    }
                    placeholder="Message d'information..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-amber-500 shadow-2xs resize-none"
                  />
                </div>
              </div>
            ) : (
              /* Normal Dishes list */
              <div className="space-y-3">
                {/* Visual helper banner for typography */}
                <div className="p-2.5 bg-blue-50/90 border border-blue-200/90 rounded-xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2 text-xs text-blue-950 font-semibold">
                    <Type className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Ajuster les polices &amp; tailles des plats, libellés ou allergènes :</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenTypographyModal ? onOpenTypographyModal('all') : setIsTypographyOpen(true)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Type className="w-3 h-3" />
                    <span>Polices &amp; Tailles</span>
                  </button>
                </div>

                {currentDay.dishes.slice(0, currentDay.dishCount).map((dish, idx) => (
                <div
                  key={dish.id || idx}
                  className="p-4 bg-white/50 backdrop-blur-xs border border-white/70 rounded-xl space-y-3 relative group shadow-xs"
                >
                  {/* Dish header badge & Actions */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <label className="text-[11px] font-bold text-slate-700">Libellé :</label>
                      <input
                        type="text"
                        value={dish.label !== undefined ? dish.label : `Plat ${idx + 1}`}
                        onChange={(e) => updateDish(idx, { label: e.target.value })}
                        placeholder={`Plat ${idx + 1}`}
                        className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-blue-900 focus:outline-hidden focus:border-blue-500 max-w-[130px] shadow-2xs"
                        title="Personnaliser le libellé (ex: Plat 1, Entrée, Plat du Chef, Dessert...)"
                      />
                      <button
                        type="button"
                        onClick={() => onOpenTypographyModal ? onOpenTypographyModal('dishLabel') : setIsTypographyOpen(true)}
                        className="text-[10px] text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Modifier la police ou taille des libellés (Plat 1, Plat 2...)"
                      >
                        <Type className="w-2.5 h-2.5 text-blue-600" />
                        <span>Police/Taille</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenTypographyModal ? onOpenTypographyModal('labelPosition') : setIsTypographyOpen(true)}
                        className="text-[10px] text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Régler la position X / Y du libellé sur le visuel"
                      >
                        <Sliders className="w-2.5 h-2.5 text-indigo-600" />
                        <span>Position X/Y</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Direct File Upload button for dish */}
                      <label
                        className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                        title="Importer directement une photo depuis votre appareil"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Importer</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleDirectDishFilePicked(e.target.files[0], idx);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>

                      {dish.imageUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setDishCropperTarget({
                                dishIndex: idx,
                                imageSrc: dish.imageUrl,
                                dishName: dish.name || `Plat ${idx + 1}`,
                              })
                            }
                            className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 cursor-pointer"
                            title="Recadrer l'assiette en cercle"
                          >
                            <Crop className="w-3 h-3" />
                            <span>Recadrer</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateDish(idx, { imageUrl: undefined })}
                            className="text-[11px] text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50 cursor-pointer"
                            title="Retirer la photo du plat"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenPhotoModal(idx)}
                        className="text-xs text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200/90 font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer transition-all shadow-2xs"
                        title="Choisir une photo dans votre bibliothèque pour ce plat"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>Galerie Photos</span>
                      </button>
                    </div>
                  </div>

                  {/* Dish Name Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Intitulé du plat
                      </label>
                      <button
                        type="button"
                        onClick={() => onOpenTypographyModal ? onOpenTypographyModal('dishTitle') : setIsTypographyOpen(true)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Changer la police ou la taille de l'intitulé du plat"
                      >
                        <Type className="w-3 h-3" />
                        <span>Police &amp; Taille</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={dish.name}
                      onChange={(e) => updateDish(idx, { name: e.target.value })}
                      placeholder="ex: Pavé de saumon rôti, tombée d'épinards..."
                      className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white font-medium leading-relaxed resize-none shadow-2xs"
                    />
                  </div>

                    {/* Photo & Options row */}
                    <div className="flex flex-col sm:flex-row items-start gap-4 pt-1">
                      {/* Photo thumbnail with deep 3D drop shadow preview */}
                      <div className="relative group/thumb shrink-0 self-center sm:self-start">
                        <div
                          style={{
                            background: 'radial-gradient(circle, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 70%)',
                          }}
                          className="absolute w-16 h-16 rounded-full blur-[4px] translate-y-2 pointer-events-none opacity-80"
                        />
                        <div
                          onClick={() => onOpenPhotoModal(idx)}
                          style={{
                            boxShadow:
                              '0 12px 22px -3px rgba(0, 0, 0, 0.35), 0 6px 10px -2px rgba(0, 0, 0, 0.20), inset 0 2px 3px rgba(255, 255, 255, 0.75)',
                          }}
                          className="relative w-18 h-18 rounded-full overflow-hidden border-[3px] border-white ring-1 ring-slate-300 hover:ring-blue-500 cursor-pointer bg-white transition-all z-10"
                          title={dish.imageUrl ? 'Cliquer pour changer la photo depuis la galerie' : 'Choisir une photo dans la galerie'}
                        >
                          {dish.imageUrl ? (
                            <img
                              src={dish.imageUrl}
                              alt={dish.name}
                              className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 flex flex-col items-center justify-center transition-opacity text-[9px] text-white font-bold gap-0.5">
                            <ImageIcon className="w-4 h-4 mb-0.5" />
                            <span>{dish.imageUrl ? 'Changer' : 'Choisir'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Allergen selector + Badges System */}
                      <div className="flex-1 w-full space-y-3">
                        {/* Allergens Button */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-semibold text-slate-700">
                              Allergènes :
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onOpenTypographyModal ? onOpenTypographyModal('allergen') : setIsTypographyOpen(true)}
                                className="text-[10px] text-slate-600 hover:text-blue-700 font-medium flex items-center gap-0.5 cursor-pointer transition-colors"
                                title="Changer la taille des pastilles allergènes"
                              >
                                <Type className="w-2.5 h-2.5 text-blue-600" />
                                <span>Taille pastilles</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenAllergenModal(idx)}
                                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                              >
                                Modifier ({dish.allergens.length})
                              </button>
                            </div>
                          </div>

                          {/* Allergen preview pills */}
                          <div
                            onClick={() => onOpenAllergenModal(idx)}
                            className="p-1.5 bg-white/80 rounded-lg border border-slate-300 cursor-pointer hover:border-blue-400 flex items-center min-h-[30px] shadow-2xs transition-all"
                          >
                            {dish.allergens && dish.allergens.length > 0 ? (
                              <AllergenBadge
                                allergens={dish.allergens}
                                customText={dish.customAllergenText}
                                size={typography.allergenSize || 'sm'}
                                showLabel={false}
                                allergensList={allergensList}
                                fontClass={getFontFamilyClass(typography.allergenFont)}
                              />
                            ) : (
                              <span className="text-[10px] text-slate-400 italic pl-1">
                                Aucun allergène sélectionné (cliquez pour choisir)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Badges System (Meat origins & Dietary preferences) */}
                        <div className="space-y-2 pt-1.5 border-t border-slate-200/60">
                          {/* 1. Viandes Françaises */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                                <span className="inline-flex overflow-hidden rounded-[1.5px] border border-slate-300 w-3 h-3.5 shrink-0 shadow-2xs">
                                  <span className="w-1/3 h-full bg-[#002654]" />
                                  <span className="w-1/3 h-full bg-white" />
                                  <span className="w-1/3 h-full bg-[#ED2939]" />
                                </span>
                                Viandes Françaises :
                              </span>
                              {((Array.isArray(dish.badges) && dish.badges.length > 0) || (!Array.isArray(dish.badges) && dish.showFrenchMeat)) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateDish(idx, { badges: [], showFrenchMeat: false })
                                  }
                                  className="text-[10px] text-slate-400 hover:text-red-600 font-semibold cursor-pointer"
                                >
                                  Effacer tout
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              {DEFAULT_BADGES.filter((b) => ['vbf', 'pf', 'vof', 'vaf', 'vvf', 'vf'].includes(b.id)).map((badge) => {
                                const activeDishBadges = Array.isArray(dish.badges)
                                  ? dish.badges.map((b) => (b === 'viande-francaise' ? 'vf' : b))
                                  : (dish.showFrenchMeat ? [getDishInitialMeatBadge(dish.name)] : []);
                                const isSelected = activeDishBadges.includes(badge.id);
                                return (
                                  <button
                                    key={badge.id}
                                    type="button"
                                    onClick={() => toggleDishBadge(idx, badge.id)}
                                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer select-none shadow-2xs ${
                                      isSelected
                                        ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300/50'
                                        : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                                    }`}
                                    title={badge.fullName || badge.label}
                                  >
                                    <div className="flex overflow-hidden rounded-[1.5px] border border-slate-300/80 w-2 h-2.5 shrink-0">
                                      <div className="w-1/3 h-full bg-[#002654]" />
                                      <div className="w-1/3 h-full bg-white" />
                                      <div className="w-1/3 h-full bg-[#ED2939]" />
                                    </div>
                                    <span>{badge.label}</span>
                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 2. Régimes & Préférences (Végétarien, Végan) */}
                          <div>
                            <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                              <Leaf className="w-3 h-3 text-emerald-600" />
                              Régimes &amp; Préférences :
                            </span>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              {DEFAULT_BADGES.filter((b) => ['vegetarien', 'vegan'].includes(b.id)).map((badge) => {
                                const activeDishBadges = Array.isArray(dish.badges)
                                  ? dish.badges
                                  : [];
                                const isSelected = activeDishBadges.includes(badge.id);
                                return (
                                  <button
                                    key={badge.id}
                                    type="button"
                                    onClick={() => toggleDishBadge(idx, badge.id)}
                                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer select-none shadow-2xs ${
                                      isSelected
                                        ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300/50'
                                        : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                                    }`}
                                    title={badge.fullName || badge.label}
                                  >
                                    {badge.id === 'vegetarien' ? (
                                      <Leaf className="w-3 h-3" />
                                    ) : (
                                      <Sprout className="w-3 h-3" />
                                    )}
                                    <span>{badge.label}</span>
                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 3. Custom badges if any and addition field */}
                          {Array.isArray(dish.badges) && dish.badges.some((b) => !DEFAULT_BADGES.some((db) => db.id === b)) && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              {dish.badges
                                .filter((b) => !DEFAULT_BADGES.some((db) => db.id === b))
                                .map((customBadge) => (
                                  <span
                                    key={customBadge}
                                    className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold flex items-center gap-1"
                                  >
                                    <span>{customBadge}</span>
                                    <button
                                      type="button"
                                      onClick={() => toggleDishBadge(idx, customBadge)}
                                      className="text-amber-700 hover:text-red-700 cursor-pointer"
                                      title="Supprimer ce badge"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </span>
                                ))}
                            </div>
                          )}

                          {/* Quick custom badge adder */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <input
                              type="text"
                              value={newCustomBadgeText[idx] || ''}
                              onChange={(e) =>
                                setNewCustomBadgeText((prev) => ({ ...prev, [idx]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomBadge(idx);
                                }
                              }}
                              placeholder="+ Ajouter un badge personnalisé..."
                              className="px-2 py-1 bg-white/80 border border-slate-300 rounded-md text-[11px] text-slate-800 focus:outline-hidden focus:border-blue-500 w-full max-w-[200px]"
                            />
                            {(newCustomBadgeText[idx] || '').trim() && (
                              <button
                                type="button"
                                onClick={() => handleAddCustomBadge(idx)}
                                className="px-2 py-1 bg-slate-800 text-white rounded-md text-[11px] font-bold hover:bg-black cursor-pointer"
                              >
                                Ajouter
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>

      {/* Footer Helper Actions */}
      <div className="px-4 py-3 bg-white/50 border-t border-white/60 flex items-center justify-between text-xs text-slate-600">
        <button
          onClick={onLoadExampleMenu}
          className="text-amber-700 hover:text-amber-900 flex items-center gap-1.5 font-bold transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Remplir avec le menu du Chef
        </button>

        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
          <Info className="w-3.5 h-3.5" />
          <span>Sauvegardé automatiquement</span>
        </div>
      </div>

      {/* Hidden file input for direct dish image import */}
      <input
        type="file"
        ref={dishDirectFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0] && directUploadIndex !== null) {
            handleDirectDishFilePicked(e.target.files[0], directUploadIndex);
            e.target.value = '';
          }
        }}
      />

      {/* Dish In-place Image Cropper Modal */}
      <ImageCropModal
        isOpen={!!dishCropperTarget}
        imageSrc={dishCropperTarget?.imageSrc || null}
        title={dishCropperTarget ? `Cadrer l'assiette : ${dishCropperTarget.dishName}` : 'Cadrage Circulaire de l’Assiette'}
        onClose={() => setDishCropperTarget(null)}
        onConfirmCrop={handleDishCropConfirmed}
      />
    </div>
  );
};

