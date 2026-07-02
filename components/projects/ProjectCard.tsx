
import React, { useState, useRef, useEffect, useMemo, DragEvent, KeyboardEvent } from 'react';
import { Project, TeamMember, ProjectStatus, ProjectHealth, ProjectPriority, projectStatuses } from '../../types';
import { Button } from '../common/Button';
import { MoreVertical, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProjectCardProps {
    project: Project;
    teamMembers: TeamMember[];
    isDragging: boolean;
    onDragStart: (e: DragEvent<HTMLDivElement>) => void;
    onDragEnd: () => void;
    onUpdateProject: (project: Project) => void;
    onViewProjectDetail: (project: Project) => void;
    onKeyDown: (e: KeyboardEvent<HTMLDivElement>, project: Project) => void;
    isLifted: boolean;
}

const getPriorityBadgeStyles = (priority?: ProjectPriority) => {
    switch (priority) {
        case 'Critical': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
        case 'High': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
        case 'Medium': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
        case 'Low': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
};

const getHealthColor = (health?: ProjectHealth) => {
    switch (health) {
        case 'On Track': return 'text-green-500';
        case 'At Risk': return 'text-amber-500';
        case 'Off Track': return 'text-red-500';
        default: return 'text-slate-400';
    }
};

const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return '?';
    if (parts.length > 1) {
        return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
    }
    return (parts[0]?.[0] || '?').toUpperCase();
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, teamMembers, isDragging, onDragStart, onDragEnd, onUpdateProject, onViewProjectDetail, onKeyDown, isLifted }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const taskProgress = useMemo(() => {
        if (!project.tasks || project.tasks.length === 0) return 0;
        const completed = project.tasks.filter(t => t.status === 'Done').length;
        return (completed / project.tasks.length) * 100;
    }, [project.tasks]);

    const manager = useMemo(() => teamMembers.find(tm => tm.id === project.managerId), [teamMembers, project.managerId]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleStatusChange = (newStatus: ProjectStatus) => {
        onUpdateProject({ ...project, status: newStatus });
        setIsMenuOpen(false);
    };

    const KANBAN_COLUMNS: ProjectStatus[] = ['Backlog', 'In Progress', 'Blocked', 'Done'];
    const availableStatuses = [...new Set([...KANBAN_COLUMNS, ...projectStatuses])];

    return (
        <div 
            id={`project-card-${project.id}`}
            data-project-id={project.id}
            tabIndex={0}
            draggable 
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onKeyDown={(e) => onKeyDown(e, project)}
            aria-roledescription={`Project card: ${project.name}`}
            className={`
                group relative p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 
                cursor-grab active:cursor-grabbing transition-all duration-200 ease-in-out 
                hover:shadow-md hover:border-premium-accent/30 dark:hover:border-premium-accent/30
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-premium-accent
                ${isDragging ? 'opacity-50 scale-95 shadow-none' : ''}
                ${isLifted ? 'ring-2 ring-offset-2 ring-premium-accent shadow-2xl scale-105 z-50' : ''}
            `}
        >
            {/* Header Badges */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full border ${getPriorityBadgeStyles(project.priority)}`}>
                        {project.priority}
                    </span>
                    <div className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getHealthColor(project.health)}`}></span>
                        {project.health}
                    </div>
                </div>
                <div className="relative">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(p => !p); }}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                     {isMenuOpen && (
                        <div 
                            ref={menuRef} 
                            className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl ring-1 ring-black/5 border border-gray-100 dark:border-zinc-800 z-50 p-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-right"
                        >
                            <button 
                                onClick={() => {onViewProjectDetail(project); setIsMenuOpen(false);}} 
                                className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-secondary-accent/10 hover:text-secondary-accent dark:hover:bg-secondary-accent/20 dark:hover:text-secondary-accent rounded-lg transition-colors"
                            >
                                View Details
                            </button>
                            <div className="my-1 h-px bg-gray-100 dark:bg-zinc-800"/>
                            <p className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Move to</p>
                            {availableStatuses.filter(s => s !== project.status).map(s => (
                                <button 
                                    key={s} 
                                    onClick={() => handleStatusChange(s)} 
                                    className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-secondary-accent/10 hover:text-secondary-accent dark:hover:bg-secondary-accent/20 dark:hover:text-secondary-accent rounded-lg transition-colors"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Title & Client */}
            <div className="mb-4">
                <h3 
                    onClick={() => onViewProjectDetail(project)}
                    className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight mb-1 hover:text-premium-accent transition-colors cursor-pointer"
                >
                    {project.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{project.clientName}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
                    <span className="font-medium">Progress</span>
                    <span className="font-mono">{taskProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-premium-accent h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${taskProgress}%`}}></div>
                </div>
            </div>

            {/* Footer Info */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    {project.dueDate && (
                        <div className="flex items-center gap-1" title={`Due: ${new Date(project.dueDate).toLocaleDateString()}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(project.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                    )}
                </div>

                {manager && (
                    <div className="flex -space-x-2 overflow-hidden pl-2">
                        <div title={`Manager: ${manager.name}`} className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 overflow-hidden">
                            {manager.profilePictureUrl ? <img src={manager.profilePictureUrl} alt={manager.name} className="w-full h-full object-cover" /> : getInitials(manager.name)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
