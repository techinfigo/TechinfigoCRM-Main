
import React from 'react';
import { Modal } from '../../common/Modal'; 
import { TeamMember, RoleDefinition, LeaveRequest, Project, DailyAttendanceRecord, HRStatus } from '../../../types';
import { EmployeeDetailView } from '../../hr_module/EmployeeDetailView';

export interface TeamMemberHRDetailModalProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (member: TeamMember) => void; 
  roleDefinitions: RoleDefinition[];
  leaveRequests: LeaveRequest[]; 
  projects: Project[]; 
  dailyAttendanceRecords: DailyAttendanceRecord[];
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
        case 'Active': return baseClasses + 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
        case 'Resigned': return baseClasses + 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
        case 'On Leave': return baseClasses + 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800';
        case 'Probation': return baseClasses + 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
        case 'Contract': return baseClasses + 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800';
        default: return baseClasses + 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
};

export const TeamMemberHRDetailModal: React.FC<TeamMemberHRDetailModalProps> = ({
  member, isOpen, onClose, onEdit, roleDefinitions, leaveRequests, projects, dailyAttendanceRecords
}) => {
  if (!isOpen || !member) {
    return null;
  }

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-premium-accent text-xl shrink-0 overflow-hidden shadow-sm border border-slate-300 dark:border-slate-600">
                    {member.profilePictureUrl ? (
                        <img src={member.profilePictureUrl} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                        getInitials(member.name)
                    )}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-text-heading dark:text-text-heading leading-tight">{member.name}</h2>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className="text-text-muted dark:text-slate-400 font-medium">{member.jobTitle || 'No Title'}</span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className={getHRStatusBadgeStyle(member.hrStatus)}>{member.hrStatus || 'Active'}</span>
                    </div>
                </div>
            </div>
        } 
        size="6xl" 
        overrideZIndex="z-[1050]"
    >
      <EmployeeDetailView
        employee={member}
        onEditRequest={onEdit} 
        roleDefinitions={roleDefinitions}
        leaveRequests={leaveRequests}
        projects={projects}
        dailyAttendanceRecords={dailyAttendanceRecords} 
      />
    </Modal>
  );
};
