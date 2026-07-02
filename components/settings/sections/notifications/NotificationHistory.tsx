import React from 'react';
import { SettingsSectionCard } from '../../SettingsSectionCard';
import { Button } from '../../../common/Button';
import { Input } from '../../../common/Input';

const dummyHistory = [
    { id: 'h1', event: 'Invoice Paid', date: new Date(Date.now() - 1 * 60 * 60 * 1000).toLocaleString(), status: 'Delivered', channel: 'Email' },
    { id: 'h2', event: 'New Lead Assigned', date: new Date(Date.now() - 5 * 60 * 60 * 1000).toLocaleString(), status: 'Delivered', channel: 'In-App' },
    { id: 'h3', event: 'Task Assigned', date: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString(), status: 'Failed', channel: 'SMS' },
    { id: 'h4', event: 'Leave Request Submitted', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleString(), status: 'Read', channel: 'In-App' },
    { id: 'h5', event: 'Project Created', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleString(), status: 'Delivered', channel: 'Email' },
];

export const NotificationHistory: React.FC = () => {
    return (
        <SettingsSectionCard
            title="Notification History"
            description="A log of recent notifications sent from the system."
        >
            <div className="flex flex-wrap gap-2 mb-4">
                <Input type="date" className="max-w-xs" />
                <select className="p-2 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm"><option>All Types</option></select>
                <select className="p-2 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm"><option>All Statuses</option></select>
                <Button variant="secondary" size="sm">Filter</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/40">
                        <tr>
                            <th className="p-2 text-left text-xs font-semibold text-text-muted dark:text-slate-400">Event</th>
                            <th className="p-2 text-left text-xs font-semibold text-text-muted dark:text-slate-400">Date/Time</th>
                            <th className="p-2 text-left text-xs font-semibold text-text-muted dark:text-slate-400">Channel</th>
                            <th className="p-2 text-left text-xs font-semibold text-text-muted dark:text-slate-400">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-base dark:divide-slate-700">
                        {dummyHistory.map(h => (
                            <tr key={h.id}>
                                <td className="p-2">{h.event}</td>
                                <td className="p-2">{h.date}</td>
                                <td className="p-2">{h.channel}</td>
                                <td className="p-2">
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${h.status === 'Delivered' ? 'bg-green-100 text-green-700' : h.status === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                                        {h.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 <div className="text-center mt-4">
                    <Button variant="outline" size="sm">View Full Notification Log</Button>
                </div>
            </div>
        </SettingsSectionCard>
    );
};
