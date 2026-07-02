import React from 'react';
import { DashboardSuggestion } from '../types';
import { Card } from './common/Card';
import { Button } from './common/Button';

interface DashboardSuggestionCardProps {
  suggestion: DashboardSuggestion;
}

export const DashboardSuggestionCard: React.FC<DashboardSuggestionCardProps> = ({ suggestion }) => {
  const severityBorderColors: Record<string, string> = {
    High: 'border-l-status-warning',
    Medium: 'border-l-status-info',
    Low: 'border-l-slate-400',
  };
  
  const cardClasses = `h-full flex flex-col ${suggestion.severity ? severityBorderColors[suggestion.severity] || 'border-l-slate-300 dark:border-l-slate-600' : 'border-l-slate-300 dark:border-l-slate-600'}`;

  return (
    <Card 
      title="" // Title is part of content for more flexibility
      className={`${cardClasses} border-l-4`} // Add left border for severity
      contentClassName="flex flex-col flex-grow p-4"
    >
      <div className="flex items-start mb-3">
        {suggestion.icon && <span className="mr-3 text-3xl text-premium-accent dark:text-premium-accent-dark shrink-0">{suggestion.icon}</span>}
        <h4 className="text-base font-semibold text-text-base dark:text-text-base leading-tight">{suggestion.title}</h4>
      </div>
      <p className="text-sm text-text-muted dark:text-text-muted flex-grow mb-4">
        {suggestion.description}
      </p>
      {suggestion.actionPath && (
        <div className="mt-auto">
          <Button onClick={suggestion.actionPath} variant="primary" size="sm" className="w-full">
            {suggestion.actionLabel || 'Take Action'}
          </Button>
        </div>
      )}
    </Card>
  );
};