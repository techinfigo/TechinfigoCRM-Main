
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { TeamMember } from '../../types';
import Chart from 'chart.js/auto';

interface ExitManagementViewProps {
  teamMembers: TeamMember[];
  onOpenExitChecklistModal: (member: TeamMember) => void;
  onOpenScheduleExitInterviewModal: () => void;
}

const UserMinusIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-6 h-6"}><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" /><path d="M14 12.75a.75.75 0 000-1.5H6a.75.75 0 000 1.5h8z" /></svg>;
const ClipboardDocumentCheckIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-6 h-6"}><path fillRule="evenodd" d="M15.508 3.535a2.5 2.5 0 010 3.536l-6.5 6.5a2.5 2.5 0 01-3.536 0l-1.5-1.5a2.5 2.5 0 113.536-3.536l4.242 4.242a.5.5 0 00.708-.707l-4.243-4.243a4 4 0 10-5.656 5.657l1.5 1.5a4 4 0 005.656 0l6.5-6.5a4 4 0 00-5.656-5.657l-1.928 1.928a.5.5 0 01-.708-.707l1.928-1.928z" clipRule="evenodd" /></svg>;
const QuestionMarkCircleIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-6 h-6"}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.06-1.061 3.5 3.5 0 116.12 2.687.75.75 0 01-1.06-1.061 2 2 0 10-3.255-1.625zM10 12a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>;

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <Card className="bg-bg-base dark:bg-bg-muted" contentClassName="flex items-center space-x-4 p-4">
        <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-lg text-red-600 dark:text-red-400">{icon}</div>
        <div>
            <p className="text-2xl font-bold text-text-heading dark:text-text-heading">{value}</p>
            <p className="text-sm text-text-muted dark:text-text-muted">{title}</p>
        </div>
    </Card>
);

const getStatusBadgeStyle = (status?: boolean): string => {
    return status 
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
};

export const ExitManagementView: React.FC<ExitManagementViewProps> = ({ teamMembers, onOpenExitChecklistModal, onOpenScheduleExitInterviewModal }) => {
    const attritionChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    const exitingEmployees = useMemo(() => {
        return teamMembers.filter(tm => tm.hrStatus === 'Resigned');
    }, [teamMembers]);

    const dashboardStats = useMemo(() => {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const upcomingExits = exitingEmployees.filter(tm => tm.exitDate && new Date(tm.exitDate) > now && new Date(tm.exitDate) < nextMonth).length;
        
        const completedExits = exitingEmployees.filter(tm => {
            const checklist = tm.exitChecklist;
            return checklist && Object.values(checklist).every(Boolean);
        }).length;

        const interviewsPending = exitingEmployees.filter(tm => !tm.exitChecklist?.exitInterviewConducted).length;

        return { upcomingExits, completedExits, interviewsPending };
    }, [exitingEmployees]);

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        if (attritionChartRef.current) {
            const ctx = attritionChartRef.current.getContext('2d');
            if (ctx) {
                chartInstance.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            label: 'Monthly Attrition Rate (%)',
                            data: [1.5, 2.1, 1.8, 3.0, 2.5, 2.8],
                            borderColor: '#DC2626',
                            backgroundColor: 'rgba(220, 38, 38, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }
        }
    }, []);

    return (
        <Card title="Exit Management" className="bg-transparent shadow-none border-0 p-0 h-full flex flex-col"
            actions={<Button variant="primary" onClick={onOpenScheduleExitInterviewModal}>Schedule Exit Interview</Button>}
        >
            <div className="flex-grow space-y-6 overflow-y-auto p-1">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <StatCard title="Upcoming Exits (Next 30 Days)" value={dashboardStats.upcomingExits} icon={<UserMinusIcon />} />
                    <StatCard title="Exits Completed" value={dashboardStats.completedExits} icon={<ClipboardDocumentCheckIcon />} />
                    <StatCard title="Exit Interviews Pending" value={dashboardStats.interviewsPending} icon={<QuestionMarkCircleIcon />} />
                </div>
                
                {/* Attrition Chart */}
                <Card title="Monthly Attrition Trends" className="bg-bg-base dark:bg-bg-muted">
                    <div className="h-64"><canvas ref={attritionChartRef}></canvas></div>
                </Card>

                {/* Exiting Employees Table */}
                <Card title="Exiting Employees List" className="bg-bg-base dark:bg-bg-muted">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="text-xs text-text-muted dark:text-text-muted uppercase bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="p-3 text-left">Employee</th>
                                    <th className="p-3 text-left">Department</th>
                                    <th className="p-3 text-left">Exit Date</th>
                                    <th className="p-3 text-left">Reason</th>
                                    <th className="p-3 text-center">Interview</th>
                                    <th className="p-3 text-center">Clearance</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-base dark:divide-border-muted">
                                {exitingEmployees.map(member => (
                                    <tr key={member.id}>
                                        <td className="p-3 font-medium">{member.name}</td>
                                        <td className="p-3">{member.department || 'N/A'}</td>
                                        <td className="p-3">{member.exitDate ? new Date(member.exitDate).toLocaleDateString() : 'N/A'}</td>
                                        <td className="p-3">{member.reasonForExit || 'N/A'}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-xxs font-semibold ${getStatusBadgeStyle(member.exitChecklist?.exitInterviewConducted)}`}>
                                                {member.exitChecklist?.exitInterviewConducted ? 'Done' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-xxs font-semibold ${getStatusBadgeStyle(member.exitChecklist?.clearanceFormSubmitted)}`}>
                                                 {member.exitChecklist?.clearanceFormSubmitted ? 'Done' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <Button variant="outline" size="xs" onClick={() => onOpenExitChecklistModal(member)}>View Checklist</Button>
                                        </td>
                                    </tr>
                                ))}
                                {exitingEmployees.length === 0 && (
                                    <tr><td colSpan={7} className="p-4 text-center text-text-muted dark:text-text-muted">No employees currently in the exit process.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </Card>
    );
};
