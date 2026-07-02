import React, { useState, useEffect } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Input, TextArea } from '../../common/Input';
import { RoleDefinition, AppFeaturePermission, PermissionFlags, FeatureKey, PermissionAction } from '../../../types';
import { ALL_APP_FEATURES_CONFIG, getDefaultRolePermissions } from '../../../constants';

interface AdminRoleManagementViewProps {
  roleDefinitions: RoleDefinition[];
  onSaveRoleDefinitions: (roleDefs: RoleDefinition[]) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5zM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498-.075l-.275-5.5A.75.75 0 0 1 6.05 6zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711z" clipRule="evenodd" /></svg>;
const LockClosedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 ml-1 opacity-60"><path fillRule="evenodd" d="M10 1a3.5 3.5 0 00-3.5 3.5V6H5a2 2 0 00-2 2v5a2 2 0 002 2h6a2 2 0 002-2V8a2 2 0 00-2-2h-1.5V4.5A3.5 3.5 0 0010 1zM8.5 6V4.5a1.5 1.5 0 113 0V6h-3z" clipRule="evenodd" /></svg>;


export const AdminRoleManagementView: React.FC<AdminRoleManagementViewProps> = ({ roleDefinitions, onSaveRoleDefinitions, hasPermission }) => {
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [selectedRoleIdForEditing, setSelectedRoleIdForEditing] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<AppFeaturePermission[]>(getDefaultRolePermissions());
  const [roleNameError, setRoleNameError] = useState<string | null>(null);

  const canManageRoles = hasPermission('adminRoles', 'canManage');

  useEffect(() => {
    if (selectedRoleIdForEditing) {
      const role = roleDefinitions.find(r => r.id === selectedRoleIdForEditing);
      if (role) {
        const currentRolePermissionsMap = new Map(role.permissions.map(p => [p.featureKey, p.currentPermissions]));
        
        const mergedPermissions = ALL_APP_FEATURES_CONFIG.map(configFeature => {
            const savedPerms = currentRolePermissionsMap.get(configFeature.featureKey);
            
            // Initialize with all available permissions for the feature set to false
            const defaultPermsForFeature = configFeature.availablePermissions.reduce((acc, p) => {
                acc[p.action] = false;
                return acc;
            }, {} as PermissionFlags);

            return {
                ...configFeature,
                currentPermissions: savedPerms 
                                    ? { ...defaultPermsForFeature, ...(savedPerms as PermissionFlags) }
                                    : { ...defaultPermsForFeature }
            };
        });
        setEditingPermissions(mergedPermissions);
      }
    } else {
      setEditingPermissions(getDefaultRolePermissions());
    }
  }, [selectedRoleIdForEditing, roleDefinitions]);


  const handleAddNewRole = () => {
    if (!canManageRoles) { alert("Permission denied."); return; }
    if (!newRoleName.trim()) {
      setRoleNameError("Role name cannot be empty.");
      return;
    }
    if (roleDefinitions.find(r => r.name.toLowerCase() === newRoleName.trim().toLowerCase())) {
      setRoleNameError("A role with this name already exists.");
      return;
    }
    
    const newRole: RoleDefinition = {
      id: `role-${Date.now()}`,
      name: newRoleName.trim(),
      description: newRoleDescription.trim(),
      permissions: getDefaultRolePermissions(), // Start with default (usually all false) permissions
      isSystemRole: false,
    };
    onSaveRoleDefinitions([...roleDefinitions, newRole]);
    setNewRoleName('');
    setNewRoleDescription('');
    setRoleNameError(null);
    setSelectedRoleIdForEditing(newRole.id); 
    alert(`Role "${newRole.name}" added successfully.`);
  };
  
  const handlePermissionChange = (featureKey: FeatureKey, permissionAction: PermissionAction, value: boolean) => {
    if (!canManageRoles) { alert("Permission denied."); return; }
    const selectedRole = roleDefinitions.find(r => r.id === selectedRoleIdForEditing);
    if (selectedRole?.isSystemRole) {
        alert("System role permissions cannot be changed through this UI for safety (conceptual block).");
        return;
    }

    setEditingPermissions(prevPermissions => 
      prevPermissions.map(feature => 
        feature.featureKey === featureKey 
          ? { ...feature, currentPermissions: { ...feature.currentPermissions, [permissionAction]: value } }
          : feature
      )
    );
  };

  const handleSavePermissionsForRole = () => {
    if (!canManageRoles) { alert("Permission denied."); return; }
    if (!selectedRoleIdForEditing) return;

    const roleToUpdate = roleDefinitions.find(r => r.id === selectedRoleIdForEditing);
    if (roleToUpdate?.isSystemRole) {
        alert("System role permissions cannot be changed through this UI (conceptual block).");
        // In a real app, you might prevent this or have special handling.
        // For this demo, we allow modification in state but it's good practice to note this.
    }

    const updatedRoleDefinitions = roleDefinitions.map(role => 
        role.id === selectedRoleIdForEditing ? { ...role, permissions: editingPermissions } : role
    );
    onSaveRoleDefinitions(updatedRoleDefinitions);
    alert(`Permissions for role '${roleDefinitions.find(r=>r.id===selectedRoleIdForEditing)?.name}' saved.`);
  };
  
  const handleDeleteRole = (roleId: string) => {
    if (!canManageRoles) { alert("Permission denied."); return; }
    const roleToDelete = roleDefinitions.find(r => r.id === roleId);
    if (roleToDelete?.isSystemRole) {
      alert("System roles cannot be deleted.");
      return;
    }
    // Check if any team member is currently assigned this role
    // This check would ideally happen by accessing teamMembers state from App.tsx
    // For now, we'll proceed without it, but it's a critical check in a real system.
    // const isRoleInUse = teamMembers.some(tm => tm.roleId === roleId);
    // if (isRoleInUse) {
    //   alert(`Cannot delete role "${roleToDelete?.name}" as it is currently assigned to one or more team members. Please reassign them first.`);
    //   return;
    // }

    if(window.confirm(`Are you sure you want to delete the role "${roleToDelete?.name}"? This action cannot be undone.`)) {
        onSaveRoleDefinitions(roleDefinitions.filter(r => r.id !== roleId));
        if(selectedRoleIdForEditing === roleId) {
            setSelectedRoleIdForEditing(null); // Deselect if the deleted role was being edited
        }
        alert(`Role "${roleToDelete?.name}" deleted.`);
    }
  };

  const selectedRole = roleDefinitions.find(r => r.id === selectedRoleIdForEditing);

  return (
    <Card title="Role-Based Access Control (RBAC)" className="bg-bg-base dark:bg-bg-muted">
      <p className="text-sm text-text-muted dark:text-text-muted mb-6">
        Define user roles and assign granular permissions for different application features. 
        These permissions will apply to any team member assigned the respective role.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Role List & Creation */}
        <div className="lg:col-span-1 space-y-6">
          {canManageRoles && (
            <Card title="Create New Role" className="bg-bg-muted dark:bg-slate-800/50 border border-border-base dark:border-border-muted" contentClassName="p-4 space-y-3">
              <Input 
                label="New Role Name"
                value={newRoleName}
                onChange={(e) => { setNewRoleName(e.target.value); setRoleNameError(null); }}
                placeholder="e.g., Content Editor"
                disabled={!canManageRoles}
                error={roleNameError || undefined}
              />
              <TextArea
                label="Role Description (Optional)"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                placeholder="Briefly describe this role's purpose."
                rows={2}
                disabled={!canManageRoles}
              />
              <Button onClick={handleAddNewRole} variant="primary" size="sm" className="w-full" leftIcon={<PlusIcon />} disabled={!canManageRoles}>Add New Role</Button>
            </Card>
          )}
          <Card title="Existing Roles" className="bg-bg-muted dark:bg-slate-800/50 border border-border-base dark:border-border-muted" contentClassName="p-0">
            <div className="max-h-[calc(60vh-10rem)] overflow-y-auto p-3">
            {roleDefinitions.length === 0 ? (
              <p className="text-xs text-text-muted dark:text-text-muted p-2">No roles defined yet.</p>
            ) : (
              <ul className="space-y-1">
                {roleDefinitions.map(role => (
                  <li key={role.id} 
                      className={`p-2.5 rounded-md cursor-pointer flex justify-between items-center group text-sm
                                  ${selectedRoleIdForEditing === role.id 
                                    ? 'bg-premium-accent-light text-premium-accent dark:bg-premium-accent-light dark:text-premium-accent font-semibold shadow-sm' 
                                    : 'text-text-base dark:text-text-base hover:bg-slate-100 dark:hover:bg-slate-700/70'}`}
                      onClick={() => setSelectedRoleIdForEditing(role.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedRoleIdForEditing(role.id)}
                  >
                    <div className="flex items-center">
                        {role.name}
                        {role.isSystemRole && <LockClosedIcon />}
                    </div>
                    {!role.isSystemRole && canManageRoles &&
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}
                            className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 opacity-50 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20"
                            title={`Delete role ${role.name}`}
                            aria-label={`Delete role ${role.name}`}
                        >
                           <TrashIcon />
                        </button>
                    }
                  </li>
                ))}
              </ul>
            )}
            </div>
          </Card>
        </div>

        {/* Column 2: Permissions Editor */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <Card title={`Permissions for: ${selectedRole.name}`} className="bg-bg-muted dark:bg-slate-800/50 border border-border-base dark:border-border-muted" contentClassName="p-0">
              {selectedRole.description && <p className="text-xs text-text-muted dark:text-text-muted px-4 pt-3 -mb-1 italic">{selectedRole.description}</p>}
              <div className="max-h-[calc(100vh-16rem)] overflow-y-auto p-4 space-y-4">
                {editingPermissions.map(feature => (
                  <div key={feature.featureKey} className="p-3.5 bg-bg-base dark:bg-slate-700/50 rounded-lg border border-border-base dark:border-border-muted shadow">
                    <h5 className="font-semibold text-text-base dark:text-text-base mb-2.5 pb-1.5 border-b border-border-muted dark:border-border-muted/50">{feature.featureName}</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                      {feature.availablePermissions.map(perm => (
                        <label key={perm.action} className="flex items-center space-x-2 text-sm text-text-base dark:text-text-base cursor-pointer">
                          <input 
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-premium-accent border-border-base dark:border-border-muted rounded focus:ring-premium-accent focus:ring-offset-1 dark:focus:ring-offset-bg-muted disabled:opacity-60 bg-bg-base dark:bg-slate-600"
                            checked={!!feature.currentPermissions[perm.action]}
                            onChange={(e) => handlePermissionChange(feature.featureKey, perm.action as PermissionAction, e.target.checked)}
                            disabled={!canManageRoles || (selectedRole.isSystemRole && feature.featureKey !== 'dashboard')} // Example: allow dashboard view for system role, but not other changes
                            aria-label={`${perm.label} for ${feature.featureName}`}
                          />
                          <span>{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border-base dark:border-border-muted bg-slate-50 dark:bg-slate-800/30 flex justify-end">
                 <Button 
                    onClick={handleSavePermissionsForRole} 
                    variant="primary" 
                    size="sm" 
                    disabled={!canManageRoles || (selectedRole.isSystemRole && !ALL_APP_FEATURES_CONFIG.find(f => f.featureKey === 'dashboard')?.availablePermissions.some(p => editingPermissions.find(ep => ep.featureKey === 'dashboard')?.currentPermissions[p.action])) } // More complex disable logic if needed
                 >
                    {selectedRole.isSystemRole ? 'System Role (Primarily Read-only)' : `Save Permissions for ${selectedRole.name}`}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="bg-bg-muted dark:bg-slate-800/50 border border-border-base dark:border-border-muted" contentClassName="p-6 text-center">
                <p className="text-text-muted dark:text-text-muted">Select a role from the list to view or edit its permissions.</p>
                <p className="text-xs text-text-muted dark:text-text-muted mt-2">You can create new roles if you have the 'Manage Roles & Permissions' right.</p>
            </Card>
          )}
        </div>
      </div>
    </Card>
  );
};