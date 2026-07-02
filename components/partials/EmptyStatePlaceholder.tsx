
import React from 'react';

interface EmptyStatePlaceholderProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  actionButton?: React.ReactNode;
}

export const EmptyStatePlaceholder: React.FC<EmptyStatePlaceholderProps> = ({ icon, title, message, actionButton }) => {
  return (
    <div className="text-center py-12 px-6 bg-slate-50 dark:bg-slate-800/20 rounded-lg border-2 border-dashed border-border-muted dark:border-slate-700 flex flex-col items-center">
      <div className="text-slate-400 dark:text-slate-500 mb-4">
        {icon}
      </div>
      <h4 className="mt-2 text-xl font-semibold text-text-muted dark:text-text-muted">{title}</h4>
      <p className="text-sm text-slate-500 dark:slate-400 mt-2 max-w-md mx-auto">
        {message}
      </p>
      {actionButton && (
        <div className="mt-6">
          {actionButton}
        </div>
      )}
    </div>
  );
};
