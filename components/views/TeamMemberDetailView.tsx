

import React from 'react';
import { TeamMember, Project, Task, TimeLog, RoleDefinition, FeatureKey, PermissionAction, LeaveRequest } from '../../types'; 
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { safeFormatDate } from '@/utils';

interface TeamMemberDetailViewProps {
  member: TeamMember;
  projects: Project[];
  timeLogs: TimeLog[];
  roleDefinitions: RoleDefinition[];
  currentUser: TeamMember; 
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  onGoBack: () => void;
  onEditMember: (member: TeamMember) => void; // This will now trigger TeamActionModal
  leaveRequests: LeaveRequest[]; 
}

// Icons
const ArrowLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.56l2.72 2.72a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-text-muted dark:text-text-muted/80"><path d="M3.5 4.5A2.5 2.5 0 016 2h8a2.5 2.5 0 012.5 2.5v1A2.5 2.5 0 0114 8H6a2.5 2.5 0 01-2.5-2.5v-1z" /><path fillRule="evenodd" d="M2 9.5A2.5 2.5 0 014.5 7h11A2.5 2.5 0 0118 9.5V14a2.5 2.5 0 01-2.5 2.5H13v-2.5A2.5 2.5 0 0010.5 11h-1A2.5 2.5 0 007 13.5V16.5H4.5A2.5 2.5 0 012 14V9.5zM11.5 12a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>;
const ListBulletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-text-muted dark:text-text-muted/80"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 15.25z" clipRule="evenodd" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-text-muted dark:text-text-muted/80"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>;
const PalmTreeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-text-muted dark:text-text-muted/80"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364L19.75 17M12 18.75V21m-4.773-4.227L5.636 19.75M5.25 12H3m4.227-4.773L5.636 5.636m6.364-1.892L12 6m0 0l-1.25.75M12 6v6.75m0 0l-1.25.75M12 12.75l1.25.75M12 12.75V6m1.25-.75L12 6m0 0V4.5m6.75 6H12m0 0V4.5m-6.75 6H12m0 0V4.5" /></svg>;


const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return '?';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0]?.toUpperCase() || '') + (parts[parts.length - 1][0]?.toUpperCase() || '');
};


