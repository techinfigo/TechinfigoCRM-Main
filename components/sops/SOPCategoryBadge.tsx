
import React from 'react';
import { SOPCategory } from '../../types';

interface SOPCategoryBadgeProps {
  category: SOPCategory;
  className?: string;
}

export const SOPCategoryBadge: React.FC<SOPCategoryBadgeProps> = ({ category, className }) => {
  const getBadgeStyles = (cat: SOPCategory) => {
    switch (cat) {
      case 'Audit': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'Ads': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
      case 'Creative': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
      case 'Retention': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'Reporting': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
      case 'Communication': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300';
      case 'CRO': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300';
      case 'Onboarding': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'Pricing': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeStyles(category)} ${className || ''}`}>
      {category}
    </span>
  );
};
