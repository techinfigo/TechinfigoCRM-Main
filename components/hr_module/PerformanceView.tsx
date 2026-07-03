
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { TeamMember, PerformanceReview } from '../../types';
import Chart from 'chart.js/auto';
import { EmptyStatePlaceholder } from '../partials/EmptyStatePlaceholder';

interface PerformanceViewProps {
    teamMembers: TeamMember[];
    performanceReviews: PerformanceReview[];
    onOpenPerformanceReviewModal: (employee: TeamMember, review?: PerformanceReview) => void;
}

const StarIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-6 h-6"}><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.39-3.423 3.595c-.736.771.256 1.991.984 1.991H6.9l-1.296 4.401c-.16.546.435.946.945.626L10 15.11l2.371 2.754c.484.563 1.377.206 1.486-.459l.526-3.23L15.013 18c.554.01.98-.426.98-.979l.003-3.712 2.768-.23c.63-.053.923-.83.486-1.309l-3.423-3.595-4.753-.39-1.83-4.401z" clipRule="evenodd" /></svg>;
const CheckBadgeIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-6 h-6"}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>;
const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-6 h-6"}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12.5a7.5 7.5 0 00-6.353 3.635A8.004 8.004 0 0010 18a8.004 8.004 0 006.353-1.865A7.5 7.5 0 0010 12.5z" clipRule="evenodd" /></svg>;

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <Card className="bg-bg-base dark:bg-bg-muted" contentClassName="flex items-center space-x-4 p-4">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-lg text-purple-600 dark:text-purple-400">{icon}</div>
        <div>
            <p className="text-2xl font-bold text-text-heading dark:text-text-heading">{value}</p>
            <p className="text-sm text-text-muted dark:text-text-muted">{title}</p>
        </div>
    </Card>
);

export const PerformanceView: React.FC<PerformanceViewProps> = ({ teamMembers, performanceReviews, onOpenPerformanceReviewModal }) => {
    const departmentChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    const performanceData = useMemo(() => {
        const latestReviews = new Map<string, PerformanceReview>();
        performanceReviews.forEach(review => {
            if (!latestReviews.has(review.employeeId) || new Date(review.reviewDate).getTime() > new Date(latestReviews.get(review.employeeId)!.reviewDate).getTime()) {
                latestReviews.set(review.employeeId, review);
            }
        });
        
        const ratings = Array.from(latestReviews.values()).map(r => (Object.values(r.performanceRatings) as number[]).reduce((a, b) => a + b, 0) / 4);
        const averageScore = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        
        return {
            averageScore: parseFloat(averageScore.toFixed(2)),
            reviewsCompleted: latestReviews.size,
            employeesUnderReview: teamMembers.length,
        };
    }, [performanceReviews, teamMembers]);

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        if (departmentChartRef.current) {
            const ctx = departmentChartRef.current.getContext('2d');
            if (ctx) {
                chartInstance.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [
                            { label: 'Development', data: [3.8, 3.9, 4.1, 4.0, 4.2, 4.3], borderColor: '#3B82F6', tension: 0.3 },
                            { label: 'Design', data: [4.2, 4.1, 4.3, 4.4, 4.5, 4.4], borderColor: '#8B5CF6', tension: 0.3 },
                            { label: 'Marketing', data: [3.9, 4.0, 3.8, 4.1, 4.0, 4.2], borderColor: '#10B981', tension: 0.3 }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: true, position: 'bottom' } },
                        scales: { y: { beginAtZero: false, max: 5, min: 3 } }
                    }
                });
            }
        }
    }, []);
    
    return (
        <Card title="Performance Management" className="bg-transparent shadow-none border-0 p-0"
            actions={onOpenPerformanceReviewModal && teamMembers.length > 0 && (
                <Button variant="primary" size="sm" onClick={() => onOpenPerformanceReviewModal(teamMembers[0])} leftIcon={<StarIcon className="w-4 h-4"/>}>
                    Add Review
                </Button>
            )}
        >
            <div className="space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <StatCard title="Employees Under Review" value={performanceData.employeesUnderReview} icon={<UserCircleIcon />} />
                    <StatCard title="Reviews Completed" value={performanceData.reviewsCompleted} icon={<CheckBadgeIcon />} />
                    <StatCard title="Average Performance Score" value={performanceData.averageScore} icon={<StarIcon />} />
                 </div>

                 <Card title="Department-wise Average Scores (Last 6 Months)" className="bg-bg-base dark:bg-bg-muted">
                     <div className="h-72"><canvas ref={departmentChartRef}></canvas></div>
                 </Card>

                 <Card title="Employee Performance Records" className="bg-bg-base dark:bg-bg-muted">
                    {teamMembers.length === 0 ? (
                        <EmptyStatePlaceholder
                            icon={<UserCircleIcon className="w-16 h-16" />}
                            title="No Team Members"
                            message="Add team members to start tracking performance reviews."
                        />
                    ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="text-xs text-text-muted dark:text-text-muted uppercase bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="p-3 text-left">Employee</th>
                                    <th className="p-3 text-left">Department</th>
                                    <th className="p-3 text-left">Last Review Date</th>
                                    <th className="p-3 text-left">Reviewer</th>
                                    <th className="p-3 text-center">Score</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-base dark:divide-border-muted">
                                {teamMembers.map(member => {
                                    const latestReview = performanceReviews
                                        .filter(r => r.employeeId === member.id)
                                        .sort((a,b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime())[0];
                                    
                                    const avgScore = latestReview ? ((Object.values(latestReview.performanceRatings) as number[]).reduce((a,b) => a+b, 0) / 4).toFixed(1) : 'N/A';

                                    return (
                                        <tr key={member.id}>
                                            <td className="p-3 font-medium">{member.name}</td>
                                            <td className="p-3">{member.department || 'N/A'}</td>
                                            <td className="p-3">{latestReview ? new Date(latestReview.reviewDate).toLocaleDateString() : 'N/A'}</td>
                                            <td className="p-3">{latestReview?.reviewerName || 'N/A'}</td>
                                            <td className="p-3 text-center font-semibold">{avgScore}</td>
                                            <td className="p-3 text-right">
                                                <Button variant="outline" size="xs" onClick={() => onOpenPerformanceReviewModal(member, latestReview)}>
                                                    {latestReview ? 'View / Edit' : 'Add Review'}
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    )}
                 </Card>
            </div>
        </Card>
    );
}
