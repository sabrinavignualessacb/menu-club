import React, { useState } from 'react';
import { AllergenDef, TypographySettings, WeeklyMenuData } from '../types';
import {
  FONT_OPTIONS,
  DISH_TITLE_SIZE_OPTIONS,
  DISH_LABEL_SIZE_OPTIONS,
  ALLERGEN_SIZE_OPTIONS,
  COVER_DATE_SIZE_OPTIONS,
  getFontFamilyClass,
  getDishTitleClass,
  getDishTitleStyle,
  getDishLabelSizeClass,
} from '../utils/typography';
import { AllergenBadge } from './AllergenBadge';
import { X, Type, Check, Sparkles, Palette, Circle, Sliders, UtensilsCrossed } from 'lucide-react';

interface TypographyModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuData: WeeklyMenuData;
  onUpdateMenu: (updated: WeeklyMenuData | ((prev: WeeklyMenuData) => WeeklyMenuData)) => void;
  allergensList?: AllergenDef[];
  initialTab?: 'all' | 'dishTitle' | 'dishLabel' | 'labelPosition' | 'dishColors' | 'plateCircle' | 'allergen' | 'backgroundOpacity';
}

const COLOR_PRESETS = [
  { label: 'Bleu Roi Chef’s Club', hex: '#001489' },
  { label: 'Bleu Nuit Prestige', hex: '#132847' },
  { label: 'Noir Ébène', hex: '#18181b' },
  { label: 'Vert Émeraude', hex: '#064e3b' },
  { label: 'Terracotta / Bordeaux', hex: '#831843' },
  { label: 'Ocre Doré', hex: '#d97706' },
  { label: 'Ardoise Foncée', hex: '#1e293b' },
  { label: 'Chocolat Chaud', hex: '#451a03' },
];

const PLATE_BORDER_PRESETS = [
  { label: 'Sans bordure (0px)', width: 0 },
  { label: 'Ultra-fin (1px)', width: 1 },
  { label: 'Fin élégant (1.5px)', width: 1.5 },
  { label: 'Moyen (2.5px)', width: 2.5 },
  { label: 'Classique (3.5px)', width: 3.5 },
  { label: 'Épais (5px)', width: 5 },
];

