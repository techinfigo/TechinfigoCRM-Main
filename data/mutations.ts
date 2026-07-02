import { Project, Task, TeamMember, ProjectStatus, Subtask, Comment, Activity, TaskWorkflowStatus } from '../types';

function getActorName(actorId: string, teamMembers: TeamMember[]): string {
    return teamMembers.find(tm => tm.id === actorId)?.name || 'System';
}

function diffToActivityMessage(patch: Partial<Task>, oldTask: Task, actorName: string, teamMembers: TeamMember[]): string | null {
    const changes: string[] = [];
    if (patch.status && patch.status !== oldTask.status) {
        changes.push(`changed status from "${oldTask.status}" to "${patch.status}"`);
    }
    if (patch.priority && patch.priority !== oldTask.priority) {
        changes.push(`updated priority to "${patch.priority}"`);
    }
    if (patch.title && patch.title !== oldTask.title) {
        changes.push(`renamed task to "${patch.title}"`);
    }
    if (patch.assignedMemberId && patch.assignedMemberId !== oldTask.assignedMemberId) {
        const oldAssignee = teamMembers.find(tm => tm.id === oldTask.assignedMemberId)?.name || 'Unassigned';
        const newAssignee = teamMembers.find(tm => tm.id === patch.assignedMemberId)?.name || 'Unassigned';
        changes.push(`reassigned task from ${oldAssignee} to ${newAssignee}`);
    }
     const oldDueDate = oldTask.dueDate ? oldTask.dueDate.split('T')[0] : '';
     const newDueDate = patch.dueDate ? patch.dueDate.split('T')[0] : '';
    if (patch.dueDate !== undefined && newDueDate !== oldDueDate) {
        changes.push(`changed due date from ${oldDueDate || 'none'} to ${newDueDate || 'none'}`);
    }


    if (changes.length === 0) return null;
    return `${actorName} ${changes.join(', ')}.`;
}

