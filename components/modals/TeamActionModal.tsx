
import React, { useState, useEffect, useRef } from 'react';
import { TeamMember, RoleDefinition, LeaveRequest, LeaveType, leaveTypes, TeamMemberRole } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';

export type TeamActionModalMode = 'MEMBER_FORM' | 'LEAVE_FORM';

interface TeamActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: TeamActionModalMode;
  
  // Member Form Props
  memberToEdit?: TeamMember | null;
  onSaveMember?: (memberData: TeamMember) => void;
  roleDefinitions?: RoleDefinition[];
  
  // Leave Form Props
  leaveRequestToEdit?: LeaveRequest | null;
  onSaveLeaveRequest?: (leaveRequestData: LeaveRequest) => void;
  currentUserId?: string;
  currentUserName?: string;
  onSetDirty: (isDirty: boolean) => void;
}

// --- Member Form Specific Types ---
interface TeamMemberFormData {
  name: string;
  email: string;
  roleId: string;
  password?: string;
  confirmPassword?: string;
}
const initialMemberFormData: TeamMemberFormData = { name: '', email: '', roleId: '', password: '', confirmPassword: '' };

// --- Leave Form Specific Types ---
interface LeaveRequestFormData {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}
const initialLeaveFormData: LeaveRequestFormData = { leaveType: 'Annual', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], reason: '' };

// --- Error Types ---
type MemberFormErrors = Partial<Record<keyof TeamMemberFormData, string>>;
type LeaveFormErrors = Partial<Record<keyof LeaveRequestFormData, string>>;


