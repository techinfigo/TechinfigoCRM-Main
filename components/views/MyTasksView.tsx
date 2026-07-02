
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Project, Task, TeamMember, TaskPriority, TaskWorkflowStatus, View, TimeLog } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';
import { EmptyStatePlaceholder } from '../partials/EmptyStatePlaceholder';
import { DateRangePicker, DateRange } from '../common/DateRangePicker';
import { isDateInRange } from '@/utils';
import { ListTodo, Filter, Check, Clock, ChevronDown, Briefcase } from 'lucide-react';

interface MyTasksViewProps {
  projects: Project[];
  teamMembers: TeamMember[];
  currentUser: TeamMember | null;
  onMarkTaskAsDone: (taskId: string, projectId: string) => void;
  onOpenTimeLogModal: (log: TimeLog | null, defaults?: { projectId?: string, taskId?: string }) => void;
  onOpenTaskModal: () => void;
  onOpenProjectDetailModal: (project: Project) => void;
  setCurrentView: (view: View) => void;
}

type StatusFilter = 'All' | 'Pending' | TaskWorkflowStatus;
type PriorityFilter = 'All' | TaskPriority;
type DueFilter = 'All' | 'Overdue' | 'Today' | 'This Week';
type SortKey = 'dueDate' | 'priority' | 'projectName' | 'updatedAt';

const getPriorityClasses = (priority?: TaskPriority) => ({
    'High': 'border-l-red-500 bg-red-50/50 dark:bg-red-900/20',
    'Medium': 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/20',
    'Low': 'border-l-sky-500 bg-sky-50/50 dark:bg-sky-900/20',
}[priority || 'Low'] || 'border-l-slate-400 bg-slate-50/50 dark:bg-slate-700/20');

const getStatusBadgeClasses = (status: TaskWorkflowStatus) => ({
    'ToDo': 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200',
    'InProgress': 'bg-blue-200 text-blue-800 dark:bg-blue-700/40 dark:text-blue-200',
    'Review': 'bg-purple-200 text-purple-800 dark:bg-purple-700/40 dark:text-purple-200',
    'Done': 'bg-green-200 text-green-800 dark:bg-green-700/40 dark:text-green-200',
}[status]);

