
import React from 'react';
import { SOP } from '../../types';
import { SOPCategoryBadge } from './SOPCategoryBadge';
import { Button } from '../common/Button';
import { ArrowLeft, CheckCircle2, FileText, Link as LinkIcon } from 'lucide-react';
import { Card } from '../common/Card';

interface SOPDetailProps {
  sop: SOP;
  onBack: () => void;
  onEdit: () => void;
}

export const SOPDetail: React.FC<SOPDetailProps> = ({ sop, onBack, onEdit }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header Navigation */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
          Back to Library
        </Button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
                <SOPCategoryBadge category={sop.category} />
                <span className="text-xs text-slate-400 dark:text-slate-500">Last updated: {new Date(sop.updatedAt).toLocaleDateString()}</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{sop.title}</h1>
            <p className="text-slate-600 dark:text-slate-300 text-lg">{sop.description}</p>
        </div>

        <div className="p-6 space-y-8">
            {/* Steps Section */}
            <section>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-premium-accent/10 flex items-center justify-center text-premium-accent">
                        <FileText className="w-5 h-5" />
                    </div>
                    Step-by-Step Instructions
                </h3>
                <div className="space-y-4">
                    {sop.steps.map((step, index) => (
                        <div key={index} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-slate-600 border-2 border-slate-200 dark:border-slate-500 flex items-center justify-center font-bold text-slate-500 dark:text-slate-300 text-sm shadow-sm">
                                {index + 1}
                            </div>
                            <div className="pt-1">
                                <p className="text-slate-700 dark:text-slate-200">{step}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Checklists Section (if exists) */}
            {sop.checklists && sop.checklists.length > 0 && (
                <section>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        Checklist
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {sop.checklists.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <input type="checkbox" className="w-4 h-4 text-premium-accent rounded border-slate-300 focus:ring-premium-accent" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">{item}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Additional Notes & Resources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                 {sop.additionalNotes && (
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 uppercase tracking-wider">Additional Notes</h4>
                        <div className="text-sm text-slate-600 dark:text-slate-400 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-800/30">
                            {sop.additionalNotes}
                        </div>
                    </div>
                 )}
                 
                 <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 uppercase tracking-wider">Attached Resources</h4>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm text-premium-accent cursor-pointer hover:underline">
                            <LinkIcon className="w-4 h-4" />
                            <span>Related Template Document (Placeholder)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-premium-accent cursor-pointer hover:underline">
                            <LinkIcon className="w-4 h-4" />
                            <span>Video Walkthrough (Placeholder)</span>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
        
        <div className="p-6 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-200 dark:border-slate-700 flex justify-end">
             <Button variant="secondary" onClick={onEdit}>Edit SOP</Button>
        </div>
      </div>
    </div>
  );
};