export const TeamMemberDetailView: React.FC<TeamMemberDetailViewProps> = ({
  member, projects, timeLogs, roleDefinitions, currentUser, hasPermission, onGoBack, onEditMember, leaveRequests
}) => {
  const canEditMember = hasPermission('adminUsers', 'canManage');
  const roleName = member.roleId ? (roleDefinitions.find(r => r.id === member.roleId)?.name || member.role) : member.role;

  const assignedProjects = projects.filter(p => p.assignedMemberIds?.includes(member.id));
  const assignedTasks: (Task & { projectName: string })[] = projects.flatMap(p => 
    p.tasks.filter(t => t.assignedMemberId === member.id).map(t => ({...t, projectName: p.name}))
  ).sort((a,b) => (a.dueDate && b.dueDate) ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() : (a.dueDate ? -1 : 1) );

  const recentTimeLogs = timeLogs
    .filter(log => log.memberId === member.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10); 

  const memberLeaveRequests = leaveRequests
    .filter(req => req.memberId === member.id)
    .sort((a,b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime())
    .slice(0, 5); 

  return (
    <div className="space-y-6 bg-slate-50 dark:bg-slate-900/30 p-4 sm:p-6 rounded-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button onClick={onGoBack} variant="ghost" size="sm" leftIcon={<ArrowLeftIcon />} className="mb-1 text-premium-accent dark:text-premium-accent-dark hover:text-premium-accent-darker dark:hover:text-premium-accent">
            Back to Team List
          </Button>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-3xl sm:text-4xl font-semibold text-slate-500 dark:text-slate-400 overflow-hidden shadow-md">
              {member.profilePictureUrl ? (
                <img src={member.profilePictureUrl} alt={`${member.name}'s profile`} className="w-full h-full object-cover" />
              ) : (
                getInitials(member.name)
              )}
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-text-base dark:text-text-base">{member.name}</h2>
              <p className="text-text-muted dark:text-slate-400">{roleName || 'N/A'}</p>
            </div>
          </div>
        </div>
        {canEditMember && (
            <Button onClick={() => onEditMember(member)} variant="primary" size="md" leftIcon={<EditIcon />}>
            Edit Member
            </Button>
        )}
      </div>

      {/* Basic Info Card */}
      <Card title="Basic Information" className="bg-bg-base dark:bg-bg-muted shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm p-1">
          <p><strong className="text-text-muted dark:text-text-muted">Email:</strong> <span className="text-text-base dark:text-text-base">{member.email}</span></p>
          <p><strong className="text-text-muted dark:text-text-muted">Date Joined:</strong> <span className="text-text-base dark:text-text-base">{safeFormatDate(member.dateJoined)}</span></p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Assigned Projects" icon={<BriefcaseIcon />} className="bg-bg-base dark:bg-bg-muted shadow-lg">
          {assignedProjects.length > 0 ? (
            <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {assignedProjects.map(project => (
                <li key={project.id} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-border-muted text-sm text-premium-accent hover:text-premium-accent-dark dark:text-premium-accent-dark dark:hover:text-premium-accent hover:underline cursor-pointer" onClick={() => {/* TODO: Navigate to project detail */}}>
                  {project.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted dark:text-text-muted">Not assigned to any projects.</p>
          )}
        </Card>

        <Card title="Currently Assigned Tasks" icon={<ListBulletIcon />} className="bg-bg-base dark:bg-bg-muted shadow-lg">
          {assignedTasks.length > 0 ? (
            <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {assignedTasks.map(task => (
                <li key={task.id} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-border-muted text-sm">
                  <strong className="text-text-base dark:text-text-base block">{task.title}</strong>
                  <span className="text-xs text-text-muted dark:text-text-muted">Project: {task.projectName}</span>
                  {task.dueDate && <span className="text-xs text-text-muted dark:text-text-muted ml-2"> | Due: {safeFormatDate(task.dueDate)}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted dark:text-text-muted">No tasks currently assigned.</p>
          )}
        </Card>
      </div>

      <Card title="Recent Time Logs" icon={<ClockIcon />} className="bg-bg-base dark:bg-bg-muted shadow-lg">
        {recentTimeLogs.length > 0 ? (
          <div className="overflow-x-auto max-h-80">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase text-text-muted dark:text-text-muted">
                <tr>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Project</th>
                  <th className="p-2 text-left">Task</th>
                  <th className="p-2 text-right">Hours</th>
                  <th className="p-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base dark:divide-border-muted">
                {recentTimeLogs.map(log => (
                  <tr key={log.id} className="hover:bg-highlight-accent dark:hover:bg-slate-700/30">
                    <td className="p-2 whitespace-nowrap">{safeFormatDate(log.date)}</td>
                    <td className="p-2 whitespace-nowrap">{projects.find(p => p.id === log.projectId)?.name || 'N/A'}</td>
                    <td className="p-2 whitespace-nowrap text-xs italic">{log.taskId ? projects.flatMap(p => p.tasks).find(t => t.id === log.taskId)?.title : '-'}</td>
                    <td className="p-2 text-right whitespace-nowrap font-medium">{log.hours.toFixed(1)}</td>
                    <td className="p-2 whitespace-normal max-w-xs truncate" title={log.notes}>{log.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-text-muted dark:text-text-muted">No time logs recorded recently.</p>
        )}
      </Card>
      
      <Card title="Recent Leave Requests" icon={<PalmTreeIcon />} className="bg-bg-base dark:bg-bg-muted shadow-lg">
        {memberLeaveRequests.length > 0 ? (
          <div className="overflow-x-auto max-h-60">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase text-text-muted dark:text-text-muted">
                <tr>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Dates</th>
                  <th className="p-2 text-left">Reason</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base dark:divide-border-muted">
                {memberLeaveRequests.map(req => (
                  <tr key={req.id} className="hover:bg-highlight-accent dark:hover:bg-slate-700/30">
                    <td className="p-2 whitespace-nowrap">{req.leaveType}</td>
                    <td className="p-2 whitespace-nowrap">{safeFormatDate(req.startDate)} - {safeFormatDate(req.endDate)}</td>
                    <td className="p-2 whitespace-normal max-w-xs truncate" title={req.reason}>{req.reason}</td>
                    <td className="p-2 whitespace-nowrap">{req.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-text-muted dark:text-text-muted">No recent leave requests.</p>
        )}
      </Card>
    </div>
  );
};