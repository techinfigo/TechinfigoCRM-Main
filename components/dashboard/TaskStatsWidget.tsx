import React, { useMemo } from 'react';
import { Task } from '../../types';
import { Card } from '../common/Card';
import { ClipboardList, AlertTriangle, Calendar, CalendarClock, CheckCircle } from 'lucide-react';

interface TaskStatsWidgetProps {
    tasks: (Task & { projectName?: string })[];
}

const StatCard: React.FC<{ label: string, value: number, icon: React.ReactNode }> = ({ label, value, icon }) => {
    return (
        <div className="bg-bg-base dark:bg-bg-muted p-3 rounded-lg flex items-center gap-3 border border-border-base dark:border-border-muted shadow-sm">
            <div className="text-premium-accent dark:text-secondary-accent">{icon}</div>
            <div>
                <p className="font-bold text-xl text-text-heading dark:text-text-heading">{value}</p>
                <p className="text-xs text-text-muted">{label}</p>
            </div>
        </div>
    );
};

export const TaskStatsWidget: React.FC<TaskStatsWidgetProps> = ({ tasks }) => {
    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
        endOfWeek.setHours(23, 59, 59, 999);

        let toDo = 0, inProgress = 0, blocked = 0, done = 0;
        let overdue = 0, dueToday = 0, dueThisWeek = 0;

        tasks.forEach(task => {
            // Status counts
            if (task.status === 'To Do') toDo++;
            else if (task.status === 'In Progress') inProgress++;
            else if (task.status === 'Blocked') blocked++;
            else if (task.status === 'Done') done++;

            // Time-based counts for pending tasks
            if (task.status !== 'Done' && task.dueDate) {
                const dueDate = new Date(task.dueDate);
                if (isNaN(dueDate.getTime())) return;
                const userTimezoneOffset = dueDate.getTimezoneOffset() * 60000;
                const normalizedDueDate = new Date(dueDate.getTime() + userTimezoneOffset);

                if (normalizedDueDate < today) overdue++;
                if (normalizedDueDate.getTime() === today.getTime()) dueToday++;
                if (normalizedDueDate >= today && normalizedDueDate <= endOfWeek) dueThisWeek++;
            }
        });
        
        return { toDo, inProgress, blocked, done, overdue, dueToday, dueThisWeek };
    }, [tasks]);

    const primaryStats = [
        { label: 'To Do', value: stats.toDo, icon: <ClipboardList size={20} /> },
        { label: 'In Progress', value: stats.inProgress, icon: <ClipboardList size={20} /> },
        { label: 'Blocked', value: stats.blocked, icon: <ClipboardList size={20} /> },
        { label: 'Done', value: stats.done, icon: <CheckCircle size={20} /> },
    ];

    const timeStats = [
        { label: 'Overdue', value: stats.overdue, icon: <AlertTriangle size={16} /> },
        { label: 'Due Today', value: stats.dueToday, icon: <Calendar size={16} /> },
        { label: 'Due This Week', value: stats.dueThisWeek, icon: <CalendarClock size={16} /> },
    ];

    return (
        <Card title="My Task Stats">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {primaryStats.map(stat => <StatCard key={stat.label} {...stat} />)}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 pt-3 border-t border-border-base dark:border-border-muted">
                {timeStats.map(stat => stat.value > 0 && (
                    <div key={stat.label} className="flex items-center gap-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                        <span className={stat.label === 'Overdue' ? 'text-red-500' : 'text-text-muted'}>{stat.icon}</span>
                        <span className="text-text-muted">{stat.label}:</span>
                        <span className="font-bold text-text-heading dark:text-text-base">{stat.value}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
};
