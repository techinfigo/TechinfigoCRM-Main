

import React, { useState } from 'react';
import { ActivityLogItem, TeamMember } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { safeFormatRelativeTime } from '@/utils';

interface RecentActivityProps {
  activities: ActivityLogItem[];
  teamMembers: TeamMember[];
}

const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return '?';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0]?.toUpperCase() || '') + (parts[parts.length - 1][0]?.toUpperCase() || '');
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities, teamMembers }) => {
    const [filterDays, setFilterDays] = useState(7);

    // Dummy filtering for demonstration
    const filteredActivities = activities.slice(0, filterDays === 7 ? 5 : activities.length);

    return (
        <Card 
            title="Recent Activity"
            actions={
                 <div className="flex space-x-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <Button size="xs" variant={filterDays === 7 ? 'primary' : 'ghost'} onClick={() => setFilterDays(7)}>7d</Button>
                    <Button size="xs" variant={filterDays === 30 ? 'primary' : 'ghost'} onClick={() => setFilterDays(30)}>30d</Button>
                </div>
            }
        >
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {filteredActivities.length > 0 ? filteredActivities.map(log => {
                    const user = teamMembers.find(tm => tm.id === log.userId);
                    return (
                        <div key={log.id} className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center font-bold text-xs text-slate-500 shrink-0">
                                {user?.profilePictureUrl ? (
                                    <img src={user.profilePictureUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    getInitials(log.userName)
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-text-base dark:text-text-base leading-tight">
                                    <span className="font-semibold">{log.userName}</span> {log.details.toLowerCase().replace(log.userName.toLowerCase(), '').trim()}
                                </p>
                                <p className="text-xs text-text-muted dark:slate-400">{safeFormatRelativeTime(log.timestamp)}</p>
                            </div>
                        </div>
                    )
                }) : <p className="text-center text-text-muted dark:text-slate-400 p-4 text-sm">No recent activity.</p>}
            </div>
        </Card>
    );
};