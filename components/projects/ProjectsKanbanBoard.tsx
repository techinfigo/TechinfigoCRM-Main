
import React, { useMemo, useState, DragEvent, KeyboardEvent } from 'react';
import { Project, TeamMember, ProjectStatus } from '../../types';
import { ProjectCard } from './ProjectCard';

interface ProjectsKanbanBoardProps {
    projects: Project[];
    teamMembers: TeamMember[];
    onUpdateProject: (project: Project) => void;
    onViewProjectDetail: (project: Project) => void;
}

const KANBAN_COLUMNS: ProjectStatus[] = ['Backlog', 'In Progress', 'Blocked', 'Done'];

export const ProjectsKanbanBoard: React.FC<ProjectsKanbanBoardProps> = ({ projects, teamMembers, onUpdateProject, onViewProjectDetail }) => {
    
    const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<ProjectStatus | null>(null);
    const [liftedProjectId, setLiftedProjectId] = useState<string | null>(null);
    const [announcement, setAnnouncement] = useState('');


    const projectsByStatus = useMemo(() => {
        const grouped = KANBAN_COLUMNS.reduce((acc, status) => {
            acc[status] = [];
            return acc;
        }, {} as Record<ProjectStatus, Project[]>);

        if (!Array.isArray(projects)) {
            console.error("Projects data is not an array:", projects);
            return grouped;
        }

        projects.forEach(p => {
            if (p.status === 'Review') {
                // Group 'Review' status under 'In Progress' for a cleaner board
                grouped['In Progress'].push(p);
            } else if (grouped[p.status]) {
                grouped[p.status].push(p);
            }
        });
        return grouped;
    }, [projects]);
    
    const handleDragStart = (e: DragEvent<HTMLDivElement>, project: Project) => {
        e.dataTransfer.setData('projectId', project.id);
        e.dataTransfer.effectAllowed = 'move';
        setDraggedProjectId(project.id);
    };

    const handleDragEnd = () => {
        setDraggedProjectId(null);
        setDragOverColumn(null);
    };
    
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (status: ProjectStatus) => {
        if (draggedProjectId) {
            setDragOverColumn(status);
        }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>, targetStatus: ProjectStatus) => {
        e.preventDefault();
        const projectId = e.dataTransfer.getData('projectId');
        const sourceProject = projects.find(p => p.id === projectId);
        
        if (sourceProject && sourceProject.status !== targetStatus) {
            // Special case for 'Review' which is visually under 'In Progress'
            const currentVisualStatus = sourceProject.status === 'Review' ? 'In Progress' : sourceProject.status;
            if(currentVisualStatus !== targetStatus) {
                onUpdateProject({ ...sourceProject, status: targetStatus, updatedAt: new Date().toISOString() });
                setAnnouncement(`${sourceProject.name} moved to ${targetStatus}.`);
            }
        }
        setDragOverColumn(null);
        setDraggedProjectId(null);
    };
    
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, project: Project) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setLiftedProjectId(prev => {
                const newLiftedId = prev === project.id ? null : project.id;
                setAnnouncement(newLiftedId ? `${project.name} lifted.` : `${project.name} dropped.`);
                return newLiftedId;
            });
        }

        if (liftedProjectId === project.id) {
            const currentStatus = project.status === 'Review' ? 'In Progress' : project.status;
            const currentStatusIndex = KANBAN_COLUMNS.indexOf(currentStatus);
            let nextStatusIndex = -1;

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextStatusIndex = currentStatusIndex + 1;
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                nextStatusIndex = currentStatusIndex - 1;
            }

            if (nextStatusIndex >= 0 && nextStatusIndex < KANBAN_COLUMNS.length) {
                const newStatus = KANBAN_COLUMNS[nextStatusIndex];
                onUpdateProject({ ...project, status: newStatus, updatedAt: new Date().toISOString() });
                setAnnouncement(`${project.name} moved to ${newStatus}.`);
            }
        }
    };

    return (
        <div className="flex-1 flex overflow-hidden -mx-2">
            <div aria-live="assertive" className="sr-only">{announcement}</div>
            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
                <div className="inline-flex h-full min-w-full p-2 space-x-4">
                    {KANBAN_COLUMNS.map(status => (
                        <div 
                            key={status} 
                            onDragOver={handleDragOver}
                            onDragEnter={() => handleDragEnter(status)}
                            onDrop={(e) => handleDrop(e, status)}
                            onDragLeave={() => setDragOverColumn(null)}
                            className={`flex-shrink-0 w-80 rounded-xl flex flex-col h-full bg-slate-100 dark:bg-slate-800/50 transition-colors duration-200 ${dragOverColumn === status ? 'bg-secondary-accent/10' : ''}`}
                            aria-label={`${status} column`}
                        >
                            <h3 className="text-sm font-semibold p-3 border-b border-black/5 dark:border-white/5 text-text-heading dark:text-text-base sticky top-0 bg-inherit rounded-t-lg z-10">
                                {status} <span className="text-text-muted font-normal">{projectsByStatus[status]?.length || 0}</span>
                            </h3>
                            <div className={`p-3 space-y-3 flex-grow overflow-y-auto scrollbar-hide border-2 border-dashed rounded-b-xl transition-colors duration-200 ${dragOverColumn === status ? 'border-secondary-accent' : 'border-transparent'}`}>
                                {projectsByStatus[status]?.map(project => (
                                    <ProjectCard 
                                        key={project.id} 
                                        project={project} 
                                        teamMembers={teamMembers} 
                                        onDragStart={(e) => handleDragStart(e, project)} 
                                        onDragEnd={handleDragEnd}
                                        isDragging={draggedProjectId === project.id}
                                        onUpdateProject={onUpdateProject}
                                        onViewProjectDetail={onViewProjectDetail}
                                        onKeyDown={handleKeyDown}
                                        isLifted={liftedProjectId === project.id}
                                    />
                                ))}
                                {projectsByStatus[status]?.length === 0 && (
                                    <div className="h-full flex items-center justify-center text-xs text-text-muted">Drop projects here</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
