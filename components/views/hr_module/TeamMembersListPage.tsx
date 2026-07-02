
import React, { useState, useMemo } from 'react';
import { TeamMember, HRStatus, FeatureKey, PermissionAction, RoleDefinition } from '../../../types';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '../../common/Pagination';

// Icons
const PlusIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;
const EditIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className || "w-4 h-4"}><path d="M11.354 1.646a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708L5.061 13.939a.5.5 0 0 1-.353.146H2.5a.5.5 0 0 1-.5-.5V11.293a.5.5 0 0 1 .146-.353L11.354 1.646ZM12.5 2.5 4.207 10.793V13h2.207L13.5 4.707 12.5 3.707V2.5Z" /><path d="m10.854 3.146 2.292 2.292-8.5 8.5H2.5v-2.292l8.5-8.5Z" /></svg>;
const TrashIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className || "w-4 h-4"}><path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5zM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498-.075l-.275-5.5A.75.75 0 0 1 6.05 6zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711z" clipRule="evenodd" /></svg>;
const EyeIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className || "w-4 h-4"}><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" /><path fillRule="evenodd" d="M1.31 8.157a.75.75 0 0 1 0-.314C2.172 6.296 4.886 4.25 8 4.25s5.829 2.046 6.69 3.593a.75.75 0 0 1 0 .314C13.828 9.704 11.114 11.75 8 11.75S2.172 9.704 1.31 8.157ZM8 6.25a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Z" clipRule="evenodd" /></svg>;
const SortAscIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-3.5 h-3.5 ml-1 opacity-70"}><path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v12.5a.75.75 0 01-1.5 0V3.75A.75.75 0 0110 3zM3.75 6.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zm0 4a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z" clipRule="evenodd" /></svg>;
const SortDescIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-3.5 h-3.5 ml-1 opacity-70"}><path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V3.75a.75.75 0 011.5 0v12.5A.75.75 0 0110 17zM3.75 13.25a.75.75 0 000-1.5h4.5a.75.75 0 000 1.5h-4.5zm0-4a.75.75 0 000-1.5h2.5a.75.75 0 000 1.5h-2.5z" clipRule="evenodd" /></svg>;


interface TeamMembersListPageProps {
  teamMembers: TeamMember[];
  onOpenTeamMemberHRFormModal: (member?: TeamMember | null) => void;
  onDeleteTeamMemberHR: (memberId: string) => void;
  onOpenTeamMemberHRDetailPanel: (member: TeamMember) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  roleDefinitions: RoleDefinition[];
}

const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return '?';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0]?.toUpperCase() || '') + (parts[parts.length - 1][0]?.toUpperCase() || '');
};

const getHRStatusBadgeStyle = (status?: HRStatus): string => {
    let baseClasses = 'px-2 py-0.5 text-xs font-semibold rounded-full border ';
    switch (status) {
        case 'Active': return baseClasses + 'bg-green-100 text-status-positive dark:bg-status-positive/20 dark:text-status-positive border-status-positive/50';
        case 'Resigned': return baseClasses + 'bg-red-100 text-status-negative dark:bg-status-negative/20 dark:text-status-negative border-status-negative/50';
        case 'On Leave': return baseClasses + 'bg-sky-100 text-sky-700 dark:bg-sky-700/20 dark:text-sky-300 border-sky-400/50';
        case 'Probation': return baseClasses + 'bg-yellow-100 text-status-warning dark:bg-status-warning/20 dark:text-status-warning border-status-warning/50';
        case 'Contract': return baseClasses + 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700/20 dark:text-indigo-300 border-indigo-400/50';
        default: return baseClasses + 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400 border-slate-300 dark:border-slate-600';
    }
};


