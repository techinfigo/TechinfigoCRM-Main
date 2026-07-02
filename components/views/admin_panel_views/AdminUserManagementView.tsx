

import React, { useState } from 'react';
import { TeamMember, TeamMemberRole, FeatureKey, PermissionAction, RoleDefinition } from '../../../types'; 
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';

interface AdminUserManagementViewProps {
  teamMembers: TeamMember[];
  onOpenTeamMemberModal: (member: TeamMember | null) => void;
  onDeleteMember: (memberId: string) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  roleDefinitions: RoleDefinition[];
}

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25-.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>

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
const teamMemberRoles: TeamMemberRole[] = ['Admin', 'Manager', 'Strategist', 'Designer', 'Developer', 'Member'];


export const AdminUserManagementView: React.FC<AdminUserManagementViewProps> = ({ teamMembers, onOpenTeamMemberModal, onDeleteMember, hasPermission, roleDefinitions }) => {
  const [filterRole, setFilterRole] = useState<TeamMemberRole | 'All'>('All');
  // const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('All'); // Conceptual

  const canManageUsers = hasPermission('adminUsers', 'canManage');

  const handleAddNewUser = () => {
    onOpenTeamMemberModal(null); // Pass null to indicate adding a new member
  };

  const handleEditUser = (member: TeamMember) => {
    onOpenTeamMemberModal(member);
  };

  const handleDeleteUser = (member: TeamMember) => {
    if (window.confirm(`Are you sure you want to delete user ${member.name}? This will unassign them from projects.`)) {
      onDeleteMember(member.id);
    }
  };

  const filteredTeamMembers = teamMembers.filter(member => {
    const roleName = member.roleId ? roleDefinitions.find(r => r.id === member.roleId)?.name : member.role;
    const roleMatch = filterRole === 'All' || roleName === filterRole;
    // const statusMatch = filterStatus === 'All'; // Add logic if status is implemented
    return roleMatch; // && statusMatch;
  });
  
  const selectBaseClass = "p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm";


  return (
    <Card 
      title="User Management (Team Members)"
      className="bg-white dark:bg-slate-800"
      actions={
        canManageUsers && (
            <Button onClick={handleAddNewUser} variant="primary" size="sm" leftIcon={<PlusIcon />}>
            Add New User
            </Button>
        )
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
        Manage team members who have access to this CRM instance. For full user authentication with login credentials and app-wide permissions, backend integration and a dedicated authentication system are required.
      </p>
      
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <select 
          value={filterRole} 
          onChange={(e) => setFilterRole(e.target.value as TeamMemberRole | 'All')}
          className={selectBaseClass}
        >
          <option value="All">All Roles</option>
          {roleDefinitions.map(role => <option key={role.id} value={role.name}>{role.name}</option>)}
        </select>
      </div>

      {filteredTeamMembers.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-center py-6">No users (team members) found matching your criteria.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status (Conceptual)</th>
                {canManageUsers && <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTeamMembers.map((member) => {
                const roleName = member.roleId ? (roleDefinitions.find(r => r.id === member.roleId)?.name || member.role) : member.role;
                return (
                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-100">{member.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{member.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleColorClass(roleName, roleDefinitions, member.roleId)}`}>
                      {roleName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                     <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300 border border-green-300 dark:border-green-600">
                        Active
                     </span>
                  </td>
                  {canManageUsers && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                        <Button variant="ghost" size="xs" onClick={() => handleEditUser(member)} aria-label={`Edit ${member.name}`} className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 p-1.5">
                        <EditIcon /> <span className="ml-1 hidden sm:inline">Edit Role</span>
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => handleDeleteUser(member)} className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-300 p-1.5" aria-label={`Delete ${member.name}`}>
                        <TrashIcon /> <span className="ml-1 hidden sm:inline">Delete User</span>
                        </Button>
                    </td>
                  )}
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};