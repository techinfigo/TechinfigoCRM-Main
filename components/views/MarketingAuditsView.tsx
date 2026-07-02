
import React, { useState, useMemo } from 'react';
import { MarketingAuditRequest, Client, MarketingAuditStatus, FeatureKey, PermissionAction } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

interface MarketingAuditsViewProps {
  audits: MarketingAuditRequest[];
  clients: Client[];
  onAddAudit: () => void;
  onEditAudit: (audit: MarketingAuditRequest) => void; 
  onDeleteAudit: (auditId: string) => void;
  onViewAuditDetail: (audit: MarketingAuditRequest) => void; // Renamed for consistency, App.tsx handles modal logic
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

// Icons
const PlusIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;
const TrashIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25-.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>;
const EditIconSmall = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className || "w-4 h-4"}><path d="M11.354 1.646a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708L5.061 13.939a.5.5 0 0 1-.353.146H2.5a.5.5 0 0 1-.5-.5V11.293a.5.5 0 0 1 .146-.353L11.354 1.646ZM12.5 2.5 4.207 10.793V13h2.207L13.5 4.707 12.5 3.707V2.5Z" /><path d="m10.854 3.146 2.292 2.292-8.5 8.5H2.5v-2.292l8.5-8.5Z" /></svg>;
const EyeIcon = ({ className, ...rest }: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"} {...rest}><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;


const getStatusClassNames = (status: MarketingAuditStatus): string => {
    let baseClasses = 'px-2.5 py-1 text-xs font-semibold rounded-full border ';
    switch (status) {
        case 'Requested': return baseClasses + 'bg-sky-100 text-sky-700 dark:bg-sky-700/20 dark:text-sky-300 border-sky-400/50 dark:border-sky-300/40';
        case 'InProgress': return baseClasses + 'bg-blue-100 text-status-neutral dark:bg-status-neutral/20 dark:text-status-neutral border-status-neutral/50 dark:border-status-neutral/40';
        case 'AIGenerating': return baseClasses + 'bg-purple-100 text-purple-700 dark:bg-purple-700/20 dark:text-purple-300 border-purple-400/50 dark:border-purple-400/40 animate-pulse';
        case 'ReviewPending': return baseClasses + 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700/20 dark:text-indigo-300 border-indigo-400/50 dark:border-indigo-400/40';
        case 'Completed': return baseClasses + 'bg-green-100 text-status-positive dark:bg-status-positive/20 dark:text-status-positive border-status-positive/50 dark:border-status-positive/40';
        case 'Error': return baseClasses + 'bg-red-100 text-status-negative dark:bg-status-negative/20 dark:text-status-negative border-status-negative/50 dark:border-status-negative/40';
        default: return baseClasses + 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400 border-slate-300 dark:border-slate-600';
    }
};

const auditStatuses: MarketingAuditStatus[] = ['Requested', 'InProgress', 'AIGenerating', 'ReviewPending', 'Completed', 'Error'];

export const MarketingAuditsView: React.FC<MarketingAuditsViewProps> = ({
  audits,
  clients,
  onAddAudit,
  onEditAudit,
  onDeleteAudit,
  onViewAuditDetail,
  hasPermission,
}) => {
  const [filterStatus, setFilterStatus] = useState<MarketingAuditStatus | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const canCreateAudits = hasPermission('marketingAudits', 'canCreate');
  const canEditAudits = hasPermission('marketingAudits', 'canEdit'); 
  const canDeleteAudits = hasPermission('marketingAudits', 'canDelete');


  const filteredAudits = useMemo(() => {
    return audits
      .filter(audit => {
        const statusMatch = filterStatus === 'All' || audit.status === filterStatus;
        const clientName = audit.clientName || clients.find(c => c.id === audit.clientId)?.name || '';
        const searchMatch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            audit.websiteUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            audit.focusAreas.some(fa => fa.toLowerCase().includes(searchTerm.toLowerCase()));
        return statusMatch && searchMatch;
      })
      .sort((a,b) => new Date(b.dateRequested).getTime() - new Date(a.dateRequested).getTime());
  }, [audits, filterStatus, searchTerm, clients]);

  return (
    <Card 
      title="Marketing Audits"
      className="bg-fuchsia-50 dark:bg-fuchsia-900/60 shadow-xl rounded-xl"
      actions={
        canCreateAudits && (
            <Button onClick={onAddAudit} variant="primary" size="md" leftIcon={<PlusIcon />} disabled={clients.length === 0}>
                {clients.length === 0 ? "Add Client First" : "Request New Audit"}
            </Button>
        )
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <input
            type="text"
            placeholder="Search by client, website, focus area..."
            className="flex-grow p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-lg focus:ring-1 focus:ring-premium-accent dark:focus:ring-premium-accent focus:border-premium-accent dark:focus:border-premium-accent text-sm text-text-base dark:text-text-base placeholder-text-muted dark:placeholder-text-muted/70 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as MarketingAuditStatus | 'All')}
            className="p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-lg focus:ring-1 focus:ring-premium-accent dark:focus:ring-premium-accent focus:border-premium-accent dark:focus:border-premium-accent text-sm text-text-base dark:text-text-base shadow-sm"
        >
          <option value="All" className="bg-bg-base dark:bg-bg-muted">All Statuses</option>
          {auditStatuses.map(status => (
            <option key={status} value={status} className="bg-bg-base dark:bg-bg-muted">{status}</option>
          ))}
        </select>
      </div>

      {filteredAudits.length === 0 ? (
        <p className="text-text-muted dark:text-text-muted text-center py-8">
          {audits.length === 0 && canCreateAudits ? 'No marketing audits requested yet.' : 
           audits.length === 0 && !canCreateAudits ? 'No marketing audits requested and you do not have permission to add them.' :
           'No audits match your current filters.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-base dark:border-border-muted">
          <table className="min-w-full divide-y divide-border-base dark:divide-border-muted">
            <thead className="bg-bg-muted dark:bg-slate-700/50">
              <tr>
                <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Client</th>
                <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Website</th>
                <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Date Requested</th>
                <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Focus Areas</th>
                <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Status</th>
                <th scope="col" className="px-5 py-3.5 text-right text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-bg-base dark:bg-bg-muted divide-y divide-border-base dark:divide-border-muted">
              {filteredAudits.map((audit, index) => {
                const clientName = audit.clientName || clients.find(c => c.id === audit.clientId)?.name || 'N/A';
                return (
                  <tr 
                    key={audit.id} 
                    onClick={() => onViewAuditDetail(audit)}
                    className={`transition-colors hover:bg-highlight-accent dark:hover:bg-slate-700/60 cursor-pointer ${index % 2 !== 0 ? 'bg-slate-50/50 dark:bg-slate-700/30' : 'bg-bg-base dark:bg-bg-muted'}`}
                  >
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-text-base dark:text-text-base">{clientName}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-text-muted dark:text-text-muted">
                        <a href={`http://${audit.websiteUrl}`} target="_blank" rel="noopener noreferrer" className="text-premium-accent hover:text-premium-accent-dark hover:underline">{audit.websiteUrl}</a>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-text-muted dark:text-text-muted">{new Date(audit.dateRequested).toLocaleDateString()}</td>
                    <td className="px-5 py-4 whitespace-normal text-sm text-text-muted dark:text-text-muted max-w-xs break-words" title={audit.focusAreas.join(', ')}>
                        {audit.focusAreas.join(', ')}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center ${getStatusClassNames(audit.status)}`}>
                        {audit.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                       {hasPermission('auditDetail', 'canView') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); onViewAuditDetail(audit); }}
                            aria-label={`View details for ${audit.websiteUrl}`}
                            className="text-text-muted dark:text-text-muted hover:text-premium-accent dark:hover:text-premium-accent-dark p-1.5"
                            title="View Details/Report"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </Button>
                        )}
                      {canEditAudits && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEditAudit(audit); }} aria-label={`Edit request for ${audit.websiteUrl}`} className="text-text-muted dark:text-text-muted hover:text-status-warning dark:hover:text-status-warning p-1.5">
                            <EditIconSmall />
                        </Button>
                      )}
                      {canDeleteAudits && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDeleteAudit(audit.id); }} 
                        className="text-text-muted dark:text-text-muted hover:text-status-negative dark:hover:text-status-negative p-1.5"
                        aria-label={`Delete audit for ${audit.websiteUrl}`}>
                            <TrashIcon />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
