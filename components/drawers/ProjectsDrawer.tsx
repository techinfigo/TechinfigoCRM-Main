


import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Project, Client, TeamMember, ProjectStatus, Task, FeatureKey, PermissionAction, projectStatuses, ProjectHealth, projectHealths, ProjectPriority, projectPriorities, BillingModel, billingModels, Milestone, ProjectsDrawerConfig, ProjectsDrawerMode } from '../../types';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { Checkbox } from '../common/Checkbox';
import { Card } from '../common/Card';
import { EmptyStatePlaceholder } from '../partials/EmptyStatePlaceholder';
import { LoadingSpinner } from '../partials/LoadingSpinner';
import { Search, Filter, X, Plus, List, FolderKanban, GanttChartSquare, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- PROPS INTERFACE ---
interface ProjectsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: ProjectsDrawerConfig;
  onUpdateConfig: (newConfig: ProjectsDrawerConfig) => void;
  projects: Project[];
  clients: Client[];
  teamMembers: TeamMember[];
  onSaveProject: (projectData: any) => void; // Simplified for this component
  onDeleteProject: (projectId: string) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

type ProjectViewTab = 'List' | 'Board' | 'Timeline' | 'Details';
type SortableProjectKeys = 'name' | 'clientName' | 'status' | 'dueDate' | 'priority' | 'health';

// --- HELPER FUNCTIONS ---
const getHealthDotColor = (health?: ProjectHealth) => {
    switch (health) {
        case 'On Track': return 'bg-status-positive';
        case 'At Risk': return 'bg-status-warning';
        case 'Off Track': return 'bg-status-negative';
        default: return 'bg-slate-400';
    }
};
const getPriorityClasses = (priority?: ProjectPriority) => {
    switch (priority) {
        case 'High': return 'text-status-negative';
        case 'Medium': return 'text-status-warning';
        case 'Low': return 'text-status-info';
        default: return 'text-text-muted';
    }
};

// --- MAIN COMPONENT ---
export const ProjectsDrawer: React.FC<ProjectsDrawerProps> = ({ isOpen, onClose, config, onUpdateConfig, projects, clients, teamMembers, onSaveProject, onDeleteProject, hasPermission }) => {
    const [lastTab, setLastTab] = useState<ProjectViewTab>(() => (localStorage.getItem('projects_last_tab') as ProjectViewTab) || 'List');
    
    // Determine active tab based on config and last saved tab
    const activeTab = config.projectId ? 'Details' : lastTab;

    const [isFormVisible, setIsFormVisible] = useState(config.mode === 'create');

    // Sync form visibility with URL state
    useEffect(() => {
        setIsFormVisible(config.mode === 'create');
    }, [config.mode]);

    const handleTabChange = (tab: ProjectViewTab) => {
        if (tab !== 'Details') {
            setLastTab(tab);
            localStorage.setItem('projects_last_tab', tab);
            onUpdateConfig({ clientId: config.clientId }); // Clear projectId when switching away from details
        }
    };

    const handleClose = () => {
        setIsFormVisible(false); // Hide form on close
        onClose();
    };
    
    // Memoize client name for header
    const clientName = useMemo(() => {
        if (!config.clientId) return null;
        return clients.find(c => c.id === config.clientId)?.name;
    }, [config.clientId, clients]);

    // Memoize project for Details tab
    const selectedProject = useMemo(() => {
        if (!config.projectId) return null;
        return projects.find(p => p.id === config.projectId);
    }, [config.projectId, projects]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
                    {/* Overlay */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
                        onClick={handleClose}
                    />
                    
                    {/* Drawer */}
                    <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-[720px] bg-white dark:bg-zinc-900 shadow-2xl flex flex-col h-full border-l border-zinc-200 dark:border-zinc-800"
                    >
                        {/* Header */}
                        <header className="flex-shrink-0 p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900">
                            <div>
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Projects</h2>
                                {clientName && <p className="text-sm text-zinc-500 font-medium tracking-tight">for {clientName}</p>}
                            </div>
                            <div className="flex items-center gap-3">
                                {hasPermission('projects', 'canCreate') && (
                                    <Button variant="primary" size="sm" onClick={() => onUpdateConfig({ clientId: config.clientId, mode: 'create' })} leftIcon={<Plus className="w-4 h-4"/>}>
                                        New Project
                                    </Button>
                                )}
                                <button onClick={handleClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>
                        </header>

                        <div className="flex-1 flex flex-col overflow-hidden">
                            {isFormVisible && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/20"
                                >
                                    <NewProjectForm 
                                        onSave={onSaveProject}
                                        onCancel={() => onUpdateConfig({ clientId: config.clientId })}
                                        clients={clients}
                                        teamMembers={teamMembers}
                                        prefillClientId={config.clientId}
                                    />
                                </motion.div>
                            )}
                            
                            {/* Tabs */}
                            {!config.projectId && (
                                <div className="px-6 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
                                    <nav className="-mb-px flex space-x-6">
                                        {(['List', 'Board', 'Timeline'] as ProjectViewTab[]).map(tab => (
                                            <button
                                                key={tab}
                                                onClick={() => handleTabChange(tab)}
                                                className={`py-4 px-1 border-b-2 text-sm font-semibold transition-all ${activeTab === tab ? 'border-primary-accent text-primary-accent' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-zinc-900">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {activeTab === 'List' && <ListView projects={projects} clients={clients} teamMembers={teamMembers} onSelectProject={(p) => onUpdateConfig({ clientId: config.clientId, projectId: p.id })} />}
                                    {activeTab === 'Board' && <BoardView projects={projects} />}
                                    {activeTab === 'Timeline' && <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
                                        <GanttChartSquare className="w-12 h-12 mb-4 opacity-20" />
                                        <p>Timeline view is coming soon.</p>
                                    </div>}
                                    {activeTab === 'Details' && selectedProject && <ProjectDetailView project={selectedProject} />}
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

// --- SUB-COMPONENTS for TABS and FORMS ---

const ListView: React.FC<{ projects: Project[], clients: Client[], teamMembers: TeamMember[], onSelectProject: (project: Project) => void }> = ({ projects, clients, teamMembers, onSelectProject }) => {
    // Basic list view for now, filtering and sorting can be added here
    return (
        <div className="overflow-x-auto rounded-lg border border-border-base dark:border-border-muted">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/40 text-xs uppercase text-text-muted">
                    <tr>
                        <th className="p-3 text-left">Title</th>
                        <th className="p-3 text-left">Client</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Health</th>
                        <th className="p-3 text-left">Due</th>
                    </tr>
                </thead>
                <tbody className="bg-bg-base dark:bg-bg-base divide-y divide-border-base dark:divide-border-muted">
                    {projects.map(p => (
                        <tr key={p.id} onClick={() => onSelectProject(p)} className="cursor-pointer hover:bg-highlight-accent dark:hover:bg-slate-800/60">
                            <td className="p-3 font-medium text-text-heading dark:text-text-heading">{p.name}</td>
                            <td className="p-3">{p.clientName}</td>
                            <td className="p-3">{p.status}</td>
                            <td className="p-3"><div className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${getHealthDotColor(p.health)}`}></span> {p.health}</div></td>
                            <td className="p-3">{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const BoardView: React.FC<{ projects: Project[] }> = ({ projects }) => {
    const KANBAN_COLUMNS: ProjectStatus[] = ['Backlog', 'In Progress', 'Review', 'Blocked', 'Done'];
    const projectsByStatus = useMemo(() => {
        return KANBAN_COLUMNS.reduce((acc, status) => {
            acc[status] = projects.filter(p => p.status === status);
            return acc;
        }, {} as Record<ProjectStatus, Project[]>);
    }, [projects]);
    
    return (
        <div className="flex-1 flex overflow-hidden -m-4">
            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
                <div className="inline-flex h-full min-w-full p-4 space-x-4">
                    {KANBAN_COLUMNS.map(status => (
                        <div key={status} className="flex-shrink-0 w-72 rounded-xl flex flex-col h-full bg-slate-100 dark:bg-slate-800/50">
                            <h3 className="text-sm font-semibold p-3 border-b border-black/5 dark:border-white/5 text-text-heading dark:text-text-base sticky top-0 bg-inherit rounded-t-lg z-10">
                                {status} <span className="text-text-muted font-normal">{projectsByStatus[status]?.length > 0 ? projectsByStatus[status].length : ''}</span>
                            </h3>
                            <div className="p-3 space-y-3 flex-grow overflow-y-auto scrollbar-hide">
                                {projectsByStatus[status]?.map(p => (
                                    <div key={p.id} draggable className="p-3 bg-bg-base dark:bg-slate-800 rounded-lg shadow-md border border-border-base dark:border-slate-700 cursor-grab active:cursor-grabbing">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-sm text-text-base dark:text-text-base">{p.name}</p>
                                            <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${getHealthDotColor(p.health)}`} title={`Health: ${p.health}`}></div>
                                        </div>
                                        <p className="text-xs text-text-muted mt-1">{p.clientName}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ProjectDetailView: React.FC<{ project: Project }> = ({ project }) => {
     return (
        <Card title="Project Details">
            <p><strong>Name:</strong> {project.name}</p>
            <p><strong>Client:</strong> {project.clientName}</p>
            <p><strong>Status:</strong> {project.status}</p>
            <p>More details coming soon...</p>
        </Card>
    );
};

// --- New Project Form ---
type ProjectTemplate = 'SEO' | 'Ads' | 'Website' | 'Creative Shoot' | 'Blank';

const NewProjectForm: React.FC<{
    onSave: (data: any) => void;
    onCancel: () => void;
    clients: Client[];
    teamMembers: TeamMember[];
    prefillClientId?: string;
}> = ({ onSave, onCancel, clients, teamMembers, prefillClientId }) => {
    const [formData, setFormData] = useState({
        name: '',
        clientId: prefillClientId || (clients[0]?.id || ''),
        status: 'Backlog' as ProjectStatus,
        priority: 'Medium' as ProjectPriority,
        health: 'On Track' as ProjectHealth,
        startDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        managerId: '',
    });

    const handleSave = () => {
        // Basic validation
        if (!formData.name || !formData.clientId || !formData.managerId) {
            alert('Name, Client, and Manager are required.');
            return;
        }
        onSave(formData);
    };

    const handleTemplateChange = (template: ProjectTemplate) => {
        if (template !== 'Blank') {
            setFormData(prev => ({ ...prev, name: `${template} Campaign for ${clients.find(c=>c.id === prev.clientId)?.name || ''}` }));
        }
    };
    
    return (
        <div className="p-4 border-b border-border-base dark:border-border-muted bg-bg-base dark:bg-bg-base flex-shrink-0 animate-content-fade-in">
            <h3 className="font-semibold mb-3">New Project</h3>
            <div className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Project Title *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Client *</label>
                        <select value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} disabled={!!prefillClientId} className="w-full p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm">
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Start Date" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                    <Input label="Due Date" type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Manager *</label>
                        <select value={formData.managerId} onChange={e => setFormData({...formData, managerId: e.target.value})} className="w-full p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm">
                            <option value="">Select Manager</option>
                            {teamMembers.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Template</label>
                        <select onChange={e => handleTemplateChange(e.target.value as ProjectTemplate)} className="w-full p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm">
                             {(['Blank', 'SEO', 'Ads', 'Website', 'Creative Shoot'] as ProjectTemplate[]).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                 </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave}>Create Project</Button>
                </div>
            </div>
        </div>
    );
};