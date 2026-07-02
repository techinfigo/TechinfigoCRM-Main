
import React, { useState, useMemo } from 'react';
import { Card } from '../../common/Card';
import { ActivityLogItem, TeamMember } from '../../../types';
import { usePagination } from '../../../hooks/usePagination';
import { Pagination } from '../../common/Pagination';

interface AdminActivityLogViewProps {
  activityHistory: ActivityLogItem[];
  teamMembers: TeamMember[];
}

const SortAscIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 ml-1 opacity-70 dark:opacity-80"><path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v12.5a.75.75 0 01-1.5 0V3.75A.75.75 0 0110 3zM3.75 6.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zm0 4a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z" clipRule="evenodd" /></svg>;
const SortDescIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 ml-1 opacity-70 dark:opacity-80"><path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V3.75a.75.75 0 011.5 0v12.5A.75.75 0 0110 17zM3.75 13.25a.75.75 0 000-1.5h4.5a.75.75 0 000 1.5h-4.5zm0-4a.75.75 0 000-1.5h2.5a.75.75 0 000 1.5h-2.5z" clipRule="evenodd" /></svg>;


export const AdminActivityLogView: React.FC<AdminActivityLogViewProps> = ({ activityHistory, teamMembers }) => {
  type SortableKey = 'timestamp' | 'userName' | 'actionType' | 'entityType';
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'ascending' | 'descending' } | null>({ key: 'timestamp', direction: 'descending' });

  const getUserName = (userId: string) => {
    if (userId === 'system') return 'System';
    return teamMembers.find(tm => tm.id === userId)?.name || userId;
  };

  const requestSort = (key: SortableKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: SortableKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 ml-1.5 opacity-30 dark:opacity-50 group-hover:opacity-60 dark:group-hover:opacity-70"><path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v12.5a.75.75 0 01-1.5 0V3.75A.75.75 0 0110 3zM3.75 6.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zm0 4a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z" clipRule="evenodd" /></svg>;
    }
    return sortConfig.direction === 'ascending' ? <SortAscIcon /> : <SortDescIcon />;
  };

  const TableHeader: React.FC<{ sortKey: SortableKey; label: string; }> = ({ sortKey, label }) => (
    <th 
        scope="col" 
        className="p-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider group"
        onClick={() => requestSort(sortKey)}
        role="columnheader"
        aria-sort={sortConfig?.key === sortKey ? (sortConfig.direction === 'ascending' ? 'ascending' : 'descending') : 'none'}
    >
        <div className="flex items-center cursor-pointer hover:text-text-base dark:hover:text-text-base transition-colors duration-150">
            {label}
            {getSortIcon(sortKey)}
        </div>
    </th>
  );
  
  const sortedActivityHistory = useMemo(() => {
    let sortableItems = [...activityHistory];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA, valB;
        switch(sortConfig.key) {
          case 'timestamp':
            valA = new Date(a.timestamp).getTime();
            valB = new Date(b.timestamp).getTime();
            break;
          default: // for userName, actionType, entityType
            valA = (a[sortConfig.key] || '').toLowerCase();
            valB = (b[sortConfig.key] || '').toLowerCase();
        }
        
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'ascending' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [activityHistory, sortConfig]);

  const { paginatedData, ...paginationProps } = usePagination({ data: sortedActivityHistory });

  return (
    <Card title="System-Wide Activity Log" className="bg-white dark:bg-slate-800">
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
        This log displays significant actions performed within the application. 
        (Currently shows a limited history from client-side state.)
      </p>
      
      {sortedActivityHistory.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-center py-6">No activity recorded yet.</p>
      ) : (
        <>
        <div className="overflow-x-auto max-h-[70vh] custom-scrollbar rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 uppercase sticky top-0 z-10">
                    <tr>
                        <TableHeader sortKey="timestamp" label="Timestamp" />
                        <TableHeader sortKey="userName" label="User/Actor" />
                        <TableHeader sortKey="actionType" label="Action Type" />
                        <TableHeader sortKey="entityType" label="Entity Type" />
                        <th className="p-3 text-left">Entity Name/ID</th>
                        <th className="p-3 text-left">Details</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                    {paginatedData.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors">
                            <td className="p-3 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="p-3 whitespace-nowrap">{log.userName}</td>
                            <td className="p-3 whitespace-nowrap">{log.actionType}</td>
                            <td className="p-3 whitespace-nowrap">{log.entityType}</td>
                            <td className="p-3 whitespace-nowrap truncate max-w-xs" title={log.entityName || log.entityId}>{log.entityName || log.entityId}</td>
                            <td className="p-3 whitespace-normal break-words">{log.details}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <Pagination {...paginationProps} />
        </>
      )}
       <p className="text-xs text-slate-500 dark:text-slate-400 mt-6 text-center">
         A production system would typically have more robust backend logging, filtering, and pagination for activity logs.
       </p>
    </Card>
  );
};
