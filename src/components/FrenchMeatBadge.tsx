import React from 'react';

interface FrenchMeatBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FrenchMeatBadge: React.FC<FrenchMeatBadgeProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-5 px-1.5 text-[9px] gap-1',
    md: 'h-6 px-2 text-[10px] gap-1.5',
    lg: 'h-7 px-2.5 text-xs gap-1.5',
  };

  const flagSize = {
    sm: 'w-2.5 h-3',
    md: 'w-3 h-3.5',
    lg: 'w-3.5 h-4',
  };

  return (
    <div
      className={`inline-flex items-center bg-white border border-slate-200 shadow-xs rounded-md font-semibold text-slate-800 tracking-tight select-none ${sizeClasses[size]} ${className}`}
      title="Viande d'origine française garantie"
    >
      {/* French Tricolor Flag Graphic */}
      <div className={`relative flex overflow-hidden rounded-[2px] shadow-xs border border-slate-200/60 ${flagSize[size]}`}>
        <div className="w-1/3 h-full bg-[#002654]" />
        <div className="w-1/3 h-full bg-white" />
        <div className="w-1/3 h-full bg-[#ED2939]" />
      </div>

      <span className="font-sans-clean font-bold tracking-tight text-slate-900 whitespace-nowrap">
        Viande Française
      </span>
    </div>
  );
};
