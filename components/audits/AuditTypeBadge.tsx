
import React from 'react';
import { AuditEntity } from '../../types';

interface AuditTypeBadgeProps {
  type: AuditEntity;
  className?: string;
}

export const AuditTypeBadge: React.FC<AuditTypeBadgeProps> = ({ type, className }) => {
  const getBadgeStyles = (t: AuditEntity) => {
    switch (t) {
      case 'Lead': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300';
      case 'Client': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${getBadgeStyles(type)} ${className || ''}`}>
      {type}
    </span>
  );
};
