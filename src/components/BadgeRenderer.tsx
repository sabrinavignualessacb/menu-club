import React from 'react';
import { ChefHat, Leaf, Sprout, Fish, Award, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { DEFAULT_BADGES } from '../data/badges';
import { DishBadge } from '../types';

interface BadgeRendererProps {
  badgeId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  customBadgesList?: DishBadge[];
}

export const BadgeRenderer: React.FC<BadgeRendererProps> = ({
  badgeId,
  size = 'md',
  className = '',
  customBadgesList = [],
}) => {
  // Normalize legacy IDs
  let normalizedId = badgeId;
  if (badgeId === 'viande-francaise') normalizedId = 'vf';
  if (badgeId === 'lpf') normalizedId = 'pf';

  const allBadges = [...DEFAULT_BADGES, ...customBadgesList];
  const badge = allBadges.find((b) => b.id.toLowerCase() === normalizedId.toLowerCase()) || {
    id: badgeId,
    label: badgeId,
    fullName: badgeId,
    type: (normalizedId === 'vegetarien' ? 'leaf' : normalizedId === 'vegan' ? 'sprout' : 'custom') as DishBadge['type'],
    bgClass: 'bg-white text-slate-900 border-slate-200',
  };

  const sizeClasses = {
    sm: 'h-[18px] px-1.5 text-[9px] gap-1',
    md: 'h-[20px] px-2 text-[10px] gap-1.2',
    lg: 'h-[24px] px-2.5 text-xs gap-1.5',
  };

  const flagSizes = {
    sm: 'w-2.5 h-3',
    md: 'w-3 h-3.5',
    lg: 'w-3.5 h-4',
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  };

  // Render according to badge type
  if (badge.type === 'leaf' || badge.id === 'vegetarien') {
    return (
      <div
        className={`inline-flex items-center flex-nowrap whitespace-nowrap bg-emerald-50 border border-emerald-300 text-emerald-800 shadow-2xs rounded-md font-bold tracking-tight select-none shrink-0 ${sizeClasses[size]} ${className}`}
        title={badge.fullName || 'Plat Végétarien'}
      >
        <Leaf className={`${iconSizes[size]} text-emerald-600 shrink-0 fill-emerald-500/20`} />
        <span className="font-sans-clean font-extrabold tracking-tight whitespace-nowrap leading-none">
          {badge.label || 'Végétarien'}
        </span>
      </div>
    );
  }

  if (badge.type === 'sprout' || badge.id === 'vegan') {
    return (
      <div
        className={`inline-flex items-center flex-nowrap whitespace-nowrap bg-green-50 border border-green-300 text-green-800 shadow-2xs rounded-md font-bold tracking-tight select-none shrink-0 ${sizeClasses[size]} ${className}`}
        title={badge.fullName || 'Plat Végan'}
      >
        <Sprout className={`${iconSizes[size]} text-green-600 shrink-0 fill-green-500/20`} />
        <span className="font-sans-clean font-extrabold tracking-tight whitespace-nowrap leading-none">
          {badge.label || 'Végan'}
        </span>
      </div>
    );
  }

  if (badge.type === 'fish') {
    return (
      <div
        className={`inline-flex items-center flex-nowrap whitespace-nowrap bg-sky-50 border border-sky-300 text-sky-800 shadow-2xs rounded-md font-bold tracking-tight select-none shrink-0 ${sizeClasses[size]} ${className}`}
        title={badge.fullName || 'Poisson / Produits de la mer'}
      >
        <Fish className={`${iconSizes[size]} text-sky-600 shrink-0`} />
        <span className="font-sans-clean font-extrabold tracking-tight whitespace-nowrap leading-none">
          {badge.label}
        </span>
      </div>
    );
  }

  if (badge.type === 'chef-hat') {
    return (
      <div
        className={`inline-flex items-center flex-nowrap whitespace-nowrap bg-amber-50 border border-amber-300 text-amber-900 shadow-2xs rounded-md font-bold tracking-tight select-none shrink-0 ${sizeClasses[size]} ${className}`}
        title={badge.fullName || 'Fait Maison / Spécialité Chef'}
      >
        <ChefHat className={`${iconSizes[size]} text-amber-700 shrink-0`} />
        <span className="font-sans-clean font-extrabold tracking-tight whitespace-nowrap leading-none">
          {badge.label}
        </span>
      </div>
    );
  }

  // French meat badge (flag-fr) by default for VBF, PF, VOF, VAF, VVF, VF, etc.
  const isFrenchMeat =
    badge.type === 'flag-fr' ||
    ['vbf', 'pf', 'vof', 'vaf', 'vvf', 'vf', 'lpf'].includes(normalizedId.toLowerCase());

  if (isFrenchMeat) {
    return (
      <div
        className={`inline-flex items-center flex-nowrap whitespace-nowrap bg-white border border-slate-300/90 shadow-2xs rounded-md font-bold text-slate-900 tracking-tight select-none shrink-0 ${sizeClasses[size]} ${className}`}
        title={badge.fullName || `${badge.label} (Origine France garantie)`}
      >
        {/* Tricolore French Flag */}
        <div
          className={`relative flex overflow-hidden rounded-[1.5px] shadow-2xs border border-slate-300/80 shrink-0 ${flagSizes[size]}`}
        >
          <div className="w-1/3 h-full bg-[#002654]" />
          <div className="w-1/3 h-full bg-white" />
          <div className="w-1/3 h-full bg-[#ED2939]" />
        </div>

        <span className="font-sans-clean font-extrabold tracking-tight text-slate-900 whitespace-nowrap leading-none">
          {badge.label}
        </span>
      </div>
    );
  }

  // Generic custom badge
  return (
    <div
      className={`inline-flex items-center flex-nowrap whitespace-nowrap bg-slate-100 border border-slate-300 text-slate-800 shadow-2xs rounded-md font-bold tracking-tight select-none shrink-0 ${sizeClasses[size]} ${className}`}
      title={badge.fullName || badge.label}
    >
      <Sparkles className={`${iconSizes[size]} text-amber-500 shrink-0`} />
      <span className="font-sans-clean font-extrabold tracking-tight whitespace-nowrap leading-none">
        {badge.label}
      </span>
    </div>
  );
};

interface BadgesListProps {
  badges?: string[];
  showFrenchMeat?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  customBadgesList?: DishBadge[];
}

export const BadgesList: React.FC<BadgesListProps> = ({
  badges = [],
  showFrenchMeat = false,
  size = 'md',
  className = '',
  customBadgesList = [],
}) => {
  // Use explicitly selected badges from the dish
  let effectiveBadges: string[] = [];

  if (Array.isArray(badges)) {
    // When badges array is defined (even if empty []), use it as the source of truth
    effectiveBadges = badges.map((id) => (id === 'viande-francaise' ? 'vf' : id));
  } else if (showFrenchMeat) {
    // Only use legacy fallback if badges is undefined
    effectiveBadges = ['vbf'];
  }

  // Deduplicate while preserving user selection order
  const uniqueBadges = Array.from(new Set(effectiveBadges));

  if (uniqueBadges.length === 0) {
    return <div className="h-[20px]" />;
  }

  return (
    <div className={`flex flex-row items-center justify-center flex-nowrap gap-1.5 whitespace-nowrap overflow-visible ${className}`}>
      {uniqueBadges.map((badgeId) => (
        <BadgeRenderer
          key={badgeId}
          badgeId={badgeId}
          size={size}
          customBadgesList={customBadgesList}
        />
      ))}
    </div>
  );
};
