
import React, { useMemo, useEffect, useRef } from 'react';
import { Project, TeamMember, Task, ProjectStatus, ProjectHealth, ProjectPriority } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { TrendingUp, PieChart, AlertTriangle, Clock, FolderKanban, ClipboardList, CheckCircle } from 'lucide-react';
import { safeFormatDate } from '@/utils';
import * as projectsSelectors from '@/selectors/projectsSelectors';
import { InlineErrorBanner } from '@/components/common/InlineErrorBanner';

Chart.register(ChartDataLabels);

interface ProjectsReportsTabProps {
  projects: Project[];
  teamMembers: TeamMember[];
}

const MetricCard: React.FC<{ title: string; value: string | number; description?: string; icon?: React.ReactNode }> = ({ title, value, description, icon }) => (
    <div className="bg-bg-base dark:bg-bg-muted p-4 rounded-xl shadow-md border border-border-base dark:border-border-muted flex items-center gap-4">
        {icon && <div className="p-2 bg-secondary-accent/10 text-secondary-accent rounded-lg">{icon}</div>}
        <div>
            <p className="text-sm text-text-muted">{title}</p>
            <p className="text-3xl font-bold text-text-heading dark:text-text-heading mt-1">{value}</p>
            {description && <p className="text-xs text-text-muted mt-1">{description}</p>}
        </div>
    </div>
);

export const ProjectsReportsTab: React.FC<ProjectsReportsTabProps> = ({ projects, teamMembers }) => {
    const barChartRef = useRef<HTMLCanvasElement>(null);
    const pieChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstances = useRef<{ bar?: any, pie?: any }>({});

    const metrics = useMemo(() => {
        return projectsSelectors.calculateProjectMetrics(projects, teamMembers);
    }, [projects, teamMembers]);

    useEffect(() => {
        // Destroy existing charts on re-render
        Object.values(chartInstances.current).forEach((chart: any) => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        chartInstances.current = {};
        const isDark = document.documentElement.classList.contains('dark');
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
        const textColor = isDark ? '#e2e8f0' : '#475569';

        // Bar Chart: Tasks
        if (barChartRef.current) {
            const barCtx = barChartRef.current.getContext('2d');
            if(barCtx) {
                chartInstances.current.bar = new Chart(barCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Tasks'],
                        datasets: [
                            { label: 'Completed', data: [metrics.taskSummary.completed], backgroundColor: '#16A34A', borderRadius: 4 },
                            { label: 'Pending', data: [metrics.taskSummary.pending], backgroundColor: '#f59e0b', borderRadius: 4 }
                        ]
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false,
                        scales: { 
                            y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } }, 
                            x: { ticks: { color: textColor }, grid: { display: false } } 
                        }, 
                        plugins: { legend: { labels: { color: textColor } } } 
                    }
                });
            }
        }

        // Pie Chart: Status
        if (pieChartRef.current) {
            const pieCtx = pieChartRef.current.getContext('2d');
            if (pieCtx) {
                chartInstances.current.pie = new Chart(pieCtx, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(metrics.statusCounts),
                        datasets: [{
                            data: Object.values(metrics.statusCounts),
                            backgroundColor: ['#3B82F6', '#F59E0B', '#EF4444', '#10B981', '#6B7280'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'right', labels: { color: textColor } } }
                    }
                });
            }
        }
    }, [metrics]);

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Total Projects" value={metrics.totalProjects} icon={<FolderKanban className="w-5 h-5" />} />
                <MetricCard title="Active Tasks" value={metrics.taskSummary.pending} icon={<ClipboardList className="w-5 h-5" />} />
                <MetricCard title="Completed Tasks" value={metrics.taskSummary.completed} icon={<CheckCircle className="w-5 h-5" />} />
                <MetricCard title="Overdue Tasks" value={metrics.overdueTasks.length} icon={<AlertTriangle className="w-5 h-5" />} />
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Task Status Overview">
                    <div className="h-64"><canvas ref={barChartRef}></canvas></div>
                </Card>
                <Card title="Project Status Distribution">
                    <div className="h-64"><canvas ref={pieChartRef}></canvas></div>
                </Card>
             </div>
             
             <Card title="Overdue Tasks">
                {metrics.overdueTasks.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="p-3 text-left">Task</th>
                                    <th className="p-3 text-left">Project</th>
                                    <th className="p-3 text-left">Assignee</th>
                                    <th className="p-3 text-left">Due Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.overdueTasks.map(task => (
                                    <tr key={task.id} className="border-t border-border-base dark:border-border-muted">
                                        <td className="p-3 font-medium">{task.title}</td>
                                        <td className="p-3">{task.projectName}</td>
                                        <td className="p-3">{task.assigneeName}</td>
                                        <td className="p-3 text-red-500">{safeFormatDate(task.dueDate)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-text-muted py-4">No overdue tasks.</p>
                )}
             </Card>
        </div>
    );
};
