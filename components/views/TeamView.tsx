
import React, { useState, useMemo } from 'react';
import { TeamMember, FeatureKey, PermissionAction, RoleDefinition } from '../../types'; 
import { Button } from '../common/Button'; 
import { Card } from '../common/Card'; 
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';

interface TeamViewProps {
  teamMembers: TeamMember[];
  onAddMember: () => void;
  onEditMember: (member: TeamMember) => void;
  onDeleteMember: (memberId: string) => void;
  onViewMemberDetail: (member: TeamMember) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  roleDefinitions: RoleDefinition[];
}

// Icons
const PlusIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
)
const EditIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
        <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
    </svg>
)
const TrashIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25-.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
    </svg>
)
const SortAscIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-3.5 h-3.5 ml-1 opacity-70"}>
        <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v12.5a.75.75 0 01-1.5 0V3.75A.75.75 0 0110 3zM3.75 6.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zm0 4a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z" clipRule="evenodd" />
    </svg>
)
const SortDescIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-3.5 h-3.5 ml-1 opacity-70"}>
        <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V3.75a.75.75 0 011.5 0v12.5A.75.75 0 0110 17zM3.75 13.25a.75.75 0 000-1.5h4.5a.75.75 0 000 1.5h-4.5zm0-4a.75.75 0 000-1.5h2.5a.75.75 0 000 1.5h-2.5z" clipRule="evenodd" />
    </svg>
)

const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return '?';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0]?.toUpperCase() || '') + (parts[parts.length - 1][0]?.toUpperCase() || '');
};

const getRoleColorClass = (roleName: string, roleDefinitions: RoleDefinition[], roleId?: string): string => {
    const roleDef = roleId ? roleDefinitions.find(r => r.id === roleId) : roleDefinitions.find(r => r.name === roleName);
    const nameLower = (roleDef?.name || roleName || '').toLowerCase();
    
    if (nameLower.includes('admin')) return 'bg-red-100 text-red-800 dark:bg-red-700/30 dark:text-red-300 border-red-300 dark:border-red-600';
    if (nameLower.includes('manager')) return 'bg-purple-100 text-purple-800 dark:bg-purple-700/30 dark:text-purple-300 border-purple-300 dark:border-purple-600';
    if (nameLower.includes('strategist')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600';
    if (nameLower.includes('design')) return 'bg-sky-100 text-sky-800 dark:bg-sky-700/30 dark:text-sky-300 border-sky-300 dark:border-sky-600';
    if (nameLower.includes('develop')) return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-700/30 dark:text-indigo-300 border-indigo-300 dark:border-indigo-600';
    if (nameLower.includes('member') || nameLower.includes('team')) return 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300 border-green-300 dark:border-green-600';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-600/30 dark:text-slate-300 border-slate-300 dark:border-slate-500';
};

export const TeamView: React.FC<TeamViewProps> = ({
  teamMembers,
  onAddMember,
  onEditMember,
  onDeleteMember,
  hasPermission,
  roleDefinitions
}) => {
  const canManageTeam = hasPermission('adminUsers', 'canManage');
  type SortableKey = 'name' | 'email' | 'role';
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

  const filteredTeamMembers = useMemo(() => {
      let sortableItems = [...teamMembers];
      if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
          let valA: string = '';
          let valB: string = '';

          if (sortConfig.key === 'role') {
              valA = a.roleId ? (roleDefinitions.find(r => r.id === a.roleId)?.name || a.role) : a.role;
              valB = b.roleId ? (roleDefinitions.find(r => r.id === b.roleId)?.name || b.role) : b.role;
          } else {
              valA = (a[sortConfig.key] || '');
              valB = (b[sortConfig.key] || '');
          }

          if (sortConfig.direction === 'ascending') {
              return valA.localeCompare(valB);
          } else {
              return valB.localeCompare(valA);
          }
        });
      }
      return sortableItems;
  }, [teamMembers, sortConfig, roleDefinitions]);
  
  const { paginatedData, ...paginationProps } = usePagination({ data: filteredTeamMembers });

  const TableHeader: React.FC<{ sortKey: SortableKey; label: string; }> = ({ sortKey, label }) => (
    <th 
        scope="col" 
        className="px-4 py-3 text-left text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
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
      title="Team Directory"
      className="bg-transparent shadow-none border-0 h-full flex flex-col"
      actions={
        canManageTeam && (
          <Button onClick={onAddMember} variant="primary" size="sm" leftIcon={<PlusIcon />}>
            Add Member
          </Button>
        )
      }
    >
      <div className="overflow-x-auto flex-grow">
        <table className="min-w-full divide-y divide-border-base dark:divide-border-muted">
          <thead className="bg-bg-muted dark:bg-slate-700/50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Photo</th>
              <TableHeader sortKey="name" label="Name" />
              <TableHeader sortKey="email" label="Email" />
              <TableHeader sortKey="role" label="Role" />
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
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                   <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleColorClass(member.role, roleDefinitions, member.roleId)}`}>
                      {member.roleId ? (roleDefinitions.find(r => r.id === member.roleId)?.name || member.role) : member.role}
                   </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-1">
                  {canManageTeam && (
                    <>
                      <Button variant="ghost" size="xs" onClick={() => onEditMember(member)} className="p-1.5 text-text-muted hover:text-premium-accent" title="Edit Member"><EditIcon /></Button>
                      <Button variant="ghost" size="xs" onClick={() => { if (window.confirm(`Are you sure you want to remove ${member.name}?`)) onDeleteMember(member.id);}} className="p-1.5 text-text-muted hover:text-status-negative" title="Delete Member"><TrashIcon /></Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination {...paginationProps} />
      </div>
    </Card>
  );
};
