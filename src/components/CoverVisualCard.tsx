import React, { useRef, useState, useEffect } from 'react';
import { BackgroundItem, CoverPageData, MenuTemplateId } from '../types';
import { UtensilsCrossed, ChefHat, Sparkles, Calendar } from 'lucide-react';
import { MENU_TEMPLATES } from '../data/templates';

interface CoverVisualCardProps {
  coverData: CoverPageData;
  backgrounds: BackgroundItem[];
  templateId?: MenuTemplateId;
  backgroundOpacity?: number;
  id?: string;
  isExporting?: boolean;
}

export const CoverVisualCard: React.FC<CoverVisualCardProps> = ({
  coverData,
  backgrounds,
  templateId = 'classic-navy',
  backgroundOpacity,
  id = 'cover-visual-card',
  isExporting = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(isExporting ? 1.5 : 1);

  const template = MENU_TEMPLATES[templateId] || MENU_TEMPLATES['classic-navy'];

  // Resolve background opacity (cover-specific override > global menu opacity > default 70)
  const resolvedBgOpacity =
    coverData.backgroundOpacity !== undefined
      ? coverData.backgroundOpacity
      : backgroundOpacity !== undefined
      ? backgroundOpacity
      : 70;

  // Auto-scale to ensure 100% pixel-perfect layout at any display size
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

  const activeBg =
    coverData.customBackgroundUrl ||
    backgrounds.find((b) => b.id === coverData.backgroundId)?.url ||
    backgrounds[0]?.url;

  return (
    <div
      ref={containerRef}
      id={id}
      data-visual-card="true"
      className="relative w-full aspect-square overflow-hidden bg-white select-none shadow-2xl"
    >
      {/* Scaled Canvas Container */}
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

        {/* 2. Main Card Container - with selectable background image & template overlay */}
        <div
          className={`relative w-[670px] h-[670px] shadow-2xl flex flex-col justify-between p-8 rounded-tl-[48px] rounded-tr-2xl rounded-br-2xl rounded-bl-2xl text-center overflow-hidden ring-1 ring-black/5`}
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
            {/* Subtle inner corner accents */}
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

          {/* 3. Header: Crest & Brand */}
          <header className="relative z-10 pt-2 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <span style={{ backgroundColor: `${template.accentColor}99` }} className="h-px w-10" />
              <div
                style={{ backgroundColor: template.crestBg, color: template.crestIconColor }}
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-white/20"
              >
                <ChefHat className="w-5 h-5" />
              </div>
              <span style={{ backgroundColor: `${template.accentColor}99` }} className="h-px w-10" />
            </div>

            <h2
              style={{
                color: template.primaryColor,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
              className="text-sm font-extrabold tracking-[0.3em] uppercase"
            >
              {coverData.brandName || "CHEF'S CLUB"}
            </h2>
          </header>

          {/* 4. Center Title, Emblem & Dates */}
          <main className="relative z-10 flex flex-col items-center my-auto py-2 px-4 w-full">
            {/* Introductory mention */}
            <p
              style={{ fontFamily: "'Playfair Display', serif" }}
              className="italic text-slate-600 text-[17px] mb-1 text-center whitespace-nowrap"
            >
              vous présente
            </p>

            {/* Main Title - strictly single-line to avoid any divider collision */}
            <h1
              style={{
                color: template.titleColor,
                fontFamily: "'Playfair Display', serif",
              }}
              className="font-black text-[30px] tracking-tight uppercase leading-tight mb-2 text-center whitespace-nowrap"
            >
              Le Menu de la Semaine
            </h1>

            {/* Template-aware accent divider */}
            <div className="flex items-center gap-3 mt-1 mb-3.5 w-3/4 max-w-xs justify-center shrink-0">
              <span
                style={{
                  background: `linear-gradient(to right, transparent, ${template.primaryColor}, ${template.accentColor})`,
                }}
                className="h-[1.5px] flex-1"
              />
              <Sparkles style={{ color: template.accentColor }} className="w-4 h-4 shrink-0" />
              <span
                style={{
                  background: `linear-gradient(to left, transparent, ${template.primaryColor}, ${template.accentColor})`,
                }}
                className="h-[1.5px] flex-1"
              />
            </div>

            {/* Subtitle Date Range Badge */}
            {(() => {
              const size = coverData.dateSize || 'md';
              const sizeStyles = {
                md: {
                  container: 'px-7 py-2.5 text-sm',
                  icon: 'w-4 h-4',
                  calendarSize: 'w-4 h-4',
                },
                lg: {
                  container: 'px-8 py-3 text-base',
                  icon: 'w-5 h-5',
                  calendarSize: 'w-5 h-5',
                },
                xl: {
                  container: 'px-9 py-3.5 text-lg',
                  icon: 'w-6 h-6',
                  calendarSize: 'w-6 h-6',
                },
                '2xl': {
                  container: 'px-11 py-4 text-xl',
                  icon: 'w-7 h-7',
                  calendarSize: 'w-7 h-7',
                },
              };
              const activeStyle = sizeStyles[size] || sizeStyles.md;

              return (
                <div
                  style={{
                    backgroundColor: template.primaryColor,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                  className={`mt-1 mb-3 inline-flex items-center justify-center gap-2.5 text-white rounded-full shadow-lg border border-white/20 transition-all shrink-0 ${activeStyle.container}`}
                >
                  <Calendar style={{ color: template.crestIconColor }} className={`${activeStyle.calendarSize} shrink-0`} />
                  <span className="font-semibold tracking-wide whitespace-nowrap">
                    {coverData.subtitlePrefix || 'du'}{' '}
                    <strong style={{ color: template.crestIconColor }} className="font-extrabold">
                      {coverData.startDate || '31 Août'}
                    </strong>{' '}
                    {coverData.subtitleMiddle || 'au'}{' '}
                    <strong style={{ color: template.crestIconColor }} className="font-extrabold">
                      {coverData.endDate || '04 Septembre'}
                    </strong>
                    {coverData.year ? ` ${coverData.year}` : ''}
                  </span>
                </div>
              );
            })()}

            {/* Central Culinary Emblem */}
            <div className="my-2 flex flex-col items-center shrink-0">
              <div
                style={{ borderColor: `${template.accentColor}80` }}
                className="w-14 h-14 rounded-full bg-amber-50/70 border-2 shadow-inner flex items-center justify-center"
              >
                <UtensilsCrossed style={{ color: template.primaryColor }} className="w-7 h-7" />
              </div>
            </div>

            {/* Tagline */}
            <p
              style={{
                color: template.accentColor,
                fontFamily: "'Dancing Script', cursive",
              }}
              className="text-[44px] font-bold drop-shadow-xs mt-1 shrink-0 whitespace-nowrap leading-none"
            >
              Bon Appétit !
            </p>
          </main>

          {/* 5. Footer Mention */}
          <footer
            style={{ borderColor: `${template.borderColor}15` }}
            className="relative z-10 pt-2 pb-0.5 px-4 flex items-center justify-center border-t shrink-0 w-full"
          >
            <p
              style={{ fontFamily: "'Playfair Display', serif" }}
              className="italic text-[12.5px] text-slate-500 text-center tracking-wide whitespace-nowrap"
            >
              Photos non contractuelles
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};


