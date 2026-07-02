
import React, { useState, useEffect, useRef } from 'react';
import { TeamMember, TeamMemberRole, RoleDefinition } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { safeFormatDate } from '@/utils';

interface UserProfileViewProps {
  currentUser: TeamMember;
  onUpdateProfile: (updatedData: Partial<TeamMember>, oldPassword?: string) => Promise<boolean>;
  onUpdateProfilePicture: (imageFile: File) => Promise<boolean>; // New handler for picture
  roleDefinitions: RoleDefinition[];
}

const UserIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12.5a7.5 7.5 0 00-6.353 3.635A8.004 8.004 0 0010 18a8.004 8.004 0 006.353-1.865A7.5 7.5 0 0010 12.5z" clipRule="evenodd" /></svg>;
const LockClosedIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>;
const SaveIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v2.5H6.75a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" /><path fillRule="evenodd" d="M2 2.75C2 1.784 2.784 1 3.75 1h12.5c.966 0 1.75.784 1.75 1.75v14.5A1.75 1.75 0 0116.25 19H3.75A1.75 1.75 0 012 17.25V2.75zm1.75-.25a.25.25 0 00-.25.25v14.5c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25V2.75a.25.25 0 00-.25-.25H3.75z" clipRule="evenodd" /></svg>;
const CameraIcon: React.FC<{ className?: string }> = ({ className: propClassName }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={propClassName || "w-5 h-5"}>
        <path fillRule="evenodd" d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm13.5 3a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM10 14a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
);


const getInitials = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === "") return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0]?.toUpperCase() || '') + (parts[parts.length - 1][0]?.toUpperCase() || '');
};