export const TypographyModal: React.FC<TypographyModalProps> = ({
  isOpen,
  onClose,
  menuData,
  onUpdateMenu,
  allergensList,
  initialTab = 'all',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'dishTitle' | 'dishLabel' | 'labelPosition' | 'dishColors' | 'plateCircle' | 'allergen' | 'backgroundOpacity'>(initialTab);
  const [positionTarget, setPositionTarget] = useState<'all' | 'dish1' | 'dish2' | 'dish3'>('all');

  if (!isOpen) return null;

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

  const currentTitleFontClass = getFontFamilyClass(typography.dishTitleFont, 'font-sans-clean');
  const currentTitleSizeClass = getDishTitleClass('Dos de cabillaud rôti aux herbes de Provence & écrasé de pommes de terre', typography.dishTitleSize);

  const currentLabelFontClass = getFontFamilyClass(typography.dishLabelFont, 'font-sans-clean');
  const currentLabelSizeClass = getDishLabelSizeClass(typography.dishLabelSize);

  const currentAllergenFontClass = getFontFamilyClass(typography.allergenFont, 'font-sans-clean');
  const currentAllergenSize = typography.allergenSize || 'md';

  const dish1TitleColor = typography.dish1Color || '#001489';
  const dish2TitleColor = typography.dish2Color || '#001489';
  const dishOtherTitleColor = typography.dishOtherColor || '#001489';

  const dish1LabelColor = typography.dish1LabelColor || typography.dishLabelColor || '#94a3b8';
  const dish2LabelColor = typography.dish2LabelColor || typography.dishLabelColor || '#94a3b8';
  const dishOtherLabelColor = typography.dishOtherLabelColor || typography.dishLabelColor || '#94a3b8';

  const plateBorderWidth = typography.plateBorderWidth !== undefined ? typography.plateBorderWidth : 1.5;
  const plateBorderColor = typography.plateBorderColor || '#ffffff';

  return (
    <div
      id="typography-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/65 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="typography-modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-blue-300">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                Styles, Polices &amp; Couleurs des Plats
              </h2>
              <p className="text-xs text-blue-200">
                Couleurs de Plat 1, Plat 2, Autres, cercle fin et typographies
              </p>
            </div>
          </div>

          <button
            id="typography-modal-close-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveSubTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/60 border border-slate-200'
            }`}
          >
            Tout afficher
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('dishColors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'dishColors'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/60 border border-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Couleurs Plats 1, 2, Autres</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('plateCircle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'plateCircle'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/60 border border-slate-200'
            }`}
          >
            <Circle className="w-3.5 h-3.5" />
            <span>Cercle de l&apos;Assiette</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('backgroundOpacity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'backgroundOpacity'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/60 border border-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Opacité du Fond</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('dishTitle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'dishTitle'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/60 border border-slate-200'
            }`}
          >
            1. Intitulé du Plat (Police)
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('dishLabel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'dishLabel'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/60 border border-slate-200'
            }`}
          >
            2. Libellés (Plat 1, Plat 2...)
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('labelPosition')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'labelPosition'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/60 border border-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Position X/Y Libellés</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('allergen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'allergen'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/60 border border-slate-200'
            }`}
          >
            3. Allergènes
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {/* SECTION: COULEURS DES PLATS 1, 2 ET AUTRES */}
          {(activeSubTab === 'all' || activeSubTab === 'dishColors') && (
            <div className="p-4 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 rounded-2xl border border-blue-200/80 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-blue-600 text-white">
                    <Palette className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                    Couleur des Plats 1, Plat 2 et AUTRES (Salades, Entrées...)
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-blue-800">
                  Définissez des couleurs distinctes par catégorie de plat
                </span>
              </div>

              {/* Real-time 3-Column Comparative Preview */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-300 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block text-center mb-2">
                  Aperçu en direct des 3 catégories
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-center">
                  {/* Preview Plat 1 */}
                  <div className="px-2 py-1">
                    <span
                      style={{ color: dish1LabelColor }}
                      className={`${currentLabelFontClass} ${currentLabelSizeClass} font-bold uppercase tracking-wide block mb-1`}
                    >
                      PLAT 1
                    </span>
                    <h4
                      style={{ color: dish1TitleColor }}
                      className={`${currentTitleFontClass} font-extrabold text-sm leading-tight`}
                    >
                      Pavé de bœuf grillé sauce au poivre
                    </h4>
                  </div>

                  {/* Preview Plat 2 */}
                  <div className="px-2 py-1">
                    <span
                      style={{ color: dish2LabelColor }}
                      className={`${currentLabelFontClass} ${currentLabelSizeClass} font-bold uppercase tracking-wide block mb-1`}
                    >
                      PLAT 2
                    </span>
                    <h4
                      style={{ color: dish2TitleColor }}
                      className={`${currentTitleFontClass} font-extrabold text-sm leading-tight`}
                    >
                      Dos de cabillaud rôti &amp; émulsion citron
                    </h4>
                  </div>

                  {/* Preview Autres (Salade / Plat 3) */}
                  <div className="px-2 py-1">
                    <span
                      style={{ color: dishOtherLabelColor }}
                      className={`${currentLabelFontClass} ${currentLabelSizeClass} font-bold uppercase tracking-wide block mb-1`}
                    >
                      SALADE / AUTRES
                    </span>
                    <h4
                      style={{ color: dishOtherTitleColor }}
                      className={`${currentTitleFontClass} font-extrabold text-sm leading-tight`}
                    >
                      Grande salade César gourmande du Chef
                    </h4>
                  </div>
                </div>
              </div>

              {/* 3 Color Settings Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* 1. Plat 1 Color */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">1. Plat 1</span>
                    <div
                      style={{ backgroundColor: dish1TitleColor }}
                      className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Couleur du nom du plat :
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={dish1TitleColor}
                        onChange={(e) => updateTypography({ dish1Color: e.target.value })}
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={dish1TitleColor}
                        onChange={(e) => updateTypography({ dish1Color: e.target.value })}
                        className="w-20 px-2 py-1 text-xs font-mono border border-slate-300 rounded uppercase font-bold"
                      />
                    </div>
                  </div>

                  {/* Preset swatches */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {COLOR_PRESETS.slice(0, 6).map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => updateTypography({ dish1Color: c.hex })}
                        style={{ backgroundColor: c.hex }}
                        className={`w-5 h-5 rounded-full border border-white ring-1 transition-transform hover:scale-110 cursor-pointer ${
                          dish1TitleColor.toLowerCase() === c.hex.toLowerCase() ? 'ring-blue-600 scale-110' : 'ring-black/10'
                        }`}
                        title={c.label}
                      />
                    ))}
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      Couleur du libellé &quot;Plat 1&quot; :
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={dish1LabelColor}
                        onChange={(e) => updateTypography({ dish1LabelColor: e.target.value })}
                        className="w-6 h-6 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={dish1LabelColor}
                        onChange={(e) => updateTypography({ dish1LabelColor: e.target.value })}
                        className="w-18 px-1.5 py-0.5 text-[11px] font-mono border border-slate-300 rounded uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Plat 2 Color */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">2. Plat 2</span>
                    <div
                      style={{ backgroundColor: dish2TitleColor }}
                      className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Couleur du nom du plat :
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={dish2TitleColor}
                        onChange={(e) => updateTypography({ dish2Color: e.target.value })}
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={dish2TitleColor}
                        onChange={(e) => updateTypography({ dish2Color: e.target.value })}
                        className="w-20 px-2 py-1 text-xs font-mono border border-slate-300 rounded uppercase font-bold"
                      />
                    </div>
                  </div>

                  {/* Preset swatches */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {COLOR_PRESETS.slice(0, 6).map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => updateTypography({ dish2Color: c.hex })}
                        style={{ backgroundColor: c.hex }}
                        className={`w-5 h-5 rounded-full border border-white ring-1 transition-transform hover:scale-110 cursor-pointer ${
                          dish2TitleColor.toLowerCase() === c.hex.toLowerCase() ? 'ring-blue-600 scale-110' : 'ring-black/10'
                        }`}
                        title={c.label}
                      />
                    ))}
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      Couleur du libellé &quot;Plat 2&quot; :
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={dish2LabelColor}
                        onChange={(e) => updateTypography({ dish2LabelColor: e.target.value })}
                        className="w-6 h-6 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={dish2LabelColor}
                        onChange={(e) => updateTypography({ dish2LabelColor: e.target.value })}
                        className="w-18 px-1.5 py-0.5 text-[11px] font-mono border border-slate-300 rounded uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Autres Color */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">3. AUTRES (Salade, Entrée, etc.)</span>
                    <div
                      style={{ backgroundColor: dishOtherTitleColor }}
                      className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Couleur du nom du plat :
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={dishOtherTitleColor}
                        onChange={(e) => updateTypography({ dishOtherColor: e.target.value })}
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={dishOtherTitleColor}
                        onChange={(e) => updateTypography({ dishOtherColor: e.target.value })}
                        className="w-20 px-2 py-1 text-xs font-mono border border-slate-300 rounded uppercase font-bold"
                      />
                    </div>
                  </div>

                  {/* Preset swatches */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {COLOR_PRESETS.slice(0, 6).map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => updateTypography({ dishOtherColor: c.hex })}
                        style={{ backgroundColor: c.hex }}
                        className={`w-5 h-5 rounded-full border border-white ring-1 transition-transform hover:scale-110 cursor-pointer ${
                          dishOtherTitleColor.toLowerCase() === c.hex.toLowerCase() ? 'ring-blue-600 scale-110' : 'ring-black/10'
                        }`}
                        title={c.label}
                      />
                    ))}
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      Couleur du libellé &quot;Salade / Autre&quot; :
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={dishOtherLabelColor}
                        onChange={(e) => updateTypography({ dishOtherLabelColor: e.target.value })}
                        className="w-6 h-6 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={dishOtherLabelColor}
                        onChange={(e) => updateTypography({ dishOtherLabelColor: e.target.value })}
                        className="w-18 px-1.5 py-0.5 text-[11px] font-mono border border-slate-300 rounded uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: CERCLE DE LA PHOTO DU PLAT (ÉPAISSEUR PLUS FINE & RÉGLAGE) */}
          {(activeSubTab === 'all' || activeSubTab === 'plateCircle') && (
            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-amber-500 text-slate-950">
                    <Circle className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                    Cercle de l&apos;Assiette (Épaisseur fine &amp; Réglage)
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-600">
                  Réglez la finesse du contour blanc circulaire de la photo
                </span>
              </div>

              {/* Live Interactive Plate Circle Preview */}
              <div className="p-4 bg-white rounded-xl border border-slate-300 shadow-2xs flex flex-col sm:flex-row items-center justify-around gap-4">
                <div className="text-center sm:text-left">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Aperçu en direct de l&apos;assiette
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    Bordure actuelle :{' '}
                    <span className="text-blue-600 font-extrabold text-sm">{plateBorderWidth} px</span>
                    {plateBorderWidth === 0 && ' (Aucune bordure)'}
                    {plateBorderWidth > 0 && plateBorderWidth <= 1.5 && ' (Finition très fine)'}
                    {plateBorderWidth > 1.5 && plateBorderWidth <= 3 && ' (Finition moyenne)'}
                    {plateBorderWidth > 3 && ' (Finition épaisse)'}
                  </p>
                </div>

                {/* Visual Porcelain Plate Simulation */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      background: 'radial-gradient(circle, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 70%)',
                    }}
                    className="absolute rounded-full blur-[6px] translate-y-2 pointer-events-none"
                  />
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      border: plateBorderWidth > 0 ? `${plateBorderWidth}px solid ${plateBorderColor}` : 'none',
                      boxShadow:
                        '0 14px 24px -3px rgba(0, 0, 0, 0.4), 0 6px 10px -2px rgba(0, 0, 0, 0.25), inset 0 2px 3px rgba(255, 255, 255, 0.75)',
                    }}
                    className="relative rounded-full overflow-hidden bg-slate-100 flex items-center justify-center transition-all z-10"
                  >
                    <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex flex-col items-center justify-center text-amber-800">
                      <UtensilsCrossed className="w-6 h-6 opacity-70 mb-0.5" />
                      <span className="text-[9px] font-bold">Photo Plat</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Presets buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Préréglages d&apos;épaisseur du cercle :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {PLATE_BORDER_PRESETS.map((p) => {
                    const isSelected = plateBorderWidth === p.width;
                    return (
                      <button
                        key={p.width}
                        type="button"
                        onClick={() => updateTypography({ plateBorderWidth: p.width })}
                        className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slider precision adjustment */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    Réglage précis par curseur :
                  </span>
                  <span className="font-mono font-bold text-blue-700">{plateBorderWidth} px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="0.5"
                  value={plateBorderWidth}
                  onChange={(e) => updateTypography({ plateBorderWidth: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>0 px (Invisible)</span>
                  <span>1.5 px (Fin recommandé)</span>
                  <span>3 px (Moyen)</span>
                  <span>6 px (Très marqué)</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: OPACITÉ DU FOND */}
          {(activeSubTab === 'all' || activeSubTab === 'backgroundOpacity') && (
            <div id="section-background-opacity" className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                    Opacité de l&apos;Image de Fond ({menuData.backgroundOpacity ?? 70}%)
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-600">
                  Réglez manuellement la transparence de l&apos;image de fond
                </span>
              </div>

              {/* Slider & Presets */}
              <div className="p-4 bg-white rounded-xl border border-slate-300 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Niveau d&apos;opacité :</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-black border border-blue-200">
                    {menuData.backgroundOpacity ?? 70}%
                  </span>
                </div>

                <div className="space-y-1.5">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={menuData.backgroundOpacity ?? 70}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      onUpdateMenu((prev) => ({
                        ...prev,
                        backgroundOpacity: val,
                        cover: { ...prev.cover, backgroundOpacity: val },
                        days: {
                          monday: { ...prev.days.monday, backgroundOpacity: val },
                          tuesday: { ...prev.days.tuesday, backgroundOpacity: val },
                          wednesday: { ...prev.days.wednesday, backgroundOpacity: val },
                          thursday: { ...prev.days.thursday, backgroundOpacity: val },
                          friday: { ...prev.days.friday, backgroundOpacity: val },
                        },
                      }));
                    }}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-600 font-medium px-0.5">
                    <span>5% (Subtil)</span>
                    <span>40% (Doux)</span>
                    <span>70% (Équilibré)</span>
                    <span>100% (Plein contraste)</span>
                  </div>
                </div>

                {/* Presets */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-600 font-bold uppercase mr-1">Préréglages :</span>
                  {[
                    { label: '20% Subtil', val: 20 },
                    { label: '40% Doux', val: 40 },
                    { label: '60% Net', val: 60 },
                    { label: '70% Standard', val: 70 },
                    { label: '85% Intense', val: 85 },
                    { label: '100% Plein', val: 100 },
                  ].map((preset) => {
                    const isSelected = (menuData.backgroundOpacity ?? 70) === preset.val;
                    return (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => {
                          onUpdateMenu((prev) => ({
                            ...prev,
                            backgroundOpacity: preset.val,
                            cover: { ...prev.cover, backgroundOpacity: preset.val },
                            days: {
                              monday: { ...prev.days.monday, backgroundOpacity: preset.val },
                              tuesday: { ...prev.days.tuesday, backgroundOpacity: preset.val },
                              wednesday: { ...prev.days.wednesday, backgroundOpacity: preset.val },
                              thursday: { ...prev.days.thursday, backgroundOpacity: preset.val },
                              friday: { ...prev.days.friday, backgroundOpacity: preset.val },
                            },
                          }));
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1: INTITULÉ DU PLAT */}
          {(activeSubTab === 'all' || activeSubTab === 'dishTitle') && (
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                    1. Intitulé du Plat (Nom de la recette)
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  Affiché en bleu profond au centre de chaque plat
                </span>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 bg-white rounded-xl border border-slate-300 shadow-2xs text-center flex flex-col items-center justify-center min-h-[90px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Aperçu en direct
                </span>
                <h4
                  style={{
                    color: dish1TitleColor,
                    ...getDishTitleStyle(
                      'Dos de cabillaud rôti aux herbes de Provence & écrasé de pommes de terre',
                      typography.dishTitleSize,
                      typography.dishTitleScale || 100,
                      2
                    ),
                  }}
                  className={`${currentTitleFontClass} font-extrabold text-center max-w-lg transition-all`}
                >
                  Dos de cabillaud rôti aux herbes de Provence &amp; écrasé de pommes de terre
                </h4>
              </div>

              {/* Font Selector Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Choisir la Police d&apos;écriture :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FONT_OPTIONS.map((f) => {
                    const isSelected = (typography.dishTitleFont || 'sans') === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => updateTypography({ dishTitleFont: f.id as TypographySettings['dishTitleFont'] })}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-400/40 text-blue-900 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold truncate">{f.label.split('(')[0]}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <span className={`${f.className} text-base leading-tight truncate`}>
                          Filet de bœuf rôti
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Selector Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Taille du texte du plat (Préréglages) :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {DISH_TITLE_SIZE_OPTIONS.map((s) => {
                    const isSelected = (typography.dishTitleSize || 'md') === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => updateTypography({ dishTitleSize: s.id as TypographySettings['dishTitleSize'] })}
                        className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fine-Tuning Slider for Dish Title Size */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    Ajustement fin de la taille du titre :
                  </span>
                  <span className="font-mono font-bold text-blue-700">
                    {typography.dishTitleScale || 100}%
                  </span>
                </div>
                <input
                  type="range"
                  min="75"
                  max="150"
                  step="5"
                  value={typography.dishTitleScale || 100}
                  onChange={(e) => updateTypography({ dishTitleScale: parseInt(e.target.value, 10) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>75% (Plus petit)</span>
                  <span>100% (Standard)</span>
                  <span>125% (Très grand)</span>
                  <span>150% (Géant)</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: LIBELLÉS DES PLATS (Plat 1, Plat 2...) */}
          {(activeSubTab === 'all' || activeSubTab === 'dishLabel') && (
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                    2. Libellés des Plats (&laquo; Plat 1 &raquo;, &laquo; Plat 2 &raquo;, etc.)
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  Affiché au-dessus de chaque plat en majuscules
                </span>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 bg-white rounded-xl border border-slate-300 shadow-2xs text-center flex flex-col items-center justify-center min-h-[70px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Aperçu en direct
                </span>
                <span
                  style={{ color: dish1LabelColor }}
                  className={`${currentLabelFontClass} ${currentLabelSizeClass} font-bold uppercase tracking-wide block transition-colors`}
                >
                  PLAT 1 • REPAS DU JOUR
                </span>
              </div>

              {/* Font Selector Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Choisir la Police d&apos;écriture du libellé :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FONT_OPTIONS.map((f) => {
                    const isSelected = (typography.dishLabelFont || 'sans') === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => updateTypography({ dishLabelFont: f.id as TypographySettings['dishLabelFont'] })}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-400/40 text-blue-900 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold truncate">{f.label.split('(')[0]}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <span className={`${f.className} text-base uppercase leading-tight truncate`}>
                          PLAT 1
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Selector Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Taille d&apos;affichage du libellé :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DISH_LABEL_SIZE_OPTIONS.map((s) => {
                    const isSelected = (typography.dishLabelSize || 'md') === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => updateTypography({ dishLabelSize: s.id as TypographySettings['dishLabelSize'] })}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION: POSITION RÉGLABLE DES LIBELLÉS (X / Y) */}
          {(activeSubTab === 'all' || activeSubTab === 'labelPosition' || activeSubTab === 'dishLabel') && (
            <div id="section-label-position" className="p-4 bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-slate-50 rounded-2xl border border-indigo-200/80 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-indigo-600 text-white">
                    <Sliders className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                    Position Réglable des Libellés (Axe X &amp; Y)
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-600">
                  Déplacez les libellés (&laquo; Plat 1 &raquo;, &laquo; Plat 2 &raquo;, &laquo; Autres &raquo;) sur le visuel
                </span>
              </div>

              {/* Target Selector Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Sélectionnez le libellé à ajuster :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'all', label: 'Tous les libellés (Global)', desc: 'Déplace tous les libellés ensemble' },
                    { id: 'dish1', label: 'Libellé Plat 1', desc: 'Ajuste Plat 1 spécifiquement' },
                    { id: 'dish2', label: 'Libellé Plat 2', desc: 'Ajuste Plat 2 spécifiquement' },
                    { id: 'dish3', label: 'Libellé Autres', desc: 'Ajuste Autres spécifiquement' },
                  ].map((t) => {
                    const isSelected = positionTarget === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setPositionTarget(t.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-300'
                            : 'bg-white text-slate-800 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <span className="text-xs font-bold">{t.label}</span>
                        <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                          {t.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {(() => {
                const currentOffsetX =
                  positionTarget === 'all'
                    ? typography.dishLabelOffsetX || 0
                    : positionTarget === 'dish1'
                    ? typography.dish1LabelOffsetX || 0
                    : positionTarget === 'dish2'
                    ? typography.dish2LabelOffsetX || 0
                    : typography.dish3LabelOffsetX || 0;

                const currentOffsetY =
                  positionTarget === 'all'
                    ? typography.dishLabelOffsetY || 0
                    : positionTarget === 'dish1'
                    ? typography.dish1LabelOffsetY || 0
                    : positionTarget === 'dish2'
                    ? typography.dish2LabelOffsetY || 0
                    : typography.dish3LabelOffsetY || 0;

                const updateCurrentOffset = (x?: number, y?: number) => {
                  if (positionTarget === 'all') {
                    updateTypography({
                      ...(x !== undefined ? { dishLabelOffsetX: x } : {}),
                      ...(y !== undefined ? { dishLabelOffsetY: y } : {}),
                    });
                  } else if (positionTarget === 'dish1') {
                    updateTypography({
                      ...(x !== undefined ? { dish1LabelOffsetX: x } : {}),
                      ...(y !== undefined ? { dish1LabelOffsetY: y } : {}),
                    });
                  } else if (positionTarget === 'dish2') {
                    updateTypography({
                      ...(x !== undefined ? { dish2LabelOffsetX: x } : {}),
                      ...(y !== undefined ? { dish2LabelOffsetY: y } : {}),
                    });
                  } else {
                    updateTypography({
                      ...(x !== undefined ? { dish3LabelOffsetX: x } : {}),
                      ...(y !== undefined ? { dish3LabelOffsetY: y } : {}),
                    });
                  }
                };

                const resetTargetOffset = () => {
                  updateCurrentOffset(0, 0);
                };

                return (
                  <div className="p-4 bg-white rounded-xl border border-slate-300 shadow-2xs space-y-4">
                    {/* Live Indicator Box */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
                          Décalage appliqué :
                        </span>
                        <p className="text-xs font-bold text-slate-800">
                          {positionTarget === 'all' && 'Tous les libellés : '}
                          {positionTarget === 'dish1' && 'Plat 1 : '}
                          {positionTarget === 'dish2' && 'Plat 2 : '}
                          {positionTarget === 'dish3' && 'Autres : '}
                          <span className="text-indigo-600 font-mono font-extrabold ml-1">
                            X = {currentOffsetX > 0 ? `+${currentOffsetX}` : currentOffsetX} px
                          </span>
                          <span className="text-slate-400 mx-1.5">|</span>
                          <span className="text-indigo-600 font-mono font-extrabold">
                            Y = {currentOffsetY > 0 ? `+${currentOffsetY}` : currentOffsetY} px
                          </span>
                        </p>
                      </div>

                      {/* Small Live Simulation Badge */}
                      <div className="h-10 px-4 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden min-w-[140px]">
                        <span
                          style={{
                            transform: `translate(${currentOffsetX}px, ${currentOffsetY}px)`,
                            color: dish1LabelColor,
                          }}
                          className={`${currentLabelFontClass} text-xs font-bold uppercase tracking-wider transition-transform`}
                        >
                          {positionTarget === 'all'
                            ? 'PLAT'
                            : positionTarget === 'dish1'
                            ? 'PLAT 1'
                            : positionTarget === 'dish2'
                            ? 'PLAT 2'
                            : 'AUTRES'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={resetTargetOffset}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 transition-all cursor-pointer"
                        title="Remettre ce libellé au centre (0, 0)"
                      >
                        Recentrer (0, 0)
                      </button>
                    </div>

                    {/* 1. Horizontal Position Slider (X) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-1.5 font-bold">
                          Position Horizontale (Axe X) :
                        </span>
                        <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {currentOffsetX > 0 ? `+${currentOffsetX}` : currentOffsetX} px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-80"
                        max="80"
                        step="1"
                        value={currentOffsetX}
                        onChange={(e) => updateCurrentOffset(parseInt(e.target.value, 10), undefined)}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                        <span>&larr; -80 px (Gauche)</span>
                        <button
                          type="button"
                          onClick={() => updateCurrentOffset(0, undefined)}
                          className="text-indigo-600 hover:underline cursor-pointer"
                        >
                          0 px (Centré)
                        </button>
                        <span>+80 px (Droite) &rarr;</span>
                      </div>

                      {/* Quick step buttons for X */}
                      <div className="flex items-center gap-1 pt-1 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Raccourcis X :</span>
                        {[-20, -10, -5, 0, 5, 10, 20].map((step) => (
                          <button
                            key={step}
                            type="button"
                            onClick={() => updateCurrentOffset(step, undefined)}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                              currentOffsetX === step
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {step > 0 ? `+${step}` : step}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Vertical Position Slider (Y) */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-1.5 font-bold">
                          Position Verticale (Axe Y) :
                        </span>
                        <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {currentOffsetY > 0 ? `+${currentOffsetY}` : currentOffsetY} px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="1"
                        value={currentOffsetY}
                        onChange={(e) => updateCurrentOffset(undefined, parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                        <span>&uarr; -50 px (Vers le haut)</span>
                        <button
                          type="button"
                          onClick={() => updateCurrentOffset(undefined, 0)}
                          className="text-indigo-600 hover:underline cursor-pointer"
                        >
                          0 px (Normal)
                        </button>
                        <span>+50 px (Vers le bas) &darr;</span>
                      </div>

                      {/* Quick step buttons for Y */}
                      <div className="flex items-center gap-1 pt-1 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Raccourcis Y :</span>
                        {[-15, -10, -5, 0, 5, 10, 15].map((step) => (
                          <button
                            key={step}
                            type="button"
                            onClick={() => updateCurrentOffset(undefined, step)}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                              currentOffsetY === step
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {step > 0 ? `+${step}` : step}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* SECTION 3: ALLERGÈNES */}
          {(activeSubTab === 'all' || activeSubTab === 'allergen') && (
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                    3. Allergènes (Numéros et Pastilles)
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  Affiché sous le nom du plat avec les pastilles colorées
                </span>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 bg-white rounded-xl border border-slate-300 shadow-2xs text-center flex flex-col items-center justify-center min-h-[70px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                  Aperçu en direct
                </span>
                <AllergenBadge
                  allergens={[1, 7, 10]}
                  customText=""
                  size={currentAllergenSize}
                  showLabel={true}
                  allergensList={allergensList}
                  fontClass={currentAllergenFontClass}
                />
              </div>

              {/* Font Selector Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Choisir la Police d&apos;écriture pour les allergènes :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FONT_OPTIONS.map((f) => {
                    const isSelected = (typography.allergenFont || 'sans') === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => updateTypography({ allergenFont: f.id as TypographySettings['allergenFont'] })}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-400/40 text-blue-900 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold truncate">{f.label.split('(')[0]}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <span className={`${f.className} text-sm font-semibold truncate`}>
                          Allergènes : 1, 7, 10
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Selector Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Taille d&apos;affichage des pastilles :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ALLERGEN_SIZE_OPTIONS.map((s) => {
                    const isSelected = (typography.allergenSize || 'md') === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => updateTypography({ allergenSize: s.id as TypographySettings['allergenSize'] })}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: DATE PAGE DE GARDE */}
          {activeSubTab === 'all' && (
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                    4. Taille de la Date sur la Page de Garde
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COVER_DATE_SIZE_OPTIONS.map((s) => {
                  const isSelected = (menuData.cover.dateSize || 'md') === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        onUpdateMenu((prev) => ({
                          ...prev,
                          cover: { ...prev.cover, dateSize: s.id as 'md' | 'lg' | 'xl' | '2xl' },
                        }))
                      }
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-600 font-medium hidden sm:inline">
            Les modifications s&apos;appliquent instantanément sur tous vos visuels.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ml-auto"
          >
            Terminer &amp; Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};
