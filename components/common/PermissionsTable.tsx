
import React from 'react';
import { RoleDefinition, AppFeaturePermission } from '../../types';
import { Checkbox } from './Checkbox';

interface PermissionsTableProps {
  featurePermissions: AppFeaturePermission;
  roleDefinitions: RoleDefinition[];
  onPermissionChange: (roleId: string, action: string, allowed: boolean) => void;
  disabled?: boolean;
}

export const PermissionsTable: React.FC<PermissionsTableProps> = ({
  featurePermissions,
  roleDefinitions,
  onPermissionChange,
  disabled = false
}) => {
  
  const getRolePermission = (roleId: string, action: string): boolean => {
    const role = roleDefinitions.find(r => r.id === roleId);
    if (!role) return false;
    const feature = role.permissions.find(p => p.featureKey === featurePermissions.featureKey);
    if (!feature) return false;
    return !!feature.currentPermissions[action];
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border-base dark:border-border-muted">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-700/50">
          <tr>
            <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-text-muted dark:text-slate-400 uppercase tracking-wider">
              Role
            </th>
            {featurePermissions.availablePermissions.map(perm => (
              <th key={perm.action} scope="col" className="py-3 px-4 text-center text-xs font-semibold text-text-muted dark:text-slate-400 uppercase tracking-wider">
                {perm.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-bg-base dark:bg-bg-muted divide-y divide-slate-200 dark:divide-slate-700">
          {roleDefinitions.map((role) => (
            <tr key={role.id}>
              <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-text-base dark:text-slate-200">
                {role.name}
                {role.isSystemRole && <span className="ml-2 text-xs text-text-muted">(System)</span>}
              </td>
              {featurePermissions.availablePermissions.map(perm => (
                <td key={perm.action} className="py-3 px-4 text-center">
                  <Checkbox
                    checked={getRolePermission(role.id, perm.action)}
                    onChange={(e) => onPermissionChange(role.id, perm.action, e.target.checked)}
                    disabled={disabled || role.isSystemRole}
                    aria-label={`Permission ${perm.label} for role ${role.name}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
