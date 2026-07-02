
import React, { useState, useMemo } from 'react';
import { Audit, AuditStatusType, AuditEntity } from '../../types';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Search, Plus, Filter, MoreHorizontal } from 'lucide-react';
import { AuditStatusBadge } from './AuditStatusBadge';
import { AuditTypeBadge } from './AuditTypeBadge';
import { ScoreBadge } from './ScoreBadge';
import { Card } from '../common/Card';
import { safeFormatDate, isDateInRange } from '@/utils';
import { DateRangePicker, DateRange } from '../common/DateRangePicker';

interface AuditsListProps {
  audits: Audit[];
  onSelectAudit: (audit: Audit) => void;
  onCreateAudit: () => void;
}

export const AuditsList: React.FC<AuditsListProps> = ({ audits, onSelectAudit, onCreateAudit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [statusFilter, setStatusFilter] = useState<AuditStatusType | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<AuditEntity | 'All'>('All');

  const filteredAudits = useMemo(() => {
    return audits.filter(audit => {
      const matchesSearch = (audit.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (audit.entityName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || audit.status === statusFilter;
      const matchesType = typeFilter === 'All' || audit.entityType === typeFilter;
      const matchesDate = isDateInRange(audit.dateCreated, dateRange);
      
      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });
  }, [audits, searchTerm, statusFilter, typeFilter, dateRange]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audits</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage growth audits for leads and clients</p>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full md:w-auto items-center">
             <div className="relative flex-grow">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                    type="text" 
                    placeholder="Search audits..." 
                    className="pl-9 pr-4 py-2 w-full sm:w-64 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-premium-accent focus:border-transparent outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
             </div>
             <DateRangePicker onApply={setDateRange} initialRange={dateRange || undefined} />
             <select 
                className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-premium-accent outline-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AuditStatusType | 'All')}
             >
                 <option value="All">All Statuses</option>
                 <option value="Draft">Draft</option>
                 <option value="In Progress">In Progress</option>
                 <option value="Completed">Completed</option>
                 <option value="Sent">Sent</option>
             </select>
             <Button onClick={onCreateAudit} leftIcon={<Plus className="w-4 h-4" />} variant="primary">
                 Create Audit
             </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0 border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Audit Details</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Entity</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-40">Score</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"></th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredAudits.map((audit) => (
                        <tr 
                            key={audit.id} 
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                            onClick={() => onSelectAudit(audit)}
                        >
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-slate-900 dark:text-white text-sm">{audit.title}</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">ID: {audit.id.slice(-6)}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
                                        {audit.entityName.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-900 dark:text-white">{audit.entityName}</div>
                                        <div className="flex items-center gap-1.5">
                                            <AuditTypeBadge type={audit.entityType} />
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <AuditStatusBadge status={audit.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {audit.score !== undefined ? (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className={audit.score >= 80 ? 'text-green-600' : audit.score >= 50 ? 'text-yellow-600' : 'text-red-600'}>{audit.score}/100</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                            <div 
                                                className={`h-1.5 rounded-full ${audit.score >= 80 ? 'bg-green-500' : audit.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                style={{ width: `${audit.score}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-slate-400 text-sm">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                {safeFormatDate(audit.dateCreated)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); onSelectAudit(audit); }} className="text-slate-400 hover:text-premium-accent">
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {filteredAudits.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                                    <p className="text-lg font-medium">No audits found</p>
                                    <p className="text-sm">Try adjusting your search or create a new audit.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </Card>
    </div>
  );
};
