
import React, { useMemo } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { TeamMember, OnboardingChecklist } from '../../types';

interface OnboardingViewProps {
  teamMembers: TeamMember[];
  onOpenTeamMemberHRFormModal: (member?: TeamMember | null) => void;
  onOpenOnboardingChecklistModal: (member: TeamMember) => void;
}

const RocketLaunchIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-6 h-6"}><path d="M3.5 2.75a.75.75 0 00-1.5 0V5.5A2.5 2.5 0 004.5 8H5v4.5A2.5 2.5 0 007.5 15h5A2.5 2.5 0 0015 12.5V8h.5a2.5 2.5 0 002.5-2.5V2.75a.75.75 0 00-1.5 0V5.5a1 1 0 01-1 1H4.5a1 1 0 01-1-1V2.75z" /><path d="M9.25 14.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5zM5.536 2.47a.75.75 0 00-1.072 1.06l1.72 1.72a.75.75 0 101.072-1.06l-1.72-1.72zm9.928 0a.75.75 0 011.072 1.06l-1.72 1.72a.75.75 0 11-1.072-1.06l1.72-1.72z" /></svg>;
const CheckBadgeIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-6 h-6"}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>;
const DocumentExclamationIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-6 h-6"}><path fillRule="evenodd" d="M15.982 3.966a.75.75 0 01.428.602V15a2 2 0 01-2 2H5.5a2 2 0 01-2-2V5.578a.75.75 0 01.428-.602l4.25-2.125a.75.75 0 01.644 0l4.25 2.125zM12 11.25a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008zM10.75 7.5a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z" clipRule="evenodd" /></svg>;

const calculateChecklistProgress = (checklist?: OnboardingChecklist): number => {
    if (!checklist) return 0;
    const items = Object.values(checklist);
    const completed = items.filter(Boolean).length;
    return (completed / items.length) * 100;
};

export const OnboardingView: React.FC<OnboardingViewProps> = ({ teamMembers, onOpenTeamMemberHRFormModal, onOpenOnboardingChecklistModal }) => {
    const onboardingEmployees = useMemo(() => {
        return teamMembers
            .filter(tm => tm.hrStatus === 'Probation' || tm.hrStatus === 'Contract')
            .sort((a,b) => new Date(b.dateJoined).getTime() - new Date(a.dateJoined).getTime());
    }, [teamMembers]);

    const dashboardStats = useMemo(() => {
        const total = onboardingEmployees.length;
        const complete = onboardingEmployees.filter(tm => calculateChecklistProgress(tm.onboardingChecklist) === 100).length;
        const incompleteDocuments = onboardingEmployees.filter(tm => !tm.onboardingChecklist?.documentsCollected).length;
        return { total, complete, incompleteDocuments };
    }, [onboardingEmployees]);
    
    return (
        <Card title="Employee Onboarding" className="bg-transparent shadow-none border-0 p-0 h-full flex flex-col"
            actions={<Button variant="primary" onClick={() => onOpenTeamMemberHRFormModal()}>+ Add New Hire</Button>}
        >
            <div className="flex-grow space-y-6 overflow-y-auto p-1">
                 {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <Card contentClassName="p-4 flex items-center space-x-4"><div className="p-3 bg-sky-100 dark:bg-sky-900/40 rounded-lg text-sky-600 dark:text-sky-400"><RocketLaunchIcon/></div><div><p className="text-2xl font-bold">{dashboardStats.total}</p><p className="text-sm text-text-muted">Actively Onboarding</p></div></Card>
                    <Card contentClassName="p-4 flex items-center space-x-4"><div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-lg text-green-600 dark:text-green-400"><CheckBadgeIcon/></div><div><p className="text-2xl font-bold">{dashboardStats.complete}</p><p className="text-sm text-text-muted">Onboarding Completed</p></div></Card>
                    <Card contentClassName="p-4 flex items-center space-x-4"><div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg text-yellow-600 dark:text-yellow-400"><DocumentExclamationIcon/></div><div><p className="text-2xl font-bold">{dashboardStats.incompleteDocuments}</p><p className="text-sm text-text-muted">Awaiting Documents</p></div></Card>
                </div>

                {/* Onboarding Employees Table */}
                <Card title="Current Onboarding Employees" className="bg-bg-base dark:bg-bg-muted">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="text-xs text-text-muted dark:text-text-muted uppercase bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="p-3 text-left">Employee</th>
                                    <th className="p-3 text-left">Department</th>
                                    <th className="p-3 text-left">Joining Date</th>
                                    <th className="p-3 text-left">Progress</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-base dark:divide-border-muted">
                                {onboardingEmployees.map(member => {
                                    const progress = calculateChecklistProgress(member.onboardingChecklist);
                                    return (
                                    <tr key={member.id}>
                                        <td className="p-3 font-medium">{member.name}</td>
                                        <td className="p-3">{member.department || 'N/A'}</td>
                                        <td className="p-3">{new Date(member.dateJoined).toLocaleDateString()}</td>
                                        <td className="p-3">
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                                <div className="bg-secondary-accent h-1.5 rounded-full transition-all" style={{width: `${progress}%`}}></div>
                                            </div>
                                        </td>
                                        <td className="p-3 text-right">
                                            <Button variant="outline" size="xs" onClick={() => onOpenOnboardingChecklistModal(member)}>Manage Checklist</Button>
                                        </td>
                                    </tr>
                                )})}
                                {onboardingEmployees.length === 0 && (
                                    <tr><td colSpan={5} className="p-4 text-center text-text-muted dark:text-text-muted">No employees currently in onboarding.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </Card>
    );
};
