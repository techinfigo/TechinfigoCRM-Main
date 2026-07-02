
import React from 'react';
import { TeamMember, RoleDefinition, LeaveRequest, Project } from '../../../types'; // Adjust path as needed
import { Button } from '../../common/Button'; // Adjust path as needed

// Define an interface for the props
export interface TeamMemberHRDetailPanelProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (member: TeamMember) => void;
  roleDefinitions: RoleDefinition[];
  leaveRequests: LeaveRequest[]; // Added this prop
  projects: Project[]; // Added this prop
}

const XMarkIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>;
const EditIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>;


const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return '?';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0]?.toUpperCase() || '') + (parts[parts.length - 1][0]?.toUpperCase() || '');
};

// Placeholder component implementation
export const TeamMemberHRDetailPanel: React.FC<TeamMemberHRDetailPanelProps> = ({ 
    member, isOpen, onClose, onEdit, roleDefinitions, leaveRequests, projects 
}) => {
  if (!isOpen || !member) return null;

  const appRoleName = member.roleId 
    ? (roleDefinitions.find(r => r.id === member.roleId)?.name || member.role) 
    : member.role;

  const detailItem = (label: string, value: string | undefined | null, className?: string) => (
    <div className={`py-2 ${className || ''}`}>
      <dt className="text-xs font-medium text-text-muted dark:text-slate-400">{label}</dt>
      <dd className="text-sm text-text-base dark:text-slate-200">{value || 'N/A'}</dd>
    </div>
  );

  return (
     <div 
      className={`fixed inset-0 z-[70] overflow-hidden transition-transform duration-300 ease-in-out print-hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      aria-labelledby="slide-over-title" 
      role="dialog" 
      aria-modal="true"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
          <div className="w-screen max-w-md">
            <div className="flex h-full flex-col overflow-y-scroll bg-bg-base dark:bg-slate-800 shadow-xl border-l border-border-base dark:border-slate-700">
              {/* Header */}
              <div className="bg-bg-muted dark:bg-slate-700/50 px-4 py-4 sm:px-6 sticky top-0 z-10 border-b border-border-base dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 id="slide-over-title" className="text-lg font-semibold text-text-base dark:text-slate-100">
                    Team Member HR Profile
                  </h2>
                  <div className="ml-3 flex h-7 items-center">
                    <button
                      type="button"
                      className="rounded-md p-1 text-text-muted dark:text-slate-400 hover:text-text-base dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-premium-accent"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close panel</span>
                      <XMarkIcon />
                    </button>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="relative flex-1 px-4 py-5 sm:px-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 pb-4 border-b border-border-base dark:border-slate-700">
                    <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-3xl font-semibold text-slate-500 dark:text-slate-400 overflow-hidden">
                        {member.profilePictureUrl ? (
                            <img src={member.profilePictureUrl} alt={`${member.name}'s profile`} className="w-full h-full object-cover" />
                        ) : (
                            getInitials(member.name)
                        )}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-text-base dark:text-slate-100">{member.name}</h3>
                        <p className="text-sm text-text-muted dark:text-slate-400">{member.jobTitle || 'N/A'}</p>
                    </div>
                  </div>
                   <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                      {detailItem("Full Name", member.name)}
                      {detailItem("Email Address", member.email)}
                      {detailItem("Phone Number", member.phoneNumber)}
                      {detailItem("Job Title", member.jobTitle)}
                      {detailItem("Department", member.department)}
                      {detailItem("Joining Date", new Date(member.dateJoined).toLocaleDateString())}
                      {detailItem("HR Status", member.hrStatus)}
                      {detailItem("App Access Role", appRoleName)}
                      {member.hrNotes && detailItem("HR Notes", member.hrNotes, "sm:col-span-2 whitespace-pre-wrap")}
                    </dl>
                    <p className="text-sm text-text-muted dark:text-slate-400">Leave requests: {leaveRequests.length}</p>
                    <p className="text-sm text-text-muted dark:text-slate-400">Projects involved in: {projects.length}</p>
                  <div className="pt-4 border-t border-border-base dark:border-slate-700">
                     <Button variant="primary" onClick={() => onEdit(member)} leftIcon={<EditIcon/>}>
                        Edit HR Details
                     </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberHRDetailPanel;
