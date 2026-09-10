import React from 'react';
import { AllergenDef } from '../types';
import { getAllergenColor, getAllergenInfo } from '../data/allergens';

interface AllergenBadgeProps {
  allergens: number[];
  customText?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  allergensList?: AllergenDef[];
  fontClass?: string;
}

export const AllergenBadge: React.FC<AllergenBadgeProps> = ({
  allergens,
  customText,
  size = 'md',
  showLabel = true,
  allergensList,
  fontClass = 'font-sans-clean',
}) => {
  if ((!allergens || allergens.length === 0) && !customText) {
    return null;
  }

  const circleSizes = {
    sm: 'w-4 h-4 text-[9px]',
    md: 'w-5 h-5 text-[11px]',
    lg: 'w-6 h-6 text-xs',
  };

  const labelSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap justify-center">
      {showLabel && (
        <span className={`${fontClass} font-semibold text-slate-700 tracking-tight ${labelSizes[size]}`}>
          {allergens.length > 1 ? 'Allergènes :' : 'Allergène :'}
        </span>
      )}

      <div className="inline-flex items-center gap-1 flex-wrap justify-center">
        {allergens.map((num) => {
          const allergenInfo = getAllergenInfo(num, allergensList);
          const tooltip = allergenInfo ? `${num} - ${allergenInfo.name}` : `Allergène ${num}`;
          const bgColor = getAllergenColor(num, allergensList);

          return (
            <span
              key={num}
              style={{ backgroundColor: bgColor }}
              className={`inline-flex items-center justify-center rounded-full ${fontClass} font-bold text-white shadow-xs select-none ${circleSizes[size]}`}
              title={tooltip}
            >
              {num}
            </span>
          );
        })}

        {customText && (
          <span className={`${fontClass} text-[11px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded`}>
            {customText}
          </span>
        )}
      </div>
    </div>
  );
};

