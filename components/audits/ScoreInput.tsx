
import React from 'react';

interface ScoreInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
}

export const ScoreInput: React.FC<ScoreInputProps> = ({ label, value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 0;
    if (val > 10) val = 10;
    if (val < 0) val = 0;
    onChange(val);
  };

  const getStatus = (score: number) => {
    if (score >= 8) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-500' };
    if (score >= 5) return { label: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-500' };
    return { label: 'Critical', color: 'text-red-600', bg: 'bg-red-500' };
  };

  const status = getStatus(value);

  return (
    <div className="group bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all duration-200">
      <div className="flex justify-between items-center mb-3">
        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
          {label}
        </label>
        <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-600 ${status.color}`}>
                {status.label}
            </span>
            <span className="text-lg font-bold text-slate-800 dark:text-white w-6 text-right">
                {value}
            </span>
        </div>
      </div>
      
      <div className="relative h-2 w-full rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full transition-all duration-300 ease-out rounded-full ${status.bg}`} 
            style={{ width: `${value * 10}%` }}
          />
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={value}
            onChange={handleChange}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
            aria-label={`Score for ${label}`}
          />
      </div>
      <div className="flex justify-between mt-1 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase">
        <span>Poor</span>
        <span>Good</span>
      </div>
    </div>
  );
};
