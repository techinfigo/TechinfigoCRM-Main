
import React from 'react';

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, className }) => {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    if (s >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
    return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
  };

  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-sm font-bold border ${getColor(score)} ${className || ''}`}>
      {score}/100
    </span>
  );
};
