
import React from 'react';
import { InvoiceStatus } from '../../types';

interface StatusBadgeProps {
  status: InvoiceStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusClasses = (): string => {
    let baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'Paid':
        return `${baseClasses} bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-300`;
      case 'Sent':
        return `${baseClasses} bg-blue-100 text-blue-700 dark:bg-blue-700/20 dark:text-blue-300`;
      case 'Draft':
        return `${baseClasses} bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300`;
      case 'Overdue':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-700/20 dark:text-red-300`;
      case 'Cancelled':
        return `${baseClasses} bg-gray-200 text-gray-500 dark:bg-slate-600 dark:text-slate-400`;
      default:
        return baseClasses;
    }
  };

  return <span className={getStatusClasses()}>{status}</span>;
};
