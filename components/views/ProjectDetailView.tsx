
import React, { useState, useEffect, useMemo } from 'react';
import { Project, Client, TeamMember, Task, ProjectStatus, projectStatuses, ProjectHealth, projectHealths, ProjectPriority, projectPriorities, FeatureKey, PermissionAction, TimeLog, ProjectConnectors } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Input, TextArea } from '../common/Input';
import { Modal } from '../common/Modal';
import { ChevronLeft, Edit, List, Activity, Settings, Clock } from 'lucide-react';
import { TasksSection } from '../TasksSection';
import { safeFormatDate } from '@/utils';

// --- ICONS for Integrations ---
const GoogleAnalyticsIcon = () => ( <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="10" width="4" height="10" rx="1" fill="#F4B400"/><rect x="10" y="4" width="4" height="16" rx="1" fill="#4285F4"/><rect x="16" y="14" width="4" height="6" rx="1" fill="#0F9D58"/></svg> );
const GoogleSearchConsoleIcon = () => ( <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3S3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="#4285F4"/></svg> );
const MetaIcon = () => ( <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.85 0 3.58-.51 5.09-1.42l-1.45-2.52c-1.02.66-2.21 1.04-3.54 1.04-3.86 0-7-3.14-7-7s3.14-7 7-7c1.49 0 2.87.46 4.08 1.27L17.5 3.5C15.96 2.56 14.07 2 12 2Z" fill="#0062E0"/><path d="M22 12c0-2.07-.56-3.96-1.5-5.5L19.05 8.77C19.54 9.99 19.8 11.26 19.8 12.6c0 1.52-.33 2.94-.92 4.22l1.63 2.82C21.49 18.15 22 16.42 22 14.5c0-.85-.11-1.67-.32-2.45" fill="#589BFF" /></svg> );
const GoogleAdsIcon = () => ( <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#4285F4"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="#4285F4"/><path d="M12 8c-2.21 0-4 1.79-4 4h8c0-2.21-1.79-4-4-4z" fill="#FBBC05"/><path d="M12 16c2.21 0 4-1.79 4-4H8c0 2.21 1.79 4 4-4z" fill="#34A853"/><path d="M8 12c0-2.21 1.79-4 4-4v8c-2.21 0-4-1.79-4-4-4z" fill="#EA4335"/></svg> );


// --- PROPS INTERFACE ---
interface ProjectDetailViewProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    clients: Client[];
    teamMembers: TeamMember[];
    onUpdateProject: (project: Project) => void;
    onAddTask: (projectId: string, taskData: Omit<Task, 'id' | 'completed' | 'status'>) => void;
    onUpdateTask: (projectId: string, task: Task) => void;
    onDeleteTask: (projectId: string, taskId: string) => void;
    onEditProjectDetails: () => void; // To open the main project form modal
    hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
    onOpenTimeLogModal: (log: TimeLog | null, defaults?: { projectId?: string; taskId?: string }) => void;
    timeLogs: TimeLog[];
    currentUser: TeamMember | null;
    overrideZIndex?: string;
}

// --- DEBOUNCE HOOK for auto-saving ---
const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


// --- MAIN COMPONENT ---
export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
    isOpen, onClose, project, clients, teamMembers, onUpdateProject, onAddTask, onUpdateTask, onDeleteTask, onEditProjectDetails, hasPermission, onOpenTimeLogModal, timeLogs, currentUser, overrideZIndex
}) => {
    
    const [editedProject, setEditedProject] = useState<Project | null>(project);
    const [activeTab, setActiveTab] = useState<'Overview' | 'Tasks' | 'Time Logs' | 'Integrations'>('Tasks');
    const debouncedProject = useDebounce(editedProject, 500);

    // Update local state if the project prop changes (e.g., from parent state update)
    useEffect(() => {
        setEditedProject(project);
    }, [project]);

    // Auto-save debounced changes
    useEffect(() => {
        if (debouncedProject && JSON.stringify(debouncedProject) !== JSON.stringify(project)) {
            onUpdateProject(debouncedProject);
        }
    }, [debouncedProject, project, onUpdateProject]);
    
    const handleFieldChange = (field: keyof Project, value: any) => {
        setEditedProject(prev => prev ? { ...prev, [field]: value } : null);
    };
    
    if (!isOpen) return null;
    if (!editedProject) {
        return (
            <Modal isOpen={true} onClose={onClose} title="Error" size="md">
                <p>Project not found. It may have been deleted.</p>
            </Modal>
        );
    }
    
    const tabItems = [
        { id: 'Overview', label: 'Overview', icon: <Activity /> },
        { id: 'Tasks', label: 'Tasks', icon: <List /> },
        { id: 'Time Logs', label: 'Time Logs', icon: <Clock /> },
        { id: 'Integrations', label: 'Integrations', icon: <Settings /> },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Overview':
                return <ProjectOverviewTab project={editedProject} onFieldChange={handleFieldChange} clients={clients} teamMembers={teamMembers} onEditProjectDetails={onEditProjectDetails} />;
            case 'Tasks':
                return <TasksSection project={editedProject} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} onAddTask={onAddTask} teamMembers={teamMembers} />;
            case 'Time Logs':
                return <ProjectTimeLogsTab project={editedProject} timeLogs={timeLogs} teamMembers={teamMembers} onOpenTimeLogModal={onOpenTimeLogModal} />;
            case 'Integrations':
                return <IntegrationsSection project={editedProject} setProject={setEditedProject} />;
            default:
                return null;
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={` `} size="6xl" overrideZIndex={overrideZIndex || "z-[1001]"}>
            <div className="flex flex-col h-full -m-6 p-6">
                {/* Header with Breadcrumbs */}
                <header className="flex-shrink-0 pb-4 border-b border-border-base dark:border-border-muted">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-text-muted dark:text-slate-400">
                           <button onClick={onClose} className="hover:underline">CRM</button> › <button onClick={onClose} className="hover:underline">Projects</button> › <span className="font-semibold text-text-base dark:text-slate-200">{editedProject.name}</span>
                        </div>
                         <Button variant="secondary" size="sm" onClick={onClose} leftIcon={<ChevronLeft className="w-4 h-4" />}>Back to Projects</Button>
                    </div>
                </header>
                
                {/* Tabs */}
                <div className="border-b border-border-base dark:border-slate-700 mt-4 flex-shrink-0">
                    <nav className="-mb-px flex space-x-4">
                        {tabItems.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium flex items-center gap-2
                                ${activeTab === tab.id
                                    ? 'border-premium-accent text-premium-accent dark:border-premium-accent-dark dark:text-premium-accent-dark'
                                    : 'border-transparent text-text-muted hover:text-text-base hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                                }`}
                            >
                                {React.cloneElement(tab.icon, { className: 'w-4 h-4' })}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto pt-6">
                    {renderTabContent()}
                </main>
            </div>
        </Modal>
    );
};

// --- PROJECT OVERVIEW TAB ---
const ProjectOverviewTab: React.FC<{
    project: Project;
    onFieldChange: (field: keyof Project, value: any) => void;
    clients: Client[];
    teamMembers: TeamMember[];
    onEditProjectDetails: () => void;
}> = ({ project, onFieldChange, clients, teamMembers, onEditProjectDetails }) => {
    const selectBaseClass = "w-full p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-premium-accent";
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card title="Project Overview" actions={<Button variant="outline" size="sm" onClick={onEditProjectDetails} leftIcon={<Edit className="w-4 h-4"/>}>Edit Details</Button>}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Input label="Project Title" value={project.name} onChange={e => onFieldChange('name', e.target.value)} />
                       <div>
                           <label className="block text-sm font-medium text-text-muted mb-1">Client</label>
                           <select value={project.clientId} onChange={e => onFieldChange('clientId', e.target.value)} className={selectBaseClass}>
                               {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                           </select>
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-text-muted mb-1">Status</label>
                           <select value={project.status} onChange={e => onFieldChange('status', e.target.value as ProjectStatus)} className={selectBaseClass}>
                               {projectStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                       </div>
                       <Input label="Due Date" type="date" value={project.dueDate?.split('T')[0] || ''} onChange={e => onFieldChange('dueDate', e.target.value)} />
                   </div>
                   <div className="mt-4">
                        <Input label="Tags (comma-separated)" value={(project.tags || []).join(', ')} onChange={e => onFieldChange('tags', e.target.value.split(',').map(t=>t.trim()))} />
                   </div>
                </Card>
            </div>
            <div className="space-y-6">
                <Card title="Team & Status">
                    <div>
                       <label className="block text-sm font-medium text-text-muted mb-1">Project Manager</label>
                       <select value={project.managerId} onChange={e => onFieldChange('managerId', e.target.value)} className={selectBaseClass}>
                           <option value="">Select a manager</option>
                           {teamMembers.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                       </select>
                    </div>
                     <div className="mt-4 grid grid-cols-2 gap-4">
                       <div>
                           <label className="block text-sm font-medium text-text-muted mb-1">Health</label>
                           <select value={project.health} onChange={e => onFieldChange('health', e.target.value as ProjectHealth)} className={selectBaseClass}>
                               {projectHealths.map(h => <option key={h} value={h}>{h}</option>)}
                           </select>
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-text-muted mb-1">Priority</label>
                           <select value={project.priority} onChange={e => onFieldChange('priority', e.target.value as ProjectPriority)} className={selectBaseClass}>
                               {projectPriorities.map(p => <option key={p} value={p}>{p}</option>)}
                           </select>
                       </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// --- PROJECT TIME LOGS TAB ---
const ProjectTimeLogsTab: React.FC<{
    project: Project;
    timeLogs: TimeLog[];
    teamMembers: TeamMember[];
    onOpenTimeLogModal: (log: TimeLog | null, defaults?: { projectId?: string; taskId?: string }) => void;
}> = ({ project, timeLogs, teamMembers, onOpenTimeLogModal }) => {
    
    // Filter time logs for this project
    const projectTimeLogs = useMemo(() => {
        return timeLogs
            .filter(log => log.projectId === project.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [timeLogs, project.id]);

    const totalHours = useMemo(() => projectTimeLogs.reduce((sum, log) => sum + log.hours, 0), [projectTimeLogs]);

    return (
        <Card title="Project Time Tracking" actions={
            <Button size="sm" variant="primary" onClick={() => onOpenTimeLogModal(null, { projectId: project.id })} leftIcon={<Clock className="w-4 h-4"/>}>Log Time</Button>
        }>
            {projectTimeLogs.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-6">No time logged for this project yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-text-muted">
                            <tr>
                                <th className="p-3 text-left">Date</th>
                                <th className="p-3 text-left">Member</th>
                                <th className="p-3 text-left">Task / Note</th>
                                <th className="p-3 text-right">Hours</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-base dark:divide-slate-700">
                            {projectTimeLogs.map(log => {
                                const member = teamMembers.find(tm => tm.id === log.memberId);
                                const task = project.tasks.find(t => t.id === log.taskId);
                                return (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="p-3">{safeFormatDate(log.date)}</td>
                                        <td className="p-3">{member ? member.name : 'Unknown User'}</td>
                                        <td className="p-3">
                                            {task && <span className="font-semibold block">{task.title}</span>}
                                            <span className="text-text-muted">{log.notes}</span>
                                        </td>
                                        <td className="p-3 text-right font-medium">{log.hours.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-800/50 font-bold">
                            <tr>
                                <td colSpan={3} className="p-3 text-right">Total Hours</td>
                                <td className="p-3 text-right">{totalHours.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </Card>
    );
};

// --- INTEGRATIONS SECTION ---
const showToast = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-5 right-5 bg-premium-accent text-white py-2 px-4 rounded-lg shadow-lg animate-content-fade-in z-[2000]';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'content-fade-out 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
    const style = document.createElement('style');
    style.innerHTML = `@keyframes content-fade-out { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); } }`;
    document.head.appendChild(style);
};

const IntegrationProvider: React.FC<{
    title: string;
    icon: React.ReactNode;
    isConnected: boolean;
    children: React.ReactNode;
}> = ({ title, icon, isConnected, children }) => {
    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-border-base dark:border-border-muted">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    {icon}
                    <h4 className="font-semibold text-text-base dark:text-text-base">{title}</h4>
                </div>
                {isConnected && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-status-positive/10 text-status-positive border border-status-positive/30">
                        <CheckCircle size={14} />
                        Connected
                    </span>
                )}
            </div>
            {children}
        </div>
    );
};

const CheckCircle = ({size}: {size: number}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;

const IntegrationsSection: React.FC<{
    project: Project;
    setProject: React.Dispatch<React.SetStateAction<Project | null>>;
}> = ({ project, setProject }) => {

    const handleConnectorChange = (provider: keyof ProjectConnectors, field: string, value: string) => {
        setProject(prev => {
            if (!prev) return null;
            const newConnectors = { ...prev.connectors };
            // @ts-ignore
            newConnectors[provider] = { ...newConnectors[provider], [field]: value };
            return { ...prev, connectors: newConnectors };
        });
    };

    const handleConnect = (provider: keyof ProjectConnectors, requiredFields: string[]) => {
        const data = project.connectors?.[provider] as Record<string, string> | undefined;
        if (requiredFields.every(field => data?.[field]?.trim())) {
            showToast(`${provider.toUpperCase()} Connected (placeholder)`);
        } else {
            alert(`Please fill in all required fields for ${provider.toUpperCase()}.`);
        }
    };

    return (
        <Card title="Integrations">
            <div className="space-y-4">
                <IntegrationProvider title="Google Analytics 4" icon={<GoogleAnalyticsIcon />} isConnected={!!(project.connectors?.ga4?.propertyId && project.connectors?.ga4?.measurementId)}>
                    <div className="space-y-3">
                        <Input label="Property ID" value={project.connectors?.ga4?.propertyId || ''} onChange={e => handleConnectorChange('ga4', 'propertyId', e.target.value)} placeholder="G-XXXXXXXXXX" />
                        <Input label="Measurement ID" value={project.connectors?.ga4?.measurementId || ''} onChange={e => handleConnectorChange('ga4', 'measurementId', e.target.value)} placeholder="123456789" />
                        <div className="flex justify-end"><Button size="sm" onClick={() => handleConnect('ga4', ['propertyId', 'measurementId'])}>Connect</Button></div>
                    </div>
                </IntegrationProvider>

                <IntegrationProvider title="Google Search Console" icon={<GoogleSearchConsoleIcon />} isConnected={!!project.connectors?.gsc?.siteUrl}>
                    <div className="space-y-3">
                        <Input label="Site URL" value={project.connectors?.gsc?.siteUrl || ''} onChange={e => handleConnectorChange('gsc', 'siteUrl', e.target.value)} placeholder="https://example.com" />
                        <div className="flex justify-end"><Button size="sm" onClick={() => handleConnect('gsc', ['siteUrl'])}>Connect</Button></div>
                    </div>
                </IntegrationProvider>

                <IntegrationProvider title="Meta Ads" icon={<MetaIcon />} isConnected={!!project.connectors?.metaAds?.adAccountId}>
                    <div className="space-y-3">
                        <Input label="Ad Account ID" value={project.connectors?.metaAds?.adAccountId || ''} onChange={e => handleConnectorChange('metaAds', 'adAccountId', e.target.value)} placeholder="act_1234567890" />
                        <div className="flex justify-end"><Button size="sm" onClick={() => handleConnect('metaAds', ['adAccountId'])}>Connect</Button></div>
                    </div>
                </IntegrationProvider>

                <IntegrationProvider title="Google Ads" icon={<GoogleAdsIcon />} isConnected={!!project.connectors?.googleAds?.customerId}>
                    <div className="space-y-3">
                        <Input label="Customer ID" value={project.connectors?.googleAds?.customerId || ''} onChange={e => handleConnectorChange('googleAds', 'customerId', e.target.value)} placeholder="123-456-7890" />
                        <div className="flex justify-end"><Button size="sm" onClick={() => handleConnect('googleAds', ['customerId'])}>Connect</Button></div>
                    </div>
                </IntegrationProvider>
            </div>
        </Card>
    );
};
