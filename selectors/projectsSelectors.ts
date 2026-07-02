
import { Project, Task, TeamMember, ProjectStatus, ProjectHealth, ProjectPriority } from '../types';

// From ProjectsView.tsx
interface FilterProjectsArgs {
  projects: Project[];
  filters: {
    searchTerm?: string;
    clientId?: string;
  };
}

export function filterProjects({ projects, filters }: FilterProjectsArgs): Project[] {
    if (!Array.isArray(projects)) return [];
    
    let result = projects;
    
    if (filters.clientId) {
      result = result.filter(p => p.clientId === filters.clientId);
    }
    
    if (filters.searchTerm) {
      const lowerSearch = filters.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(lowerSearch) ||
        p.clientName.toLowerCase().includes(lowerSearch) ||
        p.tags?.some(t => t.toLowerCase().includes(lowerSearch))
      );
    }
    
    return result;
}


// From ProjectsReportsTab.tsx
export interface ProjectMetrics {
    totalProjects: number;
    statusCounts: Partial<Record<ProjectStatus, number>>;
    priorityCounts: Partial<Record<ProjectPriority, number>>;
    healthCounts: Partial<Record<ProjectHealth, number>>;
    taskSummary: {
        completed: number;
        pending: number;
    };
    overdueTasks: (Task & { projectName: string; assigneeName: string })[];
    recentlyUpdated: Project[];
}

export function calculateProjectMetrics(projects: Project[], teamMembers: TeamMember[]): ProjectMetrics {
    if (!Array.isArray(projects)) {
        return {
            totalProjects: 0,
            statusCounts: {}, priorityCounts: {}, healthCounts: {},
            taskSummary: { completed: 0, pending: 0 },
            overdueTasks: [], recentlyUpdated: []
        };
    }

    const statusCounts: Partial<Record<ProjectStatus, number>> = {};
    const priorityCounts: Partial<Record<ProjectPriority, number>> = {};
    const healthCounts: Partial<Record<ProjectHealth, number>> = {};
    let totalTasks = 0, completedTasks = 0;

    projects.forEach(p => {
        if (p.status) statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
        if (p.priority) priorityCounts[p.priority] = (priorityCounts[p.priority] || 0) + 1;
        if (p.health) healthCounts[p.health] = (healthCounts[p.health] || 0) + 1;
        if(Array.isArray(p.tasks)) {
            totalTasks += p.tasks.length;
            completedTasks += p.tasks.filter(t => t.status === 'Done').length;
        }
    });
    
    const overdueTasks = projects.flatMap(p =>
        (p.tasks || [])
         .filter(t => t.status !== 'Done' && t.dueDate && new Date(t.dueDate) < new Date())
         .map(t => ({
             ...t, 
             projectName: p.name, 
             assigneeName: teamMembers.find(tm => tm.id === t.assignedMemberId)?.name || 'Unassigned' 
        }))
    ).sort((a,b) => (new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()));
    
    const recentlyUpdated = [...projects]
        .sort((a,b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 15);

    return {
        totalProjects: projects.length,
        statusCounts, priorityCounts, healthCounts,
        taskSummary: { completed: completedTasks, pending: totalTasks - completedTasks },
        overdueTasks, recentlyUpdated
    };
}
