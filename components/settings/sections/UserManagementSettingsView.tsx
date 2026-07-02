
import React from 'react';
import { TeamMember, RoleDefinition, FeatureKey, PermissionAction } from '../../../types';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { TeamView } from '../../views/TeamView';

interface UserManagementSettingsProps {
  teamMembers: TeamMember[];
  roleDefinitions: RoleDefinition[];
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

export const UserManagementSettingsView: React.FC<UserManagementSettingsProps> = (props) => {
  // We can reuse the existing TeamView as it perfectly fits the user management requirements.
  // Note: onAddMember etc. will trigger modals handled by App.tsx.
  return (
    <SettingsSectionCard
      title="User Management"
      description="Add, edit, or remove team members and manage their application access roles."
      contentClassName="p-0 bg-bg-muted dark:bg-slate-800/40"
    >
      <div className="p-4">
        <TeamView
          teamMembers={props.teamMembers}
          onAddMember={() => { /* Modal is opened by parent */ }}
          onEditMember={() => { /* Modal is opened by parent */ }}
          onDeleteMember={() => { /* Handled by parent */ }}
          onViewMemberDetail={() => { /* Handled by parent */ }}
          hasPermission={props.hasPermission}
          roleDefinitions={props.roleDefinitions}
        />
      </div>
    </SettingsSectionCard>
  );
};