export const TeamMembersListPage: React.FC<TeamMembersListPageProps> = ({
  teamMembers, onOpenTeamMemberHRFormModal, onDeleteTeamMemberHR, onOpenTeamMemberHRDetailPanel, hasPermission, roleDefinitions
}) => {
  const canManageHRMembers = hasPermission('hrModule', 'canManageHRMembers');
  type SortableKey = 'name' | 'email' | 'jobTitle' | 'department' | 'hrStatus';
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });

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
  
  const sortedTeamMembers = useMemo(() => {
    let sortableItems = [...teamMembers];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = (a[sortConfig.key as keyof TeamMember] as string | undefined || '').toLowerCase();
        const valB = (b[sortConfig.key as keyof TeamMember] as string | undefined || '').toLowerCase();
        if (sortConfig.direction === 'ascending') {
            return valA.localeCompare(valB);
        } else {
            return valB.localeCompare(valA);
        }
      });
    }
    return sortableItems;
  }, [teamMembers, sortConfig]);

  const { paginatedData, ...paginationProps } = usePagination({ data: sortedTeamMembers });
  
  const TableHeader: React.FC<{ sortKey: SortableKey; label: string; }> = ({ sortKey, label }) => (
    <th 
        scope="col" 
        className="px-6 py-4 text-left text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        onClick={() => requestSort(sortKey)}
    >
        <div className="flex items-center gap-1">
            {label}
            {getSortIcon(sortKey)}
        </div>
    </th>
  );

  return (
    <Card 
      title="Team Members"
      className="bg-transparent shadow-none border-0 h-full flex flex-col" // Updated for tab content
      actions={
        canManageHRMembers && (
          <Button onClick={() => onOpenTeamMemberHRFormModal()} variant="primary" size="sm" leftIcon={<PlusIcon />}>
            Add Team Member
          </Button>
        )
      }
    >
      {teamMembers.length === 0 ? (
        <div className="text-center py-12 flex-grow flex flex-col items-center justify-center">
           <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
             <PlusIcon className="w-8 h-8"/>
           </div>
          <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">No team members found in HR Module.</p>
          {canManageHRMembers && (
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Get started by adding your first team member for HR records.</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto flex-grow">
          <table className="min-w-full divide-y divide-border-base dark:divide-border-muted">
            <thead className="bg-bg-muted dark:bg-slate-700/50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Photo</th>
                <TableHeader sortKey="name" label="Name" />
                <TableHeader sortKey="email" label="Email" />
                <TableHeader sortKey="jobTitle" label="Job Title" />
                <TableHeader sortKey="department" label="Department" />
                <TableHeader sortKey="hrStatus" label="Status" />
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-bg-base dark:bg-bg-muted divide-y divide-border-base dark:divide-border-muted">
              {paginatedData.map((member, index) => (
                <tr key={member.id} className={`transition-colors hover:bg-highlight-accent dark:hover:bg-slate-700/60 ${index % 2 !== 0 ? 'bg-slate-50/50 dark:bg-slate-700/30' : 'bg-bg-base dark:bg-bg-muted'}`}>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-sm font-semibold text-slate-500 dark:text-slate-400 overflow-hidden">
                        {member.profilePictureUrl ? (
                            <img src={member.profilePictureUrl} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                            getInitials(member.name)
                        )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-base dark:text-text-base">{member.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted dark:text-text-muted">{member.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted dark:text-text-muted">{member.jobTitle || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted dark:text-text-muted">{member.department || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center ${getHRStatusBadgeStyle(member.hrStatus)}`}>
                      {member.hrStatus || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-1">
                    <Button variant="ghost" size="xs" onClick={() => onOpenTeamMemberHRDetailPanel(member)} className="p-1.5 text-text-muted hover:text-premium-accent" title="View Details"><EyeIcon /></Button>
                    {canManageHRMembers && (
                      <>
                        <Button variant="ghost" size="xs" onClick={() => onOpenTeamMemberHRFormModal(member)} className="p-1.5 text-text-muted hover:text-premium-accent" title="Edit HR Details"><EditIcon /></Button>
                        <Button variant="ghost" size="xs" onClick={() => { if (window.confirm('Are you sure you want to delete this HR record?')) onDeleteTeamMemberHR(member.id);}} className="p-1.5 text-text-muted hover:text-status-negative" title="Delete HR Record"><TrashIcon /></Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination {...paginationProps} />
        </div>
      )}
    </Card>
  );
};
