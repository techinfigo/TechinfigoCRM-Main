
import React from 'react';
import { SOP } from '../../types';
import { SOPCategoryBadge } from './SOPCategoryBadge';
import { Button } from '../common/Button';
import { ArrowRight } from 'lucide-react';

interface SOPCardProps {
  sop: SOP;
  onClick: () => void;
}

export const SOPCard: React.FC<SOPCardProps> = ({ sop, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-lg border border-slate-200 dark:border-slate-700 p-5 transition-all duration-200 cursor-pointer flex flex-col h-full group"
    >
      <div className="flex justify-between items-start mb-3">
        <SOPCategoryBadge category={sop.category} />
        <span className="text-xs text-slate-400 dark:text-slate-500">
           {new Date(sop.updatedAt).toLocaleDateString()}
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-premium-accent transition-colors">
        {sop.title}
      </h3>
      
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-grow">
        {sop.description}
      </p>
      
      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
         <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{sop.steps.length} Steps</span>
         <Button variant="ghost" size="sm" className="!p-0 text-premium-accent hover:text-premium-accent-hover dark:text-premium-accent-dark hover:bg-transparent" onClick={(e) => { e.stopPropagation(); onClick(); }}>
             View SOP <ArrowRight className="ml-1 w-4 h-4" />
         </Button>
      </div>
    </div>
  );
};
