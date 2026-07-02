
import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface CheckboxGroupProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  title?: string;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ options, selected, onChange, title }) => {
  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="space-y-3">
      {title && (
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" />
                {title}
            </h4>
            {selected.length > 0 && (
                <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                    {selected.length} issues selected
                </span>
            )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
            const isSelected = selected.includes(option);
            return (
                <button
                    key={option}
                    type="button"
                    onClick={() => handleToggle(option)}
                    className={`
                        relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border select-none
                        ${isSelected 
                            ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white shadow-md' 
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }
                    `}
                >
                    {isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
                    {option}
                </button>
            );
        })}
      </div>
    </div>
  );
};
