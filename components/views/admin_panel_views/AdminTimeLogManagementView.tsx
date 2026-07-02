
import React, { useState, useMemo } from 'react';
import { TimeLog, Project, TeamMember, FeatureKey, PermissionAction } from '../../../types';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';

interface AdminTimeLogManagementViewProps {
  timeLogs: TimeLog[];
  projects: Project[];
  teamMembers: TeamMember[];
  onOpenTimeLogModal: (log: TimeLog | null, defaults?: { projectId?: string, taskId?: string }) => void;
  onDeleteTimeLog: (logId: string) => void;
  currentUser: TeamMember | null;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25-.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>;
const SortAscIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 ml-1 opacity-70 dark:opacity-80"><path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v12.5a.75.75 0 01-1.5 0V3.75A.75.75 0 0110 3zM3.75 6.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zm0 4a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z" clipRule="evenodd" /></svg>;
const SortDescIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 ml-1 opacity-70 dark:opacity-80"><path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V3.75a.75.75 0 011.5 0v12.5A.75.75 0 0110 17zM3.75 13.25a.75.75 0 000-1.5h4.5a.75.75 0 000 1.5h-4.5zm0-4a.75.75 0 000-1.5h2.5a.75.75 0 000 1.5h-2.5z" clipRule="evenodd" /></svg>;

export const AdminTimeLogManagementView: React.FC<AdminTimeLogManagementViewProps> = ({
  timeLogs, projects, teamMembers, onOpenTimeLogModal, onDeleteTimeLog, currentUser, hasPermission
}) => {
  const [filterProject, setFilterProject] = useState<string>('All');
  const [filterMember, setFilterMember] = useState<string>('All');
  type SortableKey = 'date' | 'memberId' | 'projectId' | 'hours';
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'ascending' | 'descending' } | null>({ key: 'date', direction: 'descending' });

  const canManageAllTimeLogs = hasPermission('adminTimeLogs', 'canManageAllTimeLogs');

  const getProjectName = (projectId: string) => projects.find(p => p.id === projectId)?.name || 'N/A';
  const getTaskName = (taskId?: string) => taskId ? projects.flatMap(p => p.tasks).find(t => t.id === taskId)?.title : '';
  const getMemberName = (memberId: string) => teamMembers.find(m => m.id === memberId)?.name || 'N/A';
  
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
        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider group"
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

  const sortedTimeLogs = useMemo(() => {
    let sortableItems = timeLogs.filter(log => {
      const projectMatch = filterProject === 'All' || log.projectId === filterProject;
      const memberMatch = filterMember === 'All' || log.memberId === filterMember;
      return projectMatch && memberMatch;
    });

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA, valB;
        switch (sortConfig.key) {
            case 'date':
                valA = new Date(a.date).getTime();
                valB = new Date(b.date).getTime();
                break;
            case 'memberId':
                valA = getMemberName(a.memberId).toLowerCase();
                valB = getMemberName(b.memberId).toLowerCase();
                break;
            case 'projectId':
                valA = getProjectName(a.projectId).toLowerCase();
                valB = getProjectName(b.projectId).toLowerCase();
                break;
            case 'hours':
                valA = a.hours;
                valB = b.hours;
                break;
            default: return 0;
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
  }, [timeLogs, filterProject, filterMember, sortConfig]);

  const selectBaseClass = "p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm";

  return (
    <Card title="Time Log Administration" className="bg-white dark:bg-slate-800">
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
        View and manage all time logs submitted by team members.
      </p>

      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className={selectBaseClass}>
          <option value="All">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)} className={selectBaseClass}>
          <option value="All">All Team Members</option>
          {teamMembers.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
        </select>
      </div>

      {sortedTimeLogs.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-center py-6">No time logs match your criteria.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <TableHeader sortKey="date" label="Date" />
                <TableHeader sortKey="memberId" label="Member" />
                <TableHeader sortKey="projectId" label="Project" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Task</th>
                <TableHeader sortKey="hours" label="Hours" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notes</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {sortedTimeLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{new Date(log.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{getMemberName(log.memberId)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{getProjectName(log.projectId)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 italic truncate max-w-xs" title={getTaskName(log.taskId)}>{getTaskName(log.taskId) || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-200 font-medium">{log.hours.toFixed(1)}</td>
                  <td className="px-4 py-3 whitespace-normal text-sm text-slate-500 dark:text-slate-400 max-w-sm break-words" title={log.notes}>{log.notes || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-1">
                    {(canManageAllTimeLogs || (hasPermission('timeTracking', 'canEditOwnTime') && log.memberId === currentUser?.id)) && (
                      <Button variant="ghost" size="xs" onClick={() => onOpenTimeLogModal(log, undefined)} aria-label="Edit time log" className="p-1">
                        <EditIcon />
                      </Button>
                    )}
                    {(canManageAllTimeLogs || (hasPermission('timeTracking', 'canDeleteOwnTime') && log.memberId === currentUser?.id)) && (
                      <Button variant="ghost" size="xs" onClick={() => { if(window.confirm('Delete this time log?')) onDeleteTimeLog(log.id);}} aria-label="Delete time log" className="text-red-500 hover:text-red-700 p-1">
                        <TrashIcon />
                      </Button>
                    )}
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
