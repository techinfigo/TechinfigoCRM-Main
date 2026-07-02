import React from 'react';
import { Client } from '../../types';
import { Button } from '../common/Button';
import { MoreVertical, Mail, Eye, AlertTriangle, FileScan, CircleDollarSign, Rocket, StickyNote } from 'lucide-react';

interface ClientSummaryCardProps {
    client: Client;
    onViewClient: (client: Client) => void;
    onSendEmail: (client: Client) => void;
}

const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return '?';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0]?.toUpperCase() || '') + (parts[parts.length - 1][0]?.toUpperCase() || '');
};

const getHealthStatusClasses = (status: Client['healthStatus']) => {
    switch (status) {
        case 'Active':
            return {
                dot: 'bg-status-positive',
                text: 'text-status-positive',
                bg: 'bg-status-positive/10',
            };
        case 'Healthy':
            return {
                dot: 'bg-status-info',
                text: 'text-status-info',
                bg: 'bg-status-info/10',
            };
        case 'At Risk':
            return {
                dot: 'bg-status-negative',
                text: 'text-status-negative',
                bg: 'bg-status-negative/10',
            };
        default:
            return {
                dot: 'bg-slate-400',
                text: 'text-text-muted',
                bg: 'bg-slate-100',
            };
    }
};

const getActivityIcon = (icon: Client['recentActivity'][0]['icon']) => {
    const commonClasses = "w-4 h-4 text-white p-0.5 rounded-full";
    switch (icon) {
        case 'audit':
            return <FileScan className={`${commonClasses} bg-purple-500`} />;
        case 'payment':
            return <CircleDollarSign className={`${commonClasses} bg-green-500`} />;
        case 'campaign':
            return <Rocket className={`${commonClasses} bg-blue-500`} />;
        case 'note':
            return <StickyNote className={`${commonClasses} bg-yellow-500`} />;
        default:
            return null;
    }
};

const formatDateSafe = (isoString?: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }): string => {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-GB', options);
    } catch {
        return 'Invalid Date';
    }
};


export const ClientSummaryCard: React.FC<ClientSummaryCardProps> = ({ client, onViewClient, onSendEmail }) => {
    const { name, companyName, industry, healthStatus, roi, nextAction, recentActivity, profilePictureUrl } = client;

    const roiPercentage = roi.goal > 0 ? (roi.current / roi.goal) * 100 : 0;
    const roiProgressColor = roiPercentage >= 100 ? 'bg-status-positive' : roiPercentage < 50 ? 'bg-status-warning' : 'bg-status-info';

    const isNextActionOverdue = new Date(nextAction.dueDate) < new Date();
    const healthClasses = getHealthStatusClasses(healthStatus);
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { notation: 'compact', compactDisplay: 'short' }).format(amount);

    return (
        <div className="bg-bg-base dark:bg-bg-base rounded-2xl shadow-lg border border-border-base dark:border-border-muted flex flex-col p-4 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-premium-accent text-xl shrink-0 overflow-hidden">
                        {profilePictureUrl ? <img src={profilePictureUrl} alt={name} className="w-full h-full object-cover" /> : getInitials(name)}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-text-heading dark:text-text-heading truncate" title={name}>{name}</h3>
                        <p className="text-xs text-text-muted truncate">{companyName}</p>
                        <p className="text-xxs text-text-muted/80 uppercase tracking-wide">{industry}</p>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${healthClasses.bg} ${healthClasses.text}`}>
                    <span className={`w-2 h-2 rounded-full ${healthClasses.dot}`}></span>
                    {healthStatus}
                </div>
            </div>

            {/* ROI Meter */}
            <div className="mt-4">
                <div className="flex justify-between items-end text-xs text-text-muted">
                    <span>ROI Progress</span>
                    <span>{`Current: ${formatCurrency(roi.current)} | Goal: ${formatCurrency(roi.goal)}`}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                    <div className={`${roiProgressColor} h-1.5 rounded-full`} style={{ width: `${Math.min(roiPercentage, 100)}%` }}></div>
                </div>
            </div>

            {/* Next Action */}
            <div className={`mt-4 p-2 rounded-md flex items-center gap-2 ${isNextActionOverdue ? 'bg-red-50 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-700/50'}`}>
                {isNextActionOverdue && <AlertTriangle className="w-4 h-4 text-status-negative shrink-0" />}
                <div className="text-xs">
                    <span className="font-semibold text-text-muted">{isNextActionOverdue ? 'OVERDUE:' : 'NEXT:'}</span>
                    <span className="ml-1 text-text-base dark:text-text-base">{nextAction.title} – {formatDateSafe(nextAction.dueDate)}</span>
                </div>
            </div>

            {/* Activity Timeline */}
            <div className="mt-4 flex-grow">
                <ul className="space-y-2">
                    {recentActivity.slice(0, 3).map(activity => (
                        <li key={activity.id} className="flex items-center gap-2 text-xs">
                            {getActivityIcon(activity.icon)}
                            <span className="text-text-muted flex-grow truncate">{activity.action}</span>
                            <span className="text-text-muted/70 shrink-0">{formatDateSafe(activity.timestamp)}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-border-base dark:border-border-muted flex justify-end items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => onSendEmail(client)} leftIcon={<Mail size={14}/>}>Email</Button>
                <Button variant="primary" size="sm" onClick={() => onViewClient(client)} leftIcon={<Eye size={14}/>}>View Client</Button>
            </div>
        </div>
    );
};