export const TeamActionModal: React.FC<TeamActionModalProps> = ({
  isOpen, onClose, mode,
  memberToEdit, onSaveMember, roleDefinitions,
  leaveRequestToEdit, onSaveLeaveRequest, currentUserId, currentUserName, onSetDirty
}) => {
  const [memberFormData, setMemberFormData] = useState<TeamMemberFormData>(initialMemberFormData);
  const [leaveFormData, setLeaveFormData] = useState<LeaveRequestFormData>(initialLeaveFormData);
  const [errors, setErrors] = useState<MemberFormErrors | LeaveFormErrors | {}>({});
  const initialFormStateRef = useRef<TeamMemberFormData | LeaveRequestFormData | null>(null);


  useEffect(() => {
    if (!isOpen) {
      setErrors({}); 
      return;
    }
    let currentInitialState: TeamMemberFormData | LeaveRequestFormData;

    if (mode === 'MEMBER_FORM') {
      const defaultRoleId = roleDefinitions && (roleDefinitions.find(r => r.name.toLowerCase() === 'team member')?.id || (roleDefinitions.length > 0 ? roleDefinitions[0].id : ''));
      if (memberToEdit) {
        currentInitialState = {
          name: memberToEdit.name,
          email: memberToEdit.email,
          roleId: memberToEdit.roleId || defaultRoleId || '',
          password: '',
          confirmPassword: '',
        };
      } else {
        currentInitialState = {...initialMemberFormData, roleId: defaultRoleId || '' };
      }
      setMemberFormData(currentInitialState as TeamMemberFormData);
    } else if (mode === 'LEAVE_FORM') {
      if (leaveRequestToEdit) {
        currentInitialState = {
          leaveType: leaveRequestToEdit.leaveType,
          startDate: (leaveRequestToEdit.startDate ?? '').split('T')[0],
          endDate: (leaveRequestToEdit.endDate ?? '').split('T')[0],
          reason: leaveRequestToEdit.reason,
        };
      } else {
        const today = new Date().toISOString().split('T')[0];
        currentInitialState = {...initialLeaveFormData, startDate: today, endDate: today};
      }
      setLeaveFormData(currentInitialState as LeaveRequestFormData);
    }
    initialFormStateRef.current = JSON.parse(JSON.stringify(currentInitialState!));
    onSetDirty(false);
  }, [isOpen, mode, memberToEdit, leaveRequestToEdit, roleDefinitions, onSetDirty]);

  useEffect(() => {
    if (!isOpen) return;
    const currentData = mode === 'MEMBER_FORM' ? memberFormData : leaveFormData;
    if (JSON.stringify(currentData) !== JSON.stringify(initialFormStateRef.current)) {
      onSetDirty(true);
    } else {
      onSetDirty(false);
    }
  }, [memberFormData, leaveFormData, mode, isOpen, onSetDirty]);

  const handleMemberFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMemberFormData(prev => ({ ...prev, [name]: value }));
    if ((errors as MemberFormErrors)[name as keyof TeamMemberFormData]) setErrors((prev: any) => ({ ...prev, [name]: undefined }));
  };
  
  const handleLeaveFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLeaveFormData(prev => ({ ...prev, [name]: value }));
    if ((errors as LeaveFormErrors)[name as keyof LeaveRequestFormData]) setErrors((prev: any) => ({ ...prev, [name]: undefined }));
  };

  const validateMemberForm = (): boolean => {
    const newErrors: MemberFormErrors = {};
    if (!memberFormData.name.trim()) newErrors.name = "Member name is required.";
    if (!memberFormData.email.trim()) {
        newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(memberFormData.email)) {
        newErrors.email = "Email is invalid.";
    }
    if (!memberFormData.roleId) newErrors.roleId = "Role is required.";
    if (!memberToEdit && !memberFormData.password) newErrors.password = "Password is required for new members.";
    if (memberFormData.password && memberFormData.password.length < 6) newErrors.password = "Password must be at least 6 characters long.";
    if (memberFormData.password && memberFormData.password !== memberFormData.confirmPassword) newErrors.confirmPassword = "Passwords do not match.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateLeaveForm = (): boolean => {
    const newErrors: LeaveFormErrors = {};
    if (!leaveFormData.leaveType) newErrors.leaveType = "Leave type is required.";
    if (!leaveFormData.startDate) newErrors.startDate = "Start date is required.";
    if (!leaveFormData.endDate) newErrors.endDate = "End date is required.";
    if (new Date(leaveFormData.endDate) < new Date(leaveFormData.startDate)) newErrors.endDate = "End date cannot be before start date.";
    if (!leaveFormData.reason.trim()) newErrors.reason = "Reason for leave is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'MEMBER_FORM' && onSaveMember) {
      if (!validateMemberForm()) return;
      const selectedRoleDef = roleDefinitions?.find(r => r.id === memberFormData.roleId);
      const memberToSave: TeamMember = {
        id: memberToEdit?.id || '', dateJoined: memberToEdit?.dateJoined || '',
        name: memberFormData.name, email: memberFormData.email,
        roleId: memberFormData.roleId,
        role: selectedRoleDef ? selectedRoleDef.name as TeamMemberRole : 'Member', // Fallback
        ...(memberFormData.password && { password: memberFormData.password }),
        profilePictureUrl: memberToEdit?.profilePictureUrl || '', // Preserve profile picture
      };
      onSaveMember(memberToSave);
    } else if (mode === 'LEAVE_FORM' && onSaveLeaveRequest && currentUserId && currentUserName) {
      if (!validateLeaveForm()) return;
      const requestToSave: LeaveRequest = {
        id: leaveRequestToEdit?.id || '',
        memberId: leaveRequestToEdit?.memberId || currentUserId,
        memberName: leaveRequestToEdit?.memberName || currentUserName,
        requestedDate: leaveRequestToEdit?.requestedDate || new Date().toISOString(),
        status: leaveRequestToEdit?.status || 'Pending',
        ...leaveFormData,
        adminNotes: leaveRequestToEdit?.adminNotes,
        reviewedByUserId: leaveRequestToEdit?.reviewedByUserId,
        reviewedDate: leaveRequestToEdit?.reviewedDate,
      };
      onSaveLeaveRequest(requestToSave);
    }
    onSetDirty(false);
  };

  const modalTitle = mode === 'MEMBER_FORM' 
    ? (memberToEdit ? 'Edit Team Member' : 'Add New Team Member')
    : (leaveRequestToEdit ? 'Edit Leave Request' : 'Request New Leave');
  
  const saveButtonText = mode === 'MEMBER_FORM'
    ? (memberToEdit ? 'Save Changes' : 'Add Member')
    : (leaveRequestToEdit ? 'Update Request' : 'Submit Request');

  const selectBaseClass = "w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 text-slate-900 dark:text-slate-100";
  const labelClassSmall = "block text-xs font-medium text-text-muted dark:text-text-muted mb-1";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="xl"
      footer={ <> <Button variant="secondary" onClick={onClose}>Cancel</Button> <Button variant="primary" onClick={handleSubmit} type="submit">{saveButtonText}</Button> </> }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'MEMBER_FORM' && roleDefinitions && (
          <>
            <Input label="Full Name *" id="name" name="name" value={memberFormData.name} onChange={handleMemberFormChange} error={(errors as MemberFormErrors).name} required />
            <Input label="Email Address *" id="email" name="email" type="email" value={memberFormData.email} onChange={handleMemberFormChange} error={(errors as MemberFormErrors).email} required />
            <div>
              <label htmlFor="roleId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role *</label>
              <select id="roleId" name="roleId" value={memberFormData.roleId} onChange={handleMemberFormChange} className={`${selectBaseClass} ${(errors as MemberFormErrors).roleId ? 'border-red-500' : ''}`} required>
                <option value="" disabled>Select a role</option>
                {roleDefinitions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              {(errors as MemberFormErrors).roleId && <p className="mt-1 text-xs text-red-600">{(errors as MemberFormErrors).roleId}</p>}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {memberToEdit ? "Leave password fields blank to keep current." : "Set initial password."} (Conceptual)
            </p>
            <Input label="Password" id="password" name="password" type="password" value={memberFormData.password || ''} onChange={handleMemberFormChange} error={(errors as MemberFormErrors).password} placeholder={memberToEdit ? "New Password (min. 6 chars)" : "Password (min. 6 chars)"}/>
            <Input label="Confirm Password" id="confirmPassword" name="confirmPassword" type="password" value={memberFormData.confirmPassword || ''} onChange={handleMemberFormChange} error={(errors as MemberFormErrors).confirmPassword} placeholder="Confirm New Password"/>
          </>
        )}

        {mode === 'LEAVE_FORM' && (
          <>
            <div>
              <label htmlFor="leaveType" className={labelClassSmall}>Leave Type *</label>
              <select id="leaveType" name="leaveType" value={leaveFormData.leaveType} onChange={handleLeaveFormChange} className={`${selectBaseClass} ${(errors as LeaveFormErrors).leaveType ? 'border-status-negative' : ''}`} required>
                {leaveTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              {(errors as LeaveFormErrors).leaveType && <p className="mt-1 text-xs text-status-negative">{(errors as LeaveFormErrors).leaveType}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Start Date *" id="startDate" name="startDate" type="date" value={leaveFormData.startDate} onChange={handleLeaveFormChange} error={(errors as LeaveFormErrors).startDate} required labelClassName={labelClassSmall} className="!text-sm" />
              <Input label="End Date *" id="endDate" name="endDate" type="date" value={leaveFormData.endDate} onChange={handleLeaveFormChange} error={(errors as LeaveFormErrors).endDate} required labelClassName={labelClassSmall} className="!text-sm" />
            </div>
            <TextArea label="Reason for Leave *" id="reason" name="reason" value={leaveFormData.reason} onChange={handleLeaveFormChange} error={(errors as LeaveFormErrors).reason} rows={3} placeholder="Please provide a brief reason..." required labelClassName={labelClassSmall} className="!text-sm"/>
          </>
        )}
      </form>
    </Modal>
  );
};
