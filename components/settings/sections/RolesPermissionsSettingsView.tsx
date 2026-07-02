
import React from 'react';
import { RoleDefinition, FeatureKey, PermissionAction } from '../../../types';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { AdminRoleManagementView } from '../../views/admin_panel_views/AdminRoleManagementView';

interface RolesPermissionsSettingsProps {
  roleDefinitions: RoleDefinition[];
  onSaveRoleDefinitions: (roleDefs: RoleDefinition[]) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

export const RolesPermissionsSettingsView: React.FC<RolesPermissionsSettingsProps> = (props) => {
  return (
    <SettingsSectionCard
      title="Roles & Permissions"
      description="Define user roles and assign granular permissions for different application features."
      contentClassName="p-0 bg-bg-muted dark:bg-slate-800/40"
    >
       <div className="p-4">
          <AdminRoleManagementView {...props} />
       </div>
    </SettingsSectionCard>
  );
};
