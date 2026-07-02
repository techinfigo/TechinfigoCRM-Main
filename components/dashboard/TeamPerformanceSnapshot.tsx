import React from 'react';
import { Card } from '../common/Card';

interface TeamPerformanceSnapshotProps {
  summary: {
    totalEmployees: number;
    activeToday: number;
    attendancePercentage: number;
    pendingLeaveRequests: number;
    topPerformer: { name: string; metric: string };
  };
}

// Locally defined lucide-react style icons
const UsersIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);
const UserCheckIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <polyline points="16 11 18 13 22 9"/>
    </svg>
);
const UserXIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <line x1="17" y1="8" x2="22" y2="13"/>
        <line x1="22" y1="8" x2="17" y2="13"/>
    </svg>
);
const TrophyIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <path d="M4 22h16"/>
        <path d="M10 14.66V22"/>
        <path d="M14 14.66V22"/>
        <path d="M8 8.5c0-1.71 1.24-4.5 4-4.5s4 2.79 4 4.5c0 2.22-1.54 4.5-4 4.5s-4-2.28-4-4.5Z"/>
    </svg>
);

// Metric Card sub-component for consistency
const MetricSnapshotCard: React.FC<{
    icon: React.ComponentType<{ className?: string }>;
    value: string | number;
    label: string;
}> = ({ icon: Icon, value, label }) => {
    return (
        <div className="relative bg-bg-base dark:bg-bg-muted p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-border-base dark:border-border-muted text-center">
            <Icon className="absolute top-4 right-4 w-5 h-5 text-text-muted/70 dark:text-slate-500" />
            <p className="text-3xl font-bold text-text-heading dark:text-text-heading mt-2 truncate" title={String(value)}>{value}</p>
            <p className="text-sm text-text-muted dark:text-slate-400 mt-1">{label}</p>
        </div>
    );
};


export const TeamPerformanceSnapshot: React.FC<TeamPerformanceSnapshotProps> = ({ summary }) => {
    const metrics = [
        { label: "Total Employees", value: summary.totalEmployees, icon: UsersIcon },
        { label: "Attendance Today", value: `${summary.attendancePercentage.toFixed(0)}%`, icon: UserCheckIcon },
        { label: "Pending Leaves", value: summary.pendingLeaveRequests, icon: UserXIcon },
        { label: "Top Performer", value: summary.topPerformer.name, icon: TrophyIcon }
    ];

    return (
        <Card title="Team Performance Snapshot" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.map((metric) => (
                    <MetricSnapshotCard 
                        key={metric.label}
                        label={metric.label}
                        value={metric.value}
                        icon={metric.icon}
                    />
                ))}
            </div>
        </Card>
    );
};
