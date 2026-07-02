
import { Task, TaskWorkflowStatus, TaskPriority, Project, TeamMember } from '../types';
import { isValid } from 'date-fns';
import parseISO from 'date-fns/parseISO';

interface FilterTasksArgs {
  tasks: (Task & { projectName?: string; clientName?: string; assigneeName?: string })[];
  filters: {
    searchTerm?: string;
    statusSet?: Set<TaskWorkflowStatus>;
    prioritySet?: Set<TaskPriority>;
    assigneeSet?: Set<string>;
    projectSet?: Set<string>;
    dueBucket?: 'All' | 'Overdue' | 'Today' | 'ThisWeek' | 'Later';
  };
}

export function filterTasks({ tasks, filters }: FilterTasksArgs): (Task & { projectName?: string; clientName?: string; assigneeName?: string })[] {
  if (!Array.isArray(tasks)) return [];

  const { searchTerm, statusSet, prioritySet, assigneeSet, projectSet, dueBucket } = filters;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);

  return tasks.filter(task => {
    // Search filter
    const lowerSearch = searchTerm?.toLowerCase();
    const searchMatch = !lowerSearch ||
      task.title.toLowerCase().includes(lowerSearch) ||
      task.projectName?.toLowerCase().includes(lowerSearch) ||
      task.clientName?.toLowerCase().includes(lowerSearch) ||
      task.assigneeName?.toLowerCase().includes(lowerSearch);
    if (!searchMatch) return false;

    // Set-based filters
    const statusMatch = !statusSet || statusSet.size === 0 || (task.status && statusSet.has(task.status));
    if (!statusMatch) return false;

    const priorityMatch = !prioritySet || prioritySet.size === 0 || (task.priority && prioritySet.has(task.priority));
    if (!priorityMatch) return false;

    const assigneeMatch = !assigneeSet || assigneeSet.size === 0 || (task.assignedMemberId && assigneeSet.has(task.assignedMemberId));
    if (!assigneeMatch) return false;

    const projectMatch = !projectSet || projectSet.size === 0 || (task.projectId && projectSet.has(task.projectId));
    if (!projectMatch) return false;

    // Due date bucket filter
    if (dueBucket && dueBucket !== 'All') {
      const dueDate = task.dueDate ? parseISO(task.dueDate) : null;
      if (!dueDate || !isValid(dueDate)) {
        return dueBucket === 'Later'; // No/invalid due date goes to 'Later'
      }
      
      const userTimezoneOffset = dueDate.getTimezoneOffset() * 60000;
      const normalizedDueDate = new Date(dueDate.getTime() + userTimezoneOffset);
      
      if (dueBucket === 'Overdue') return normalizedDueDate < today && task.status !== 'Done';
      if (dueBucket === 'Today') return normalizedDueDate.getTime() === today.getTime();
      if (dueBucket === 'ThisWeek') return normalizedDueDate >= today && normalizedDueDate < endOfWeek;
      if (dueBucket === 'Later') return normalizedDueDate >= endOfWeek;
    }
    
    return true;
  });
}


interface SortTasksArgs {
    tasks: (Task & { projectName?: string })[];
    key: 'dueDate' | 'priority' | 'updatedAt' | 'projectName';
    direction?: 'asc' | 'desc';
}

export function sortTasks({ tasks, key, direction = 'asc' }: SortTasksArgs): (Task & { projectName?: string })[] {
    const dir = direction === 'asc' ? 1 : -1;
    const priorityOrder: Record<TaskPriority, number> = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };

    return [...tasks].sort((a, b) => {
        switch (key) {
            case 'dueDate':
                const dateAValue = a.dueDate ? parseISO(a.dueDate).getTime() : Infinity;
                const dateBValue = b.dueDate ? parseISO(b.dueDate).getTime() : Infinity;
                const dateA = isValid(dateAValue) ? dateAValue : Infinity;
                const dateB = isValid(dateBValue) ? dateBValue : Infinity;
                return (dateA - dateB) * dir;
            case 'priority':
                const priorityA = priorityOrder[a.priority || 'Low'] ?? 4;
                const priorityB = priorityOrder[b.priority || 'Low'] ?? 4;
                return (priorityA - priorityB) * dir;
            case 'projectName':
                return (a.projectName || '').localeCompare(b.projectName || '') * dir;
            case 'updatedAt':
                const updatedAtAValue = a.updatedAt ? parseISO(a.updatedAt).getTime() : 0;
                const updatedAtBValue = b.updatedAt ? parseISO(b.updatedAt).getTime() : 0;
                const updatedAtA = isValid(updatedAtAValue) ? updatedAtAValue : 0;
                const updatedAtB = isValid(updatedAtBValue) ? updatedAtBValue : 0;
                return (updatedAtA - updatedAtB) * dir;
            default:
                return 0;
        }
    });
}

interface GroupedTasks {
    overdue: Task[];
    dueToday: Task[];
    thisWeek: Task[];
    later: Task[];
}

export function groupTasksByDeadline(tasks: Task[]): GroupedTasks {
    const groups: GroupedTasks = { overdue: [], dueToday: [], thisWeek: [], later: [] };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);

    tasks.filter(task => task.status !== 'Done').forEach(task => {
        if (!task.dueDate) {
            groups.later.push(task);
            return;
        }
        
        const dueDate = parseISO(task.dueDate);
        if (!isValid(dueDate)) {
            groups.later.push(task);
            return;
        }
        
        const userTimezoneOffset = dueDate.getTimezoneOffset() * 60000;
        const normalizedDueDate = new Date(dueDate.getTime() + userTimezoneOffset);

        if (normalizedDueDate < today) groups.overdue.push(task);
        else if (normalizedDueDate.getTime() === today.getTime()) groups.dueToday.push(task);
        else if (normalizedDueDate <= endOfWeek) groups.thisWeek.push(task);
        else groups.later.push(task);
    });

    return groups;
}

export function getAllTasks(projects: Project[], globalTasks: Task[], teamMembers: TeamMember[]): (Task & { projectName?: string; clientName?: string; assigneeName?: string })[] {
    if (!Array.isArray(projects)) return [];

    const projectTasks = projects.flatMap(p => 
        (p.tasks || []).map(t => ({
            ...t,
            projectName: p.name,
            clientName: p.clientName,
            projectId: p.id,
            assigneeName: teamMembers.find(m => m.id === t.assignedMemberId)?.name
        }))
    );
    
    const globals = globalTasks.map(t => ({
        ...t,
        projectName: 'Global',
        clientName: 'Internal',
        assigneeName: teamMembers.find(m => m.id === t.assignedMemberId)?.name
    }));
    
    return [...projectTasks, ...globals];
}
