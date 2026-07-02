
import React, { useState, useMemo } from 'react';
import { SOP, SOPCategory } from '../../types';
import { SOPCard } from './SOPCard';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Search, Filter, Plus } from 'lucide-react';

interface SOPListProps {
  sops: SOP[];
  onSelectSOP: (sop: SOP) => void;
  onAddSOP: () => void;
}

const categories: (SOPCategory | 'All')[] = ['All', 'Audit', 'Ads', 'Creative', 'Retention', 'Reporting', 'Communication', 'CRO', 'Onboarding', 'Pricing'];

export const SOPList: React.FC<SOPListProps> = ({ sops, onSelectSOP, onAddSOP }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SOPCategory | 'All'>('All');

  const filteredSOPs = useMemo(() => {
    return sops.filter(sop => {
      const matchesSearch = sop.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            sop.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || sop.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [sops, searchTerm, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">SOP Library</h1>
           <p className="text-sm text-slate-500 dark:text-slate-400">Standard Operating Procedures for agency growth.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                    type="text" 
                    placeholder="Search SOPs..." 
                    className="pl-9 pr-4 py-2 w-full sm:w-64 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-premium-accent focus:border-transparent outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
             </div>
             <div className="relative">
                 <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <select 
                    className="pl-9 pr-8 py-2 w-full sm:w-48 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-premium-accent focus:border-transparent outline-none appearance-none cursor-pointer"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as SOPCategory | 'All')}
                 >
                     {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                 </select>
             </div>
             <Button onClick={onAddSOP} leftIcon={<Plus className="w-4 h-4" />} variant="primary">
                 New SOP
             </Button>
        </div>
      </div>

      {/* Content Grid */}
      {filteredSOPs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSOPs.map(sop => (
                <SOPCard key={sop.id} sop={sop} onClick={() => onSelectSOP(sop)} />
            ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">No SOPs found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};
