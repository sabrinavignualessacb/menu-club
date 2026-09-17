import React, { useRef, useState, useEffect } from 'react';
import { AllergenDef, BackgroundItem, DayMenu, MenuTemplateId, TypographySettings } from '../types';
import { AllergenBadge } from './AllergenBadge';
import { BadgesList } from './BadgeRenderer';
import { UtensilsCrossed, CalendarOff, Sparkles } from 'lucide-react';
import { MENU_TEMPLATES } from '../data/templates';
import {
  getFontFamilyClass,
  getDishLabelSizeClass,
  getUniformDishTitleStyle,
} from '../utils/typography';

interface DayVisualCardProps {
  dayMenu: DayMenu;
  backgrounds: BackgroundItem[];
  templateId?: MenuTemplateId;
  backgroundOpacity?: number;
  allergensList?: AllergenDef[];
  typography?: TypographySettings;
  id?: string;
  isExporting?: boolean;
  onOpenPhotoModal?: (dishIndex: number) => void;
}

export const DayVisualCard: React.FC<DayVisualCardProps> = ({
  dayMenu,
  backgrounds,
  templateId = 'classic-navy',
  backgroundOpacity,
  allergensList,
  typography,
  id = 'day-visual-card',
  isExporting = false,
  onOpenPhotoModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const template = MENU_TEMPLATES[templateId] || MENU_TEMPLATES['classic-navy'];

  // Resolve background opacity (day-specific override > global menu opacity > default 70)
  const resolvedBgOpacity =
    dayMenu.backgroundOpacity !== undefined
      ? dayMenu.backgroundOpacity
      : backgroundOpacity !== undefined
      ? backgroundOpacity
      : 70;

  // Auto-scale to ensure 100% pixel-perfect layout at any display size (thumbnails, editor, 1080px export)
  useEffect(() => {
    if (isExporting) {
      setScale(1.5); // 720px base -> 1080px export canvas
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const w = el.clientWidth;
      if (w > 0) {
        setScale(w / 720);
      }
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isExporting]);

  // Resolve background image
  const activeBg =
    dayMenu.customBackgroundUrl ||
    backgrounds.find((b) => b.id === dayMenu.backgroundId)?.url ||
    backgrounds[0]?.url;

  const dishCount = dayMenu.dishCount;
  const dishes = dayMenu.dishes.slice(0, dishCount);

  // Helper to parse date into stacked day (DD) and month (MM) parts like "31" over "08"
  const parseDateParts = (dateStr?: string) => {
    if (!dateStr) return null;
    const trimmed = dateStr.trim();
    if (!trimmed) return null;

    // Matches DD/MM, DD.MM, DD-MM, DD MM
    const match = trimmed.match(/^(\d{1,2})[\/\.\-\s](\d{1,2}|[a-zA-ZÀ-ÿ]+)$/);
    if (match) {
      const d = match[1].padStart(2, '0');
      let m = match[2];
      if (/^\d+$/.test(m)) {
        m = m.padStart(2, '0');
      } else {
        const monthMap: Record<string, string> = {
          janv: '01', janvier: '01',
          fev: '02', 'fév': '02', 'février': '02', fevrier: '02',
          mars: '03',
          avr: '04', avril: '04',
          mai: '05',
          juin: '06',
          juil: '07', juillet: '07',
          aout: '08', 'août': '08',
          sept: '09', septembre: '09',
          oct: '10', octobre: '10',
          nov: '11', novembre: '11',
          dec: '12', 'déc': '12', 'décembre': '12', decembre: '12',
        };
        const clean = m.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        m = monthMap[m.toLowerCase()] || monthMap[clean] || m.slice(0, 2);
      }
      return { dayPart: d, monthPart: m };
    }

    if (/^\d{4}$/.test(trimmed)) {
      return { dayPart: trimmed.slice(0, 2), monthPart: trimmed.slice(2, 4) };
    }

    if (/^\d{1,2}$/.test(trimmed)) {
      return { dayPart: trimmed.padStart(2, '0'), monthPart: '' };
    }

    const parts = trimmed.split(/[\/\.\-\s]+/);
    if (parts.length >= 2) {
      return {
        dayPart: parts[0].padStart(2, '0'),
        monthPart: /^\d+$/.test(parts[1]) ? parts[1].padStart(2, '0') : parts[1].slice(0, 2),
      };
    }

    return { dayPart: trimmed, monthPart: '' };
  };

  const dateParts = parseDateParts(dayMenu.dateFormatted);
  const formattedDayName = dayMenu.dayName
    ? dayMenu.dayName.trim().toUpperCase()
    : '';

  return (
    <div
      ref={containerRef}
      id={id}
      data-visual-card="true"
      className="relative w-full aspect-square overflow-hidden bg-white select-none shadow-2xl"
    >
      {/* Scaled Canvas Container: Fixed 720x720 base canvas proportionally scaled */}
      <div
        className="absolute top-0 left-0 w-[720px] h-[720px] origin-top-left flex items-center justify-center pointer-events-none bg-white"
        style={{
          transform: `scale(${scale})`,
          width: '720px',
          height: '720px',
        }}
      >
        {/* Clean white backdrop behind the menu card */}
        <div className="absolute inset-0 bg-white" />

        {/* 2. Main Menu Card Container - with selectable background image & template overlay */}
        <div
          className={`relative w-[670px] h-[670px] shadow-2xl flex flex-col justify-between p-7 rounded-tl-[48px] rounded-tr-2xl rounded-br-2xl rounded-bl-2xl overflow-hidden ring-1 ring-black/5`}
        >
          {/* Base pure white card surface */}
          <div className="absolute inset-0 bg-white" />

          {/* Card Custom / Selected Background Image with user-adjustable opacity */}
          {activeBg && (
            <div
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-300"
              style={{
                backgroundImage: `url(${activeBg})`,
                opacity: resolvedBgOpacity / 100,
              }}
            />
          )}

          {/* Consistent subtle theme tint overlay - preserved across all themes */}
          <div
            className={`absolute inset-0 bg-gradient-to-b ${template.cardBgGradient} opacity-20 pointer-events-none`}
          />

          {/* Outer Border with decorative top-left rounded corner */}
          <div
            style={{ borderColor: template.borderColor }}
            className="absolute inset-3.5 border-[2.5px] pointer-events-none rounded-tl-[38px] rounded-tr-xl rounded-br-xl rounded-bl-xl z-10"
          >
            {/* Subtle inner decorative corner accents */}
            <div
              style={{ borderColor: `${template.borderColor}66` }}
              className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2"
            />
            <div
              style={{ borderColor: `${template.borderColor}66` }}
              className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2"
            />
            <div
              style={{ borderColor: `${template.borderColor}66` }}
              className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2"
            />
          </div>

          {/* 3. Header Section */}
          <header className="relative z-10 pt-1 px-4 flex flex-col">
            {/* Top Brand Bar */}
            <div
              style={{ borderColor: `${template.borderColor}25` }}
              className="flex items-center justify-center border-b pb-2 mb-2"
            >
              <div className="flex items-center gap-2">
                <div
                  style={{ backgroundColor: template.crestBg, color: template.crestIconColor }}
                  className="w-5 h-5 rounded-full flex items-center justify-center shadow-xs"
                >
                  <UtensilsCrossed className="w-3 h-3" />
                </div>
                <span
                  style={{ color: template.primaryColor }}
                  className="font-sans-clean text-xs font-extrabold tracking-[0.25em] uppercase"
                >
                  Chef&apos;s Club
                </span>
              </div>
            </div>

            {/* Day Title & Date (Prominent 45px Day Name + Matching Date in #001489) */}
            <div className="flex items-center justify-center gap-3.5 mt-1 select-none">
              <h1
                style={{ color: '#001489' }}
                className="font-sans-clean font-extrabold text-[45px] leading-none tracking-tight drop-shadow-2xs uppercase"
              >
                {formattedDayName}
              </h1>

              {dateParts && (
                <div
                  style={{ color: '#001489' }}
                  className="flex flex-col justify-center items-start font-sans-clean select-none tracking-tight pl-2 border-l-2 border-[#001489]/25"
                >
                  <span className="tabular-nums font-extrabold text-[22px] leading-none">
                    {dateParts.dayPart}
                  </span>
                  {dateParts.monthPart ? (
                    <span className="tabular-nums font-extrabold text-[22px] leading-none text-[#001489] uppercase tracking-wide mt-1">
                      {dateParts.monthPart}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </header>

          {/* 4. Content Section: Holiday view OR Dishes grid */}
          {dayMenu.isHoliday ? (
            <main className="relative z-10 flex-1 my-auto px-6 flex flex-col items-center justify-center text-center">
              <div className="w-full max-w-[560px] py-9 px-8 bg-white/55 backdrop-blur-md rounded-3xl border border-white/70 shadow-xl flex flex-col items-center justify-center space-y-5">
                {/* Crest / Emblem */}
                <div
                  style={{
                    backgroundColor: template.crestBg,
                    color: template.crestIconColor,
                    boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.25)',
                  }}
                  className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-white ring-4 ring-black/5"
                >
                  <CalendarOff className="w-10 h-10" />
                </div>

                {/* Holiday Main Title */}
                <div className="space-y-2">
                  <span className="inline-block px-4 py-1 rounded-full bg-[#001489]/10 text-[#001489] font-sans-clean font-extrabold text-xs uppercase tracking-[0.2em] border border-[#001489]/20">
                    Fermeture Exceptionnelle
                  </span>
                  <h2
                    style={{ color: '#001489' }}
                    className="font-sans-clean font-extrabold text-[34px] leading-tight tracking-tight uppercase whitespace-pre-line"
                  >
                    {dayMenu.holidayText || 'JOUR FÉRIÉ'}
                  </h2>
                </div>

                {/* Subtle Divider Ornament */}
                <div className="flex items-center justify-center gap-3 w-40">
                  <div className="h-0.5 flex-1 bg-[#001489]/25" />
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <div className="h-0.5 flex-1 bg-[#001489]/25" />
                </div>

                {/* Subtext Message */}
                <p className="font-sans-clean text-base font-semibold text-slate-700 max-w-[460px] leading-relaxed whitespace-pre-line">
                  {dayMenu.holidaySubtext ||
                    'Le restaurant est fermé ce jour. Nous aurons le plaisir de vous retrouver dès demain midi !'}
                </p>
              </div>
            </main>
          ) : (
            <main className="relative z-10 flex-1 my-auto px-1 flex items-center justify-center">
              <div
                className={`w-full h-full relative grid ${
                  dishCount === 2 ? 'grid-cols-2' : 'grid-cols-3'
                } items-center`}
              >
                {/* Dedicated Divider Lines - mathematically centered between grid columns */}
                {dishCount === 2 && (
                  <div
                    style={{
                      left: '50%',
                      background: `linear-gradient(to bottom, transparent, ${template.borderColor}35 8%, ${template.borderColor}35 92%, transparent)`,
                    }}
                    className="absolute top-1 bottom-1 -translate-x-1/2 w-px pointer-events-none z-0"
                  />
                )}
                {dishCount === 3 && (
                  <>
                    <div
                      style={{
                        left: 'calc(100% / 3)',
                        background: `linear-gradient(to bottom, transparent, ${template.borderColor}35 8%, ${template.borderColor}35 92%, transparent)`,
                      }}
                      className="absolute top-1 bottom-1 -translate-x-1/2 w-px pointer-events-none z-0"
                    />
                    <div
                      style={{
                        left: 'calc(200% / 3)',
                        background: `linear-gradient(to bottom, transparent, ${template.borderColor}35 8%, ${template.borderColor}35 92%, transparent)`,
                      }}
                      className="absolute top-1 bottom-1 -translate-x-1/2 w-px pointer-events-none z-0"
                    />
                  </>
                )}

                {(() => {
                  // Compute strictly uniform title styling across ALL dishes in this card
                  const uniformTitleStyle = getUniformDishTitleStyle(
                    dishes,
                    typography?.dishTitleSize,
                    typography?.dishTitleScale || 100,
                    dishCount
                  );

                  return dishes.map((dish, index) => {
                    const plateSize = dishCount === 3 ? 116 : 128;
                    const ringSize = dishCount === 3 ? 124 : 138;

                    const dishLabelFontClass = getFontFamilyClass(typography?.dishLabelFont, 'font-sans-clean');
                    const dishLabelSizeClass = getDishLabelSizeClass(typography?.dishLabelSize);
                    const dishTitleFontClass = getFontFamilyClass(typography?.dishTitleFont, 'font-sans-clean');
                    const allergenFontClass = getFontFamilyClass(typography?.allergenFont, 'font-sans-clean');
                    const allergenSize = typography?.allergenSize || 'md';

                    // Dynamic color resolution for Plat 1, Plat 2, and Autres
                    let defaultDishTitleColor = '#001489';
                    let defaultDishLabelColor = '#94a3b8';
                    if (index === 0) {
                      defaultDishTitleColor = typography?.dish1Color || '#001489';
                      defaultDishLabelColor = typography?.dish1LabelColor || typography?.dishLabelColor || '#94a3b8';
                    } else if (index === 1) {
                      defaultDishTitleColor = typography?.dish2Color || '#001489';
                      defaultDishLabelColor = typography?.dish2LabelColor || typography?.dishLabelColor || '#94a3b8';
                    } else {
                      defaultDishTitleColor = typography?.dishOtherColor || '#001489';
                      defaultDishLabelColor = typography?.dishOtherLabelColor || typography?.dishLabelColor || '#94a3b8';
                    }

                    const resolvedDishTitleColor = dish.titleColor || defaultDishTitleColor;
                    const resolvedDishLabelColor = dish.labelColor || defaultDishLabelColor;

                    // Adjustable Plate Circle Border Thickness & Color (default refined 1.5px)
                    const plateBorderWidth = typography?.plateBorderWidth !== undefined ? typography.plateBorderWidth : 1.5;
                    const plateBorderColor = typography?.plateBorderColor || '#ffffff';

                    // User-adjustable X and Y position offsets for labels
                    const globalOffsetX = typography?.dishLabelOffsetX || 0;
                    const globalOffsetY = typography?.dishLabelOffsetY || 0;
                    const specificOffsetX =
                      index === 0
                        ? typography?.dish1LabelOffsetX || 0
                        : index === 1
                        ? typography?.dish2LabelOffsetX || 0
                        : typography?.dish3LabelOffsetX || 0;
                    const specificOffsetY =
                      index === 0
                        ? typography?.dish1LabelOffsetY || 0
                        : index === 1
                        ? typography?.dish2LabelOffsetY || 0
                        : typography?.dish3LabelOffsetY || 0;

                    const totalOffsetX = (dish.labelOffsetX || 0) + specificOffsetX + globalOffsetX;
                    const totalOffsetY = (dish.labelOffsetY || 0) + specificOffsetY + globalOffsetY;

                    return (
                      <div
                        key={dish.id || index}
                        className={`relative h-full flex flex-col justify-center items-center text-center py-1 z-10 ${
                          dishCount === 2 ? 'px-4' : 'px-2.5'
                        }`}
                      >
                        {/* Centered Column Content with distinct, non-overlapping rows */}
                        <div className="w-full flex flex-col items-center justify-center my-auto">
                          {/* Row 1: Dish Number Label with customizable X/Y positioning */}
                          <div
                            style={{
                              transform: `translate(${totalOffsetX}px, ${totalOffsetY}px)`,
                            }}
                            className="h-7 flex items-center justify-center w-full mb-1 shrink-0 transition-transform"
                          >
                            <span
                              style={{ color: resolvedDishLabelColor }}
                              className={`${dishLabelFontClass} ${dishLabelSizeClass} font-bold uppercase tracking-wide text-center block w-full leading-none transition-colors`}
                            >
                              {dish.label && dish.label !== 'Plat 3' ? dish.label : (index === 2 ? 'Autres' : `Plat ${index + 1}`)}
                            </span>
                          </div>

                          {/* Row 2: Dish Name (STRICTLY UNIFORM font size across all dish slots, anti-overflow clamp) */}
                          <div className="h-[88px] flex items-center justify-center w-full text-center px-1 mb-1 overflow-hidden shrink-0">
                            <h3
                              style={{
                                ...uniformTitleStyle,
                                color: resolvedDishTitleColor,
                              }}
                              className={`${dishTitleFontClass} font-extrabold text-center w-full break-words tracking-tight whitespace-pre-line line-clamp-3 transition-colors`}
                            >
                              {dish.name || 'Nom du plat à renseigner'}
                            </h3>
                          </div>

                          {/* Row 3: Dedicated Allergens Row (Safe bounds to prevent collision) */}
                          <div className="h-[28px] flex items-center justify-center w-full text-center mb-1 overflow-hidden shrink-0">
                            <AllergenBadge
                              allergens={dish.allergens}
                              customText={dish.customAllergenText}
                              size={dishCount === 3 ? 'sm' : allergenSize}
                              showLabel={dishCount === 2}
                              allergensList={allergensList}
                              fontClass={allergenFontClass}
                            />
                          </div>

                          {/* Row 4: Dedicated Badges Row (Single-line French Meat Badges VBF, VPF, VF...) */}
                          <div className="h-[24px] flex items-center justify-center w-full text-center mb-1.5 overflow-hidden shrink-0">
                            <BadgesList
                              badges={dish.badges}
                              dishName={dish.name}
                              showFrenchMeat={dish.showFrenchMeat}
                              size={dishCount === 3 ? 'sm' : 'md'}
                            />
                          </div>

                          {/* Row 5: Circular Cutout Plate Top View (Sized cleanly to avoid overlapping) */}
                          <div className="h-[144px] flex items-center justify-center relative shrink-0 w-full">
                            {/* Layer 1: Ambient Contact Floor Shadow for dramatic depth */}
                            <div
                              style={{
                                width: `${plateSize - 8}px`,
                                height: `${plateSize - 8}px`,
                                background: 'radial-gradient(circle, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.30) 50%, rgba(0,0,0,0) 75%)',
                              }}
                              className="absolute rounded-full blur-[7px] translate-y-3 pointer-events-none opacity-90"
                            />

                            {/* Layer 2: Elevated Porcelain Plate with customizable fine border thickness */}
                            <div
                              style={{
                                width: `${plateSize}px`,
                                height: `${plateSize}px`,
                                minWidth: `${plateSize}px`,
                                minHeight: `${plateSize}px`,
                                border: plateBorderWidth > 0 ? `${plateBorderWidth}px solid ${plateBorderColor}` : 'none',
                                boxShadow:
                                  '0 18px 30px -4px rgba(0, 0, 0, 0.45), 0 8px 14px -2px rgba(0, 0, 0, 0.30), 0 3px 6px -1px rgba(0, 0, 0, 0.20), inset 0 2px 4px rgba(255, 255, 255, 0.75), inset 0 -2px 4px rgba(0, 0, 0, 0.20)',
                              }}
                              className={`relative rounded-full overflow-hidden ring-1 ring-black/15 bg-white flex items-center justify-center mx-auto transition-all z-10 ${
                                !isExporting && onOpenPhotoModal ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 group/plate' : ''
                              }`}
                              onClick={() => {
                                if (!isExporting && onOpenPhotoModal) {
                                  onOpenPhotoModal(index);
                                }
                              }}
                              title={!isExporting && onOpenPhotoModal ? `Cliquer pour choisir la photo pour ${index === 2 ? 'Autres' : `Plat ${index + 1}`}` : undefined}
                            >
                              {dish.imageUrl ? (
                                <img
                                  src={dish.imageUrl}
                                  alt={dish.name}
                                  crossOrigin="anonymous"
                                  className="w-full h-full object-cover object-center"
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-2 text-slate-400">
                                  <UtensilsCrossed
                                    style={{ color: template.primaryColor }}
                                    className="w-7 h-7 mb-1 opacity-40"
                                  />
                                  <span className="text-[10px] font-semibold text-slate-500">Assiette</span>
                                </div>
                              )}

                              {!isExporting && onOpenPhotoModal && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/plate:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold">
                                  <span>{dish.imageUrl ? 'Changer' : 'Ajouter'}</span>
                                </div>
                              )}
                            </div>

                            {/* Subtle decorative ring accent matching template accent */}
                            <div
                              style={{
                                width: `${ringSize}px`,
                                height: `${ringSize}px`,
                                borderColor: `${template.accentColor}55`,
                              }}
                              className="absolute rounded-full border pointer-events-none z-0"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </main>
          )}

          {/* 5. Footer Mention */}
          <footer
            style={{ borderColor: `${template.borderColor}15` }}
            className="relative z-10 pt-2 pb-0.5 px-4 flex items-center justify-center border-t"
          >
            <p className="font-serif-title italic text-xs text-slate-500 text-center tracking-wide">
              Photos non contractuelles
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};


