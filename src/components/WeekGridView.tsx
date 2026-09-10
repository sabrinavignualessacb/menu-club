import React from 'react';
import { AllergenDef, BackgroundItem, DayId, WeeklyMenuData } from '../types';
import { DayVisualCard } from './DayVisualCard';
import { CoverVisualCard } from './CoverVisualCard';
import { Download, Edit3, Eye } from 'lucide-react';

interface WeekGridViewProps {
  menuData: WeeklyMenuData;
  backgrounds: BackgroundItem[];
  allergensList?: AllergenDef[];
  onSelectDayForEdit: (day: 'cover' | DayId) => void;
  onExportSingleDay: (day: 'cover' | DayId) => void;
}

export const WeekGridView: React.FC<WeekGridViewProps> = ({
  menuData,
  backgrounds,
  allergensList,
  onSelectDayForEdit,
  onExportSingleDay,
}) => {
  const daysList: { id: 'cover' | DayId; label: string }[] = [
    { id: 'cover', label: 'Page de Garde' },
    { id: 'monday', label: 'Lundi' },
    { id: 'tuesday', label: 'Mardi' },
    { id: 'wednesday', label: 'Mercredi' },
    { id: 'thursday', label: 'Jeudi' },
    { id: 'friday', label: 'Vendredi' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            Vue d&apos;ensemble des 6 visuels de la semaine
          </h2>
          <p className="text-xs text-slate-600">
            Cliquez sur un visuel pour le modifier dans l&apos;éditeur ou téléchargez-le directement
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {daysList.map((item) => {
          const isCover = item.id === 'cover';
          const dayMenu = !isCover ? menuData.days[item.id as DayId] : undefined;

          return (
            <div
              key={item.id}
              className="bg-white/45 backdrop-blur-md border border-white/60 rounded-2xl p-4 flex flex-col space-y-3 shadow-xl hover:border-white/90 hover:bg-white/55 transition-all group"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  {item.label}
                  {!isCover && dayMenu && (
                    <span className="text-xs text-amber-700 font-bold">
                      ({dayMenu.dateFormatted})
                    </span>
                  )}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectDayForEdit(item.id)}
                    className="p-1.5 rounded-lg bg-white/70 hover:bg-white text-slate-700 hover:text-slate-900 border border-white/80 transition-colors shadow-2xs cursor-pointer"
                    title="Modifier ce visuel"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onExportSingleDay(item.id)}
                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-2xs cursor-pointer"
                    title="Exporter ce visuel en PNG"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Visual Card Scaled */}
              <div
                onClick={() => onSelectDayForEdit(item.id)}
                className="cursor-pointer rounded-xl overflow-hidden shadow-lg transform group-hover:scale-[1.01] transition-transform duration-200"
              >
                {isCover ? (
                  <CoverVisualCard
                    coverData={menuData.cover}
                    backgrounds={backgrounds}
                    templateId={menuData.templateId}
                    backgroundOpacity={menuData.backgroundOpacity}
                    id={`grid-card-${item.id}`}
                  />
                ) : (
                  dayMenu && (
                    <DayVisualCard
                      dayMenu={dayMenu}
                      backgrounds={backgrounds}
                      templateId={menuData.templateId}
                      backgroundOpacity={menuData.backgroundOpacity}
                      allergensList={allergensList}
                      typography={menuData.typography}
                      id={`grid-card-${item.id}`}
                    />
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