export const UserProfileView: React.FC<UserProfileViewProps> = ({ currentUser, onUpdateProfile, onUpdateProfilePicture, roleDefinitions }) => {
  const [name, setName] = useState(currentUser.name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [nameError, setNameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [profilePictureError, setProfilePictureError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [newProfilePicturePreview, setNewProfilePicturePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(currentUser.name);
    setNewProfilePicturePreview(null);
    setSelectedFile(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setNameError(null);
    setPasswordError(null);
    setProfilePictureError(null);
    setSuccessMessage(null);
  }, [currentUser]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setPasswordError(null);
    setProfilePictureError(null); // Clear picture error on general save
    setSuccessMessage(null);

    if (!name.trim()) {
      setNameError("Name cannot be empty.");
      return;
    }

    let passwordToSave: string | undefined = undefined;

    if (newPassword) {
      if (!currentPassword) {
        setPasswordError("Current password is required to change your password.");
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError("New password must be at least 6 characters long.");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setPasswordError("New passwords do not match.");
        return;
      }
      passwordToSave = newPassword;
    }

    const updatedData: Partial<TeamMember> = { name: name.trim() };
    if (passwordToSave) {
      updatedData.password = passwordToSave;
    }

    const success = await onUpdateProfile(updatedData, passwordToSave ? currentPassword : undefined);
    if (success) {
      setSuccessMessage("Profile details updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      if (!passwordError) {
          setPasswordError(prev => prev || "Failed to update profile. Please check your input.");
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProfilePictureError(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setProfilePictureError("File is too large. Max 2MB.");
        setSelectedFile(null);
        setNewProfilePicturePreview(null);
        return;
      }
      if (!file.type.startsWith('image/')) {
        setProfilePictureError("Invalid file type. Please select an image.");
        setSelectedFile(null);
        setNewProfilePicturePreview(null);
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfilePicture = async () => {
    if (!selectedFile) {
      setProfilePictureError("No new picture selected.");
      return;
    }
    setProfilePictureError(null);
    const success = await onUpdateProfilePicture(selectedFile);
    if (success) {
      setSuccessMessage("Profile picture updated successfully!");
      setNewProfilePicturePreview(null); // Clear preview after save
      setSelectedFile(null);
    } else {
      setProfilePictureError("Failed to update profile picture.");
    }
  };

  const roleName = currentUser.roleId 
    ? roleDefinitions.find(r => r.id === currentUser.roleId)?.name || currentUser.role 
    : currentUser.role;

  const currentAvatarSrc = newProfilePicturePreview || currentUser.profilePictureUrl;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 px-1">
         <h2 className="text-2xl md:text-3xl font-bold text-text-heading dark:text-text-heading">My Profile</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Profile Picture */}
        <div className="lg:col-span-4 space-y-6">
            <Card title="Profile Picture" icon={<CameraIcon className="w-5 h-5"/>} className="bg-bg-base dark:bg-bg-muted shadow-lg h-full">
                <div className="flex flex-col items-center justify-center space-y-6 p-4 h-full min-h-[250px]">
                <div 
                    className="relative w-40 h-40 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-5xl font-semibold text-slate-500 dark:text-slate-400 cursor-pointer group ring-4 ring-offset-4 dark:ring-offset-bg-muted ring-slate-100 dark:ring-slate-600 hover:ring-premium-accent dark:hover:ring-premium-accent-dark transition-all shadow-md"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                    tabIndex={0}
                    role="button"
                    aria-label="Change profile picture"
                >
                    {currentAvatarSrc ? (
                    <img src={currentAvatarSrc} alt="Profile Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                    <span>{getInitials(currentUser.name)}</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                         <CameraIcon className="w-10 h-10 text-white drop-shadow-md"/>
                    </div>
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept="image/*" 
                    className="hidden" 
                    aria-hidden="true"
                />
                <div className="flex flex-col gap-2 w-full px-4">
                    {newProfilePicturePreview && selectedFile ? (
                        <Button onClick={handleSaveProfilePicture} variant="primary" size="md" className="w-full">
                        Save New Picture
                        </Button>
                    ) : (
                        <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="md" className="w-full">
                            Upload New Picture
                        </Button>
                    )}
                </div>
                {profilePictureError && <p className="text-sm text-status-negative dark:text-red-400 text-center bg-red-50 dark:bg-red-900/20 p-2 rounded w-full">{profilePictureError}</p>}
                </div>
            </Card>
        </div>

        {/* Right Column: Info & Password */}
        <div className="lg:col-span-8 space-y-6">
            <form onSubmit={handleProfileUpdate} className="space-y-6">
                <Card title="Profile Information" icon={<UserIcon />} className="bg-bg-base dark:bg-bg-muted shadow-lg">
                <div className="space-y-4 p-1">
                    <Input
                    label="Full Name"
                    id="profileName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={nameError || undefined}
                    required
                    aria-describedby={nameError ? "name-error" : undefined}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-muted dark:text-text-muted mb-1">Email Address</label>
                            <p className="p-2.5 bg-slate-100 dark:bg-slate-700/50 border border-border-base dark:border-border-muted rounded-md text-sm text-text-base dark:text-text-base truncate">{currentUser.email}</p>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-text-muted dark:text-text-muted mb-1">Role</label>
                            <p className="p-2.5 bg-slate-100 dark:bg-slate-700/50 border border-border-base dark:border-border-muted rounded-md text-sm text-text-base dark:text-text-base">{roleName || 'N/A'}</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-muted dark:text-text-muted mb-1">Date Joined</label>
                        <p className="text-sm text-text-base dark:text-text-base">{safeFormatDate(currentUser.dateJoined)}</p>
                    </div>
                </div>
                </Card>

                <Card title="Change Password" icon={<LockClosedIcon />} className="bg-bg-base dark:bg-bg-muted shadow-lg">
                <div className="space-y-4 p-1">
                    <Input
                    label="Current Password"
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Required to change password"
                    aria-describedby={passwordError ? "password-error" : undefined}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                        label="New Password"
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        aria-describedby={passwordError ? "password-error" : undefined}
                        />
                        <Input
                        label="Confirm New Password"
                        id="confirmNewPassword"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        aria-describedby={passwordError ? "password-error" : undefined}
                        />
                    </div>
                    {passwordError && <p id="password-error" className="text-sm text-status-negative dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">{passwordError}</p>}
                </div>
                </Card>

                {successMessage && (
                <div className="p-3 bg-green-50 dark:bg-green-700/20 border border-green-300 dark:border-green-600 rounded-md text-sm text-status-positive dark:text-green-300 flex items-center justify-center font-medium" role="alert">
                    {successMessage}
                </div>
                )}

                <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="lg" leftIcon={<SaveIcon />}>
                    Save Profile Changes
                </Button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};
