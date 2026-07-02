
import React from 'react';
import { TeamMember, RoleDefinition, FeatureKey, PermissionAction } from '../../types';
import { SettingsSectionCard } from './SettingsSectionCard';
import { TeamView } from '../views/TeamView';

interface UserManagementSettingsProps {
  teamMembers: TeamMember[];
  roleDefinitions: RoleDefinition[];
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

export const UserManagementSettings: React.FC<UserManagementSettingsProps> = (props) => {
  return (
    <SettingsSectionCard
      title="User Management"
      description="Add, edit, or remove team members and manage their application access roles."
      contentClassName="p-0"
    >
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40">
        {/* Reusing TeamView as it already contains the necessary logic for displaying users.
            The actions inside TeamView (like onAddMember) will trigger modals handled by App.tsx */}
        <TeamView 
          teamMembers={props.teamMembers}
          onAddMember={() => { /* Modal is opened by App.tsx or parent */ }}
          onEditMember={() => { /* Modal is opened by App.tsx or parent */ }}
          onDeleteMember={() => { /* Handled by App.tsx or parent */ }}
          onViewMemberDetail={() => { /* Handled by App.tsx or parent */ }}
          hasPermission={props.hasPermission}
          roleDefinitions={props.roleDefinitions}
        />
      </div>
    </SettingsSectionCard>
  );
};
