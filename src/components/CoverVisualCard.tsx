import React, { useRef, useState, useEffect } from 'react';
import { BackgroundItem, CoverPageData, MenuTemplateId, TypographySettings } from '../types';
import { UtensilsCrossed, ChefHat, Sparkles, Calendar } from 'lucide-react';
import { MENU_TEMPLATES } from '../data/templates';
import { getFontFamily } from '../utils/typography';

interface CoverVisualCardProps {
  coverData: CoverPageData;
  backgrounds: BackgroundItem[];
  templateId?: MenuTemplateId;
  backgroundOpacity?: number;
  typography?: TypographySettings;
  id?: string;
  isExporting?: boolean;
}

export const CoverVisualCard: React.FC<CoverVisualCardProps> = ({
  coverData,
  backgrounds,
  templateId = 'classic-navy',
  backgroundOpacity,
  typography,
  id = 'cover-visual-card',
  isExporting = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(isExporting ? 1.5 : 1);

  const template = MENU_TEMPLATES[templateId] || MENU_TEMPLATES['classic-navy'];

  // Resolve title font dynamically based on user typography settings (e.g. Cormorant Garamond for Gastronomique)
  const resolvedTitleFont = getFontFamily(typography?.dishTitleFont || 'playfair');

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

        {/* 2. Main Card Container - Symmetrical, Balanced, Centered */}
        <div
          className={`relative w-[670px] h-[670px] shadow-2xl flex flex-col justify-between p-8 rounded-3xl text-center overflow-hidden ring-1 ring-black/5 mx-auto my-auto`}
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

          {/* Symmetrical Outer Border with 4 balanced corner accents */}
          <div
            style={{ borderColor: template.borderColor }}
            className="absolute inset-4 border-[2px] pointer-events-none rounded-2xl z-10"
          >
            {/* 4 Identical, perfectly centered corner accents */}
            <div
              style={{ borderColor: `${template.borderColor}80` }}
              className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2"
            />
            <div
              style={{ borderColor: `${template.borderColor}80` }}
              className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2"
            />
            <div
              style={{ borderColor: `${template.borderColor}80` }}
              className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2"
            />
            <div
              style={{ borderColor: `${template.borderColor}80` }}
              className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2"
            />
          </div>

          {/* 3. Header: Crest & Brand */}
          <header className="relative z-10 pt-2 flex flex-col items-center justify-center w-full text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span style={{ backgroundColor: `${template.accentColor}99` }} className="h-px w-12" />
              <div
                style={{ backgroundColor: template.crestBg, color: template.crestIconColor }}
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-white/20"
              >
                <ChefHat className="w-5 h-5" />
              </div>
              <span style={{ backgroundColor: `${template.accentColor}99` }} className="h-px w-12" />
            </div>

            <h2
              style={{
                color: template.primaryColor,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
              className="text-sm font-extrabold tracking-[0.2em] uppercase text-center w-full"
            >
              {coverData.brandName || "CHEF'S CLUB"}
            </h2>
          </header>

          {/* 4. Center Title, Emblem & Dates - Evenly spaced & centered */}
          <main className="relative z-10 flex-1 flex flex-col items-center justify-around py-3 px-6 w-full text-center my-auto">
            {/* Introductory mention */}
            <p
              style={{ fontFamily: resolvedTitleFont }}
              className="italic text-slate-600 text-[18px] text-center whitespace-nowrap mb-0.5"
            >
              vous présente
            </p>

            {/* Main Title - strictly single-line to avoid any divider collision */}
            {(() => {
              const raw = (coverData.title || '').trim();
              const titleText =
                !raw || raw.toLowerCase().includes('vous présente')
                  ? 'MENU DE LA SEMAINE'
                  : raw;
              const isLongTitle = titleText.length > 22;
              return (
                <h1
                  style={{
                    color: template.titleColor,
                    fontFamily: resolvedTitleFont,
                    fontWeight: 700,
                  }}
                  className={`tracking-normal uppercase leading-tight text-center whitespace-nowrap mb-1.5 ${
                    isLongTitle ? 'text-[26px]' : 'text-[32px]'
                  }`}
                >
                  {titleText}
                </h1>
              );
            })()}

            {/* Template-aware accent divider */}
            <div className="flex items-center justify-center gap-3 my-1 w-52 max-w-xs mx-auto shrink-0">
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
              const size = coverData.dateSize || typography?.coverDateSize || 'md';
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
                  className={`my-2 inline-flex items-center justify-center gap-2.5 text-white rounded-full shadow-lg border border-white/20 transition-all shrink-0 mx-auto ${activeStyle.container}`}
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
            <div className="my-2 flex flex-col items-center justify-center shrink-0 mx-auto">
              <div
                style={{ borderColor: `${template.accentColor}80` }}
                className="w-14 h-14 rounded-full bg-amber-50/70 border-2 shadow-inner flex items-center justify-center"
              >
                <UtensilsCrossed style={{ color: template.primaryColor }} className="w-7 h-7" />
              </div>
            </div>

            {/* Tagline */}
            {(() => {
              const rawTagline = (coverData.tagline || '').trim();
              const isLegacyTagline =
                !rawTagline ||
                rawTagline.toLowerCase().includes('fraîche') ||
                rawTagline.toLowerCase().includes('fraiche') ||
                rawTagline.toLowerCase().includes('restaurant') ||
                rawTagline.toLowerCase().includes('cuisine maison');
              const displayTagline = isLegacyTagline ? 'Bon Appétit !' : rawTagline;

              return (
                <p
                  style={{
                    color: template.accentColor,
                    fontFamily: "'Dancing Script', cursive",
                    fontWeight: 700,
                  }}
                  className="text-[48px] drop-shadow-xs my-1 text-center shrink-0 whitespace-nowrap leading-none mx-auto"
                >
                  {displayTagline}
                </p>
              );
            })()}
          </main>

          {/* 5. Footer Mention */}
          <footer
            style={{ borderColor: `${template.borderColor}15` }}
            className="relative z-10 pt-2 pb-0.5 px-4 flex items-center justify-center border-t shrink-0 w-full"
          >
            <p
              style={{ fontFamily: resolvedTitleFont }}
              className="italic text-[13px] text-slate-500 text-center tracking-wide whitespace-nowrap mx-auto"
            >
              Photos non contractuelles
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};


