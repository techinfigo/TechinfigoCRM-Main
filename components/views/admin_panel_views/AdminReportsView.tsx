
import React from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { MarketingAuditRequest, Client } from '../../../types'; // Added Client

interface AdminReportsViewProps {
  marketingAudits: MarketingAuditRequest[];
  clients: Client[];
  onViewAuditDetail: (audit: MarketingAuditRequest) => void;
}

const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;


export const AdminReportsView: React.FC<AdminReportsViewProps> = ({ marketingAudits, clients, onViewAuditDetail }) => {

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'N/A';
  };

  return (
    <Card title="System Reports: Marketing Audits" className="bg-white dark:bg-slate-800">
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
        This section lists all marketing audit reports generated within the system.
        Future enhancements could include more report types, advanced filtering, and export options.
      </p>

      {marketingAudits.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-center py-6">No marketing audit reports found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Website</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date Generated</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {marketingAudits.map((audit) => (
                <tr key={audit.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-200">{getClientName(audit.clientId)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{audit.websiteUrl}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {audit.lastGeneratedDate ? new Date(audit.lastGeneratedDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                     <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                       audit.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300' :
                       audit.status === 'Requested' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700/30 dark:text-blue-300' :
                       'bg-slate-100 text-slate-800 dark:bg-slate-600/30 dark:text-slate-300'
                     }`}>
                        {audit.status}
                     </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-1">
                    <Button variant="ghost" size="xs" onClick={() => onViewAuditDetail(audit)} title="View Audit Details" className="p-1 text-slate-500 hover:text-premium-accent">
                      <EyeIcon/> View Report
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