export const createMutations = ({ getProjects, getTasks, setProjects, setTasks, getTeamMembers }: {
    getProjects: () => Project[];
    getTasks: () => Task[];
    setProjects: (projects: Project[], action: any) => void;
    setTasks: (tasks: Task[], action: any) => void;
    getTeamMembers: () => TeamMember[];
}) => {

    const updateTask = (id: string, patchData: Partial<Task>, actorId: string) => {
        const projects = getProjects();
        const tasks = getTasks();
        const teamMembers = getTeamMembers();
        const actorName = getActorName(actorId, teamMembers);
        let taskFound = false;

        const sanitizedPatch = { ...patchData, updatedAt: new Date().toISOString() };
        if (sanitizedPatch.status === 'Done') {
            sanitizedPatch.completed = true;
        } else if (sanitizedPatch.status) {
            sanitizedPatch.completed = false;
        }

        const updatedProjects = projects.map(p => {
            const taskIndex = p.tasks.findIndex(t => t.id === id);
            if (taskIndex > -1) {
                taskFound = true;
                const oldTask = p.tasks[taskIndex];
                const newTask = { ...oldTask, ...sanitizedPatch };
                
                const activityMessage = diffToActivityMessage(patchData, oldTask, actorName, teamMembers);
                if (activityMessage) {
                    const newActivity: Activity = { id: `act-${Date.now()}`, type: 'edit', at: new Date().toISOString(), message: activityMessage };
                    newTask.activityLog = [newActivity, ...(newTask.activityLog || [])].slice(0, 200);
                }
                
                const updatedTasks = [...p.tasks];
                updatedTasks[taskIndex] = newTask;
                return { ...p, tasks: updatedTasks };
            }
            return p;
        });

        if (taskFound) {
            setProjects(updatedProjects, { type: 'batch', payload: {}, description: `Updated task` });
            return;
        }

        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex > -1) {
            const oldTask = tasks[taskIndex];
            const newTask = { ...oldTask, ...sanitizedPatch };

            const activityMessage = diffToActivityMessage(patchData, oldTask, actorName, teamMembers);
            if (activityMessage) {
                const newActivity: Activity = { id: `act-${Date.now()}`, type: 'edit', at: new Date().toISOString(), message: activityMessage };
                newTask.activityLog = [newActivity, ...(newTask.activityLog || [])].slice(0, 200);
            }

            const updatedTasks = [...tasks];
            updatedTasks[taskIndex] = newTask;
            setTasks(updatedTasks, { type: 'batch', payload: {}, description: `Updated task` });
        }
    };

    const createTask = (taskData: Partial<Task>, actorId: string) => {
        const teamMembers = getTeamMembers();
        const actorName = getActorName(actorId, teamMembers);
        const newTask: Task = {
            ...taskData,
            id: `task-${Date.now()}`,
            completed: false,
            status: taskData.status || 'To Do',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            activityLog: [{ id: `act-${Date.now()}`, type: 'creation', at: new Date().toISOString(), message: `${actorName} created the task.` }]
        } as Task;

        if (newTask.projectId) {
            const projects = getProjects();
            const projectIndex = projects.findIndex(p => p.id === newTask.projectId);
            if (projectIndex > -1) {
                const oldProject = projects[projectIndex];
                const updatedTasks = [...oldProject.tasks, newTask];
                const newProject = { ...oldProject, tasks: updatedTasks };
                const updatedProjects = [...projects];
                updatedProjects[projectIndex] = newProject;
                setProjects(updatedProjects, { type: 'update', payload: { old: oldProject, new: newProject }, description: `Created task "${newTask.title}"` });
            }
        } else {
            const tasks = getTasks();
            const updatedTasks = [...tasks, newTask];
            setTasks(updatedTasks, { type: 'create', payload: newTask, description: `Created task "${newTask.title}"` });
        }
    };

    const deleteTask = (taskId: string, actorId: string) => {
        const projects = getProjects();
        const tasks = getTasks();
        
        let taskToDelete: Task | undefined;
        let isProjectTask = false;

        for (const p of projects) {
            taskToDelete = p.tasks.find(t => t.id === taskId);
            if (taskToDelete) {
                isProjectTask = true;
                break;
            }
        }
        if (!taskToDelete) {
            taskToDelete = tasks.find(t => t.id === taskId);
        }
        if (!taskToDelete) return;
        
        if (isProjectTask && taskToDelete.projectId) {
            const projectIndex = projects.findIndex(p => p.id === taskToDelete!.projectId);
            if (projectIndex > -1) {
                const oldProject = projects[projectIndex];
                const newProject = { ...oldProject, tasks: oldProject.tasks.filter(t => t.id !== taskId) };
                const updatedProjects = [...projects];
                updatedProjects[projectIndex] = newProject;
                setProjects(updatedProjects, { type: 'update', payload: { old: oldProject, new: newProject }, description: `Deleted task "${taskToDelete.title}"` });
            }
        } else {
             setTasks(tasks.filter(t => t.id !== taskId), { type: 'delete', payload: taskToDelete, description: `Deleted task "${taskToDelete.title}"` });
        }
    };
    
    // FIX: Add missing deleteProject mutation function
    const deleteProject = (projectId: string, actorId: string) => {
        const projects = getProjects();
        const projectToDelete = projects.find(p => p.id === projectId);
        if (!projectToDelete) return;

        const updatedProjects = projects.filter(p => p.id !== projectId);
        setProjects(updatedProjects, { type: 'delete', payload: projectToDelete, description: `Deleted project "${projectToDelete.name}"` });
    };

    const toggleSubtask = (taskId: string, subId: string, actorId: string) => {
        const projects = getProjects();
        const tasks = getTasks();
        const teamMembers = getTeamMembers();
        const actorName = getActorName(actorId, teamMembers);
        let task: Task | undefined;

        for (const p of projects) {
            const foundTask = p.tasks.find(t => t.id === taskId);
            if (foundTask) {
                task = foundTask;
                break;
            }
        }
        if (!task) {
            task = tasks.find(t => t.id === taskId);
        }

        if (!task || !task.subtasks) return;

        const subtaskIndex = task.subtasks.findIndex(st => st.id === subId);
        if (subtaskIndex === -1) return;
        
        const oldSubtask = task.subtasks[subtaskIndex];
        const newSubtasks = [...task.subtasks];
        newSubtasks[subtaskIndex] = { ...oldSubtask, done: !oldSubtask.done, updatedAt: new Date().toISOString() };
        
        const activityMessage = `${actorName} marked subtask "${oldSubtask.title}" as ${!oldSubtask.done ? 'done' : 'not done'}.`;
        const newActivity: Activity = { id: `act-${Date.now()}`, type: 'subtask_toggle', at: new Date().toISOString(), message: activityMessage };
        
        const patchData: Partial<Task> = {
            subtasks: newSubtasks,
            activityLog: [newActivity, ...(task.activityLog || [])].slice(0, 200)
        };
        
        updateTask(taskId, patchData, actorId);
    };
    
    const addComment = (taskId: string, text: string, actorId: string) => {
        const teamMembers = getTeamMembers();
        const actorName = getActorName(actorId, teamMembers);
        
        const newComment: Comment = {
            id: `comm-${Date.now()}`,
            author: actorName,
            text: text,
            createdAt: new Date().toISOString(),
        };
        
        const task = [...getProjects().flatMap(p => p.tasks), ...getTasks()].find(t => t.id === taskId);
        if (!task) return;
        
        const newComments = [newComment, ...(task.comments || [])];
        const newActivity: Activity = { id: `act-${Date.now()}`, type: 'comment', at: new Date().toISOString(), message: `${actorName} added a comment.` };
        
        const patchData: Partial<Task> = {
            comments: newComments,
            commentCount: newComments.length,
            activityLog: [newActivity, ...(task.activityLog || [])].slice(0, 200)
        };
        
        updateTask(taskId, patchData, actorId);
    };

    const moveProject = (projectId: string, status: ProjectStatus, actorId: string) => {
        updateProject(projectId, { status }, actorId);
    };
    
    const updateProject = (projectId: string, patchData: Partial<Project>, actorId: string) => {
        const projects = getProjects();
        const projectIndex = projects.findIndex(p => p.id === projectId);
        if (projectIndex === -1) return;
        
        const oldProject = projects[projectIndex];
        const newProject = { ...oldProject, ...patchData, updatedAt: new Date().toISOString() };
        
        // Could add to a global activity log here
        
        const updatedProjects = [...projects];
        updatedProjects[projectIndex] = newProject;
        setProjects(updatedProjects, { type: 'update', payload: { old: oldProject, new: newProject }, description: `Update Project "${newProject.name}"` });
    };

    return {
        updateTask,
        createTask,
        deleteTask,
        deleteProject,
        toggleSubtask,
        addComment,
        moveProject,
        updateProject,
    };
};