const TaskItem: React.FC<{
    task: Task & { projectName: string; clientName?: string; projectId: string; updatedAt?: string };
    onMarkDone: () => void;
    onViewProject: () => void;
    onLogTime: () => void;
}> = ({ task, onMarkDone, onViewProject, onLogTime }) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
    return (
        <div className={`p-3 rounded-lg border-l-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${getPriorityClasses(task.priority)}`}>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-heading dark:text-text-heading">{task.title}</p>
                <div className="flex items-center gap-2 text-xs text-text-muted mt-1 flex-wrap">
                    {task.clientName && (
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                             <Briefcase size={12} className="text-premium-accent"/>
                             {task.clientName}
                        </span>
                    )}
                    {task.clientName && <span>&bull;</span>}
                    <button onClick={onViewProject} className="hover:underline">{task.projectName}</button>
                    <span>&bull;</span>
                    <span className={`px-1.5 py-0.5 rounded ${getStatusBadgeClasses(task.status)}`}>{task.status}</span>
                    {task.dueDate && <span>&bull;</span>}
                    {task.dueDate && (
                        <span className={isOverdue ? 'text-red-500 font-semibold' : ''}>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                            {isOverdue && <span className="ml-1.5 px-1.5 py-0.5 text-xxs rounded bg-red-500 text-white">OVERDUE</span>}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 self-end sm:self-center">
                <Button 
                    variant="ghost" 
                    size="xs" 
                    className="!p-1.5" 
                    title="Log Time for this task" 
                    onClick={(e) => {
                        e.stopPropagation();
                        onLogTime();
                    }}
                >
                    <Clock size={14} />
                </Button>
                <Button variant="secondary" size="xs" onClick={onMarkDone} leftIcon={<Check size={14} />}>Done</Button>
            </div>
        </div>
    );
};

export const MyTasksView: React.FC<MyTasksViewProps> = (props) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | null>(null);
    const [filters, setFilters] = useState({ status: 'Pending' as StatusFilter, priority: 'All' as PriorityFilter, due: 'All' as DueFilter });
    const [sort, setSort] = useState<SortKey>('dueDate');

    const myTasks = useMemo(() => {
        if (!props.currentUser || !Array.isArray(props.projects)) return [];
        return props.projects.flatMap(p => 
            (p.tasks || [])
             .filter(t => t.assignedMemberId === props.currentUser?.id)
             .map(t => ({ 
                 ...t, 
                 projectName: p.name, 
                 clientName: p.clientName, // Add client name
                 projectId: p.id, 
                 updatedAt: p.updatedAt 
            }))
        );
    }, [props.projects, props.currentUser]);

    const filteredAndSortedTasks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + 7);

        let filtered = myTasks.filter(task => {
            const searchMatch = !searchTerm || 
                task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                task.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
                
            const statusMatch = filters.status === 'All' || (filters.status === 'Pending' ? task.status !== 'Done' : task.status === filters.status);
            const priorityMatch = filters.priority === 'All' || task.priority === filters.priority;
            const dueMatch = filters.due === 'All' || !task.dueDate ||
                (filters.due === 'Overdue' && new Date(task.dueDate) < today && task.status !== 'Done') ||
                (filters.due === 'Today' && new Date(task.dueDate).getTime() === today.getTime()) ||
                (filters.due === 'This Week' && new Date(task.dueDate) >= today && new Date(task.dueDate) < endOfWeek);

            const rangeMatch = isDateInRange(task.dueDate, dateRange);

            return searchMatch && statusMatch && priorityMatch && dueMatch && rangeMatch;
        });
        
        return filtered.sort((a, b) => {
            const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3, 'Critical': 0 };
            switch (sort) {
                case 'dueDate': return (new Date(a.dueDate || '9999').getTime()) - (new Date(b.dueDate || '9999').getTime());
                case 'priority': return (priorityOrder[a.priority || 'Low'] ?? 4) - (priorityOrder[b.priority || 'Low'] ?? 4);
                case 'projectName': return a.projectName.localeCompare(b.projectName);
                case 'updatedAt': return (new Date(b.updatedAt || 0).getTime()) - (new Date(a.updatedAt || 0).getTime());
                default: return 0;
            }
        });
    }, [myTasks, searchTerm, filters, sort]);

    const { paginatedData, ...paginationProps } = usePagination({ data: filteredAndSortedTasks });

    const handleFilterChange = (filter: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [filter]: value }));
    };

    return (
        <Card title="My Tasks" actions={<Button variant="primary" onClick={props.onOpenTaskModal}>+ Add Task</Button>}>
            <div className="p-3 border-y border-border-base dark:border-slate-700 bg-slate-50 dark:bg-slate-800/20 mb-4 space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                        <Input type="search" placeholder="Search tasks, clients, projects..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <DateRangePicker onApply={setDateRange} initialRange={dateRange || undefined} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="w-full p-2 bg-bg-base dark:bg-slate-800 border border-border-base rounded-lg text-sm">
                        <option value="All">All Statuses</option><option value="Pending">Pending</option><option value="ToDo">To Do</option><option value="InProgress">In Progress</option><option value="Review">Review</option><option value="Done">Done</option>
                    </select>
                    <select value={filters.priority} onChange={e => handleFilterChange('priority', e.target.value)} className="w-full p-2 bg-bg-base dark:bg-slate-800 border border-border-base rounded-lg text-sm">
                        <option value="All">All Priorities</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
                    </select>
                    <select value={filters.due} onChange={e => handleFilterChange('due', e.target.value)} className="w-full p-2 bg-bg-base dark:bg-slate-800 border border-border-base rounded-lg text-sm">
                        <option value="All">All Due Dates</option><option value="Overdue">Overdue</option><option value="Today">Today</option><option value="This Week">This Week</option>
                    </select>
                    <select value={sort} onChange={e => setSort(e.target.value as SortKey)} className="w-full p-2 bg-bg-base dark:bg-slate-800 border border-border-base rounded-lg text-sm">
                        <option value="dueDate">Sort by Due Date</option><option value="priority">Sort by Priority</option><option value="projectName">Sort by Project</option><option value="updatedAt">Sort by Update</option>
                    </select>
                </div>
            </div>
            {paginatedData.length > 0 ? (
                <div className="space-y-3">
                    {paginatedData.map(task => (
                        <TaskItem 
                            key={task.id} 
                            task={task} 
                            onMarkDone={() => props.onMarkTaskAsDone(task.id, task.projectId)}
                            onLogTime={() => props.onOpenTimeLogModal(null, { projectId: task.projectId, taskId: task.id })}
                            onViewProject={() => {
                                const project = props.projects.find(p => p.id === task.projectId);
                                if (project) props.onOpenProjectDetailModal(project);
                            }}
                        />
                    ))}
                    <Pagination {...paginationProps} />
                </div>
            ) : (
                <EmptyStatePlaceholder 
                    icon={<ListTodo className="w-16 h-16"/>}
                    title="No Tasks Found"
                    message="You have no tasks that match the current filters. Great job, or time to add some!"
                />
            )}
        </Card>
    );
};
