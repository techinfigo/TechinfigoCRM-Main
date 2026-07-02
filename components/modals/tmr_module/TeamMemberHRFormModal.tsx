import React, { useState, useEffect, useRef } from 'react';
import { TeamMember, RoleDefinition, HRStatus, hrStatuses, TeamMemberRole } from '../../../types';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { Input, TextArea } from '../../common/Input';

interface TeamMemberHRFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: TeamMember) => void; // Expects the full TeamMember object
  member: TeamMember | null;
  roleDefinitions: RoleDefinition[]; // Kept for consistency, though might not be directly used if app role is separate
  onSetDirty: (isDirty: boolean) => void;
}

interface TeamMemberHRFormData {
  name: string;
  email: string;
  phoneNumber?: string;
  jobTitle?: string; // This is the HR "Role" field
  department?: string;
  joiningDate: string; // Corresponds to TeamMember.dateJoined
  hrStatus: HRStatus;
  hrNotes?: string;
  profilePictureUrl?: string; 
}

const initialFormData: TeamMemberHRFormData = {
  name: '',
  email: '',
  phoneNumber: '',
  jobTitle: '',
  department: '',
  joiningDate: new Date().toISOString().split('T')[0],
  hrStatus: 'Active',
  hrNotes: '',
  profilePictureUrl: '',
};

export const TeamMemberHRFormModal: React.FC<TeamMemberHRFormModalProps> = ({ isOpen, onClose, onSave, member, roleDefinitions, onSetDirty }) => {
  const [formData, setFormData] = useState<TeamMemberHRFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof TeamMemberHRFormData, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const initialFormStateRef = useRef<TeamMemberHRFormData | null>(null);


  useEffect(() => {
    if (isOpen) {
        let currentInitialState: TeamMemberHRFormData;
        if (member) {
            currentInitialState = {
                name: member.name,
                email: member.email,
                phoneNumber: member.phoneNumber || '',
                jobTitle: member.jobTitle || '',
                department: member.department || '',
                joiningDate: (member.dateJoined || new Date().toISOString()).split('T')[0],
                hrStatus: member.hrStatus || 'Active',
                hrNotes: member.hrNotes || '',
                profilePictureUrl: member.profilePictureUrl || '',
            };
            setProfilePicturePreview(member.profilePictureUrl || null);
        } else {
            currentInitialState = initialFormData;
            setProfilePicturePreview(null);
        }
        setFormData(currentInitialState);
        initialFormStateRef.current = JSON.parse(JSON.stringify(currentInitialState));
        onSetDirty(false);
        setErrors({});
    }
  }, [member, isOpen, onSetDirty]);

  useEffect(() => {
    if (!isOpen) return;
    if (JSON.stringify(formData) !== JSON.stringify(initialFormStateRef.current)) {
      onSetDirty(true);
    } else {
      onSetDirty(false);
    }
  }, [formData, isOpen, onSetDirty]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof TeamMemberHRFormData]) {
        setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({...prev, profilePictureUrl: "Invalid file type. Please select an image."}));
        return;
      }
       if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setErrors(prev => ({...prev, profilePictureUrl: "File too large (max 2MB)."}));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
        setFormData(prev => ({ ...prev, profilePictureUrl: reader.result as string }));
         setErrors(prev => ({ ...prev, profilePictureUrl: undefined })); // Clear error on success
      };
      reader.readAsDataURL(file);
    }
  };
  
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TeamMemberHRFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required.";
    if (!formData.email.trim()) {
        newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Email is invalid.";
    }
    if (!formData.jobTitle?.trim()) newErrors.jobTitle = "Job title is required.";
    if (!formData.department?.trim()) newErrors.department = "Department is required.";
    if (!formData.joiningDate) newErrors.joiningDate = "Joining date is required.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const memberToSave: TeamMember = {
      // Preserve existing non-HR fields if editing
      id: member?.id || '', 
      role: member?.role || 'Member', 
      roleId: member?.roleId || roleDefinitions.find(r => r.name.toLowerCase() === 'team member')?.id || '',
      password: member?.password, // Password is not managed here

      // HR Form Data
      name: formData.name,
      email: formData.email,
// FIX: Preserve original dateJoined when editing.
      dateJoined: member?.dateJoined || new Date(formData.joiningDate).toISOString(), 
      profilePictureUrl: formData.profilePictureUrl,
      jobTitle: formData.jobTitle,
      phoneNumber: formData.phoneNumber,
      department: formData.department,
      hrStatus: formData.hrStatus,
      hrNotes: formData.hrNotes,
    };
    onSave(memberToSave);
    onSetDirty(false);
  };

  const selectBaseClass = "w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 text-slate-900 dark:text-slate-100";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={member ? 'Edit HR Team Member Details' : 'Add New HR Team Member'}
      size="3xl" 
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} type="submit">
            {member ? 'Save HR Details' : 'Add HR Member'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center space-y-3 mb-4">
            <div 
                className="w-28 h-28 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-4xl font-semibold text-slate-500 dark:text-slate-400 overflow-hidden border-2 border-slate-300 dark:border-slate-600 cursor-pointer hover:border-premium-accent dark:hover:border-premium-accent-dark transition-colors"
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload profile picture"
            >
                {profilePicturePreview ? (
                <img src={profilePicturePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : formData.profilePictureUrl ? ( // Check existing formData for URL if preview isn't set yet
                <img src={formData.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-slate-400 dark:text-slate-500"><path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" /></svg>
                )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleProfilePictureChange} accept="image/*" className="hidden" />
            <Button type="button" variant="outline" size="xs" onClick={() => fileInputRef.current?.click()}>Upload Picture</Button>
            {errors.profilePictureUrl && <p className="text-xs text-red-600">{errors.profilePictureUrl}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name *" id="name" name="name" value={formData.name} onChange={handleChange} error={errors.name} required />
            <Input label="Email Address *" id="email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} required />
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Phone Number" id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber || ''} onChange={handleChange} />
            <Input label="Job Title *" id="jobTitle" name="jobTitle" value={formData.jobTitle || ''} onChange={handleChange} error={errors.jobTitle} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input label="Department *" id="department" name="department" value={formData.department || ''} onChange={handleChange} error={errors.department} required />
            <Input label="Joining Date *" id="joiningDate" name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} error={errors.joiningDate} required/>
        </div>
        <div>
            <label htmlFor="hrStatus" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">HR Status *</label>
            <select id="hrStatus" name="hrStatus" value={formData.hrStatus} onChange={handleChange} className={selectBaseClass} required>
                {hrStatuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
        </div>
        <TextArea label="HR Notes (Optional)" id="hrNotes" name="hrNotes" value={formData.hrNotes || ''} onChange={handleChange} rows={3} placeholder="Specific notes related to HR, performance, etc." />
      </form>
    </Modal>
  );
};
