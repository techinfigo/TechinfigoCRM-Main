
import React from 'react';
import { ChevronDown, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AuditSectionAccordionProps {
  title: string;
  score: number;
  maxScore: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const AuditSectionAccordion: React.FC<AuditSectionAccordionProps> = ({
  title,
  score,
  maxScore,
  isOpen,
  onToggle,
  children,
}) => {
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  
  const getStatusColor = (pct: number) => {
      if (pct >= 80) return 'text-green-500';
      if (pct >= 50) return 'text-yellow-500';
      return 'text-red-500';
  };

  const getBorderColor = (pct: number) => {
    if (pct >= 80) return 'border-green-500';
    if (pct >= 50) return 'border-yellow-500';
    return 'border-red-500';
  };
  
  return (
    <div className={`
        border rounded-xl overflow-hidden transition-all duration-300 ease-in-out mb-4 bg-white dark:bg-slate-800
        ${isOpen 
            ? 'shadow-lg ring-1 ring-slate-200 dark:ring-slate-700 border-slate-300 dark:border-slate-600' 
            : 'shadow-sm border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        } 
    `}>
      <div
        onClick={onToggle}
        className={`flex items-center justify-between p-5 cursor-pointer select-none transition-colors group ${isOpen ? 'bg-slate-50/50 dark:bg-slate-700/20' : ''}`}
      >
        <div className="flex items-center gap-4">
           {/* Circular Score Indicator */}
           <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold border-2 ${getBorderColor(percentage)} bg-white dark:bg-slate-800 shadow-sm`}>
                <span className={getStatusColor(percentage)}>{percentage}%</span>
                {/* Tiny status icon badge */}
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 ${percentage >= 50 ? 'bg-green-500' : 'bg-red-500'}`}>
                    {percentage >= 50 ? <CheckCircle2 size={10} className="text-white"/> : <AlertTriangle size={10} className="text-white"/>}
                </div>
           </div>

          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 group-hover:text-premium-accent transition-colors">{title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
                <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${percentage}%` }}></div>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                   {score} / {maxScore} pts
                </span>
            </div>
          </div>
        </div>
        
        <div className={`
            w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 
            ${isOpen ? 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white rotate-180' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-600'}
        `}>
           <ChevronDown size={16} strokeWidth={2.5} />
        </div>
      </div>
      
      {isOpen && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 animate-content-fade-in">
            {children}
          </div>
      )}
    </div>
  );
};
