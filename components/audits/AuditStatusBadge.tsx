
import React from 'react';
import { AuditStatusType } from '../../types';

interface AuditStatusBadgeProps {
  status: AuditStatusType;
  className?: string;
}

export const AuditStatusBadge: React.FC<AuditStatusBadgeProps> = ({ status, className }) => {
  const getBadgeStyles = (s: AuditStatusType) => {
    switch (s) {
      case 'Draft': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'Sent': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${getBadgeStyles(status)} ${className || ''}`}>
      {status}
    </span>
  );
};
