
import React from 'react';
import { AdminActivityLogView } from '../../views/admin_panel_views/AdminActivityLogView';
import { ActivityLogItem, TeamMember } from '../../../types';

interface SystemLogsSettingsViewProps {
  activityHistory: ActivityLogItem[];
  teamMembers: TeamMember[];
}

export const SystemLogsSettingsView: React.FC<SystemLogsSettingsViewProps> = (props) => {
  return <AdminActivityLogView {...props} />;
};
