
import React from 'react';
import { RoleDefinition, FeatureKey, PermissionAction } from '../../types';
import { SettingsSectionCard } from './SettingsSectionCard';
import { AdminRoleManagementView } from '../views/admin_panel_views/AdminRoleManagementView';

interface RolesPermissionsSettingsProps {
  roleDefinitions: RoleDefinition[];
  onSaveRoleDefinitions: (roleDefs: RoleDefinition[]) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

export const RolesPermissionsSettings: React.FC<RolesPermissionsSettingsProps> = (props) => {
  return (
    <SettingsSectionCard
      title="Roles & Permissions"
      description="Define user roles and assign granular permissions for different application features."
      contentClassName="p-0"
    >
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40">
            <AdminRoleManagementView {...props} />
        </div>
    </SettingsSectionCard>
  );
};
