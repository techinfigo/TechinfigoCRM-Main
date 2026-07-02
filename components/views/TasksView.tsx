
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Task, TeamMember, Project, TaskPriority, TaskWorkflowStatus, View, taskPriorities, taskWorkflowStatuses, ToastData, TaskReminderPrefs, SavedTaskView } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { EmptyStatePlaceholder } from '../partials/EmptyStatePlaceholder';
import { Checkbox } from '../common/Checkbox';
import { 
    ClipboardList, Plus, AlertTriangle, MoreVertical, Edit, Trash2, Edit2, Save,
    MessageSquare, Paperclip, CheckCircle, Eye, Search, Filter, ChevronDown, Folder, User, Users, X, Clock, Check, Bell, BellOff, Briefcase
} from 'lucide-react';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { DateRangePicker, DateRange } from '../common/DateRangePicker';
import { isDateInRange } from '@/utils';
import * as tasksSelectors from '@/selectors/tasksSelectors';
import { InlineErrorBanner } from '@/components/common/InlineErrorBanner';

// --- TYPE DEFINITIONS ---
interface TasksViewProps {
  tasks: (Task & { projectName?: string, clientName?: string, assigneeName?: string })[];
  teamMembers: TeamMember[];
  projects: Project[];
  currentUser: TeamMember;
  onAddTask: () => void;
  onSelectTask: (task: Task) => void;
  onMarkTaskAsDone: (taskId: string, projectId?: string) => void;
  setCurrentView: (view: View) => void;
  showToast: (options: ToastData) => void;
  onUpdateTaskFields: (taskId: string, updates: Partial<Task>) => void;
  globalSnoozeUntil: string | null;
  savedViews: SavedTaskView[];
  onUpdateSavedViews: (views: SavedTaskView[]) => void;
}

interface TaskFilters {
    status: Set<TaskWorkflowStatus>;
    priority: Set<TaskPriority>;
    projectId: Set<string>;
    assigneeId: Set<string>;
    due: 'All' | 'Overdue' | 'Today' | 'ThisWeek' | 'Later';
}

type SortKey = 'dueDate' | 'priority' | 'projectName' | 'updatedAt';

const formatDateSafe = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return isNaN(adjustedDate.getTime()) ? 'Invalid Date' : adjustedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// --- SUB-COMPONENTS ---
interface TaskRowProps {
    task: Task & { projectName?: string, clientName?: string, assigneeName?: string };
    onSelectTask: (task: Task) => void;
    onToggleCompletion: (taskId: string, projectId?: string) => void;
    onUpdateTaskFields: (taskId: string, updates: Partial<Task>) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, onSelectTask, onToggleCompletion, onUpdateTaskFields }) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
    const [isReminderPopoverOpen, setIsReminderPopoverOpen] = useState(false);
    const reminderRef = useRef<HTMLDivElement>(null);
    const bellButtonRef = useRef<HTMLButtonElement>(null);
    const bellButtonId = `reminder-btn-${task.id}`;


    useEffect(() => {
        if (!isReminderPopoverOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (reminderRef.current && !reminderRef.current.contains(event.target as Node)) {
                setIsReminderPopoverOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsReminderPopoverOpen(false);
                bellButtonRef.current?.focus();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isReminderPopoverOpen]);
    
    const handleReminderChange = (leadTime: TaskReminderPrefs['leadTime']) => {
        onUpdateTaskFields(task.id, {
            reminderPrefs: {
                ...(task.reminderPrefs || { enabled: false, leadTime: null }),
                enabled: leadTime !== null && leadTime !== 'None',
                leadTime: leadTime,
            }
        });
        setIsReminderPopoverOpen(false);
    };

    return (
        <div className="group flex items-start gap-2.5 p-3 bg-bg-base dark:bg-bg-muted rounded-lg shadow-sm border border-border-base dark:border-border-muted hover:border-premium-accent/30 transition-colors">
            <div className="pt-0.5">
                 <Checkbox 
                    checked={task.status === 'Done'} 
                    onChange={(e) => {
                        e.stopPropagation();
                        onToggleCompletion(task.id, task.projectId);
                    }}
                />
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectTask(task)}>
                <h4 className="font-semibold text-text-heading dark:text-text-heading truncate hover:underline text-sm" title={task.title}>{task.title}</h4>
                 <div className="mt-1.5 flex items-center gap-x-3 gap-y-1 text-xs text-text-muted flex-wrap">
                    {task.clientName && (
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                             <Briefcase size={12} className="text-premium-accent"/>
                             {task.clientName}
                        </span>
                    )}
                    <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">&bull;</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700">{task.projectName || 'Global'}</span>
                    
                    {task.assigneeName && (
                        <>
                             <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">&bull;</span>
                             <span className="flex items-center gap-1">
                                <User size={12} /> {task.assigneeName}
                             </span>
                        </>
                    )}
                    
                    {task.dueDate && <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">&bull;</span>}
                    {task.dueDate && <span className={isOverdue ? 'font-semibold text-status-negative' : ''}>{formatDateSafe(task.dueDate)}</span>}
                </div>
            </div>
             <div className="flex-shrink-0 flex items-center gap-1 self-center">
                 <div className="relative">
                    <Button
                        ref={bellButtonRef}
                        id={bellButtonId}
                        variant="ghost"
                        size="xs"
                        className="!p-1.5"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsReminderPopoverOpen(p => !p);
                        }}
                        aria-label={`Set reminder for ${task.title}`}
                        aria-haspopup="menu" // Use menu role for popover
                        aria-expanded={isReminderPopoverOpen}
                        aria-pressed={!!(task.reminderPrefs?.enabled && task.reminderPrefs.leadTime !== 'None')}
                    >
                        {task.reminderPrefs?.enabled && task.reminderPrefs.leadTime !== 'None' ? (
                            <Bell size={14} className="text-blue-500" />
                        ) : (
                            <BellOff size={14} className="text-slate-400" />
                        )}
                    </Button>
                    {isReminderPopoverOpen && (
                        <div
                            ref={reminderRef}
                            role="menu"
                            aria-orientation="vertical"
                            aria-labelledby={bellButtonId}
                            className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5"
                        >
                            {(['None', '30m', '2h', '1d'] as const).map(time => (
                                <button
                                    key={time}
                                    role="menuitem"
                                    onClick={(e) => { e.stopPropagation(); handleReminderChange(time); }}
                                    className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-secondary-accent/10 hover:text-secondary-accent dark:hover:bg-secondary-accent/20 dark:hover:text-secondary-accent rounded-lg transition-colors"
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                 <Button variant="ghost" size="xs" className="!p-1.5" title="Log time"><Clock size={14} /></Button>
            </div>
        </div>
    )
};


interface TaskSectionProps {
    title: string;
    tasks: (Task & { projectName?: string, clientName?: string, assigneeName?: string })[];
    onSelectTask: (task: Task) => void;
    onMarkTaskAsDone: (taskId: string, projectId?: string) => void;
    onUpdateTaskFields: (taskId: string, updates: Partial<Task>) => void;
}

const TaskSection: React.FC<TaskSectionProps> = ({ title, tasks, onSelectTask, onMarkTaskAsDone, onUpdateTaskFields }) => (
    <section aria-labelledby={`section-header-${title}`}>
        <h3 id={`section-header-${title}`} className="text-sm font-semibold text-text-muted dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center">
            {title}
            <span className="ml-2 text-xs font-normal bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-md">{tasks.length}</span>
        </h3>
        <div className="space-y-2">
            {tasks.map(task => (
                <TaskRow key={task.id} task={task} onSelectTask={onSelectTask} onToggleCompletion={onMarkTaskAsDone} onUpdateTaskFields={onUpdateTaskFields} />
            ))}
        </div>
    </section>
);


// --- MAIN VIEW COMPONENT ---
export const TasksView: React.FC<TasksViewProps> = (props) => {
    const { tasks, projects, teamMembers, currentUser, onAddTask, onSelectTask, onMarkTaskAsDone, setCurrentView, showToast, onUpdateTaskFields, globalSnoozeUntil, savedViews, onUpdateSavedViews } = props;
    
    // --- STATE MANAGEMENT ---
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | null>(null);
    const [viewMode, setViewMode] = useState<'my' | 'team'>('my');
    const [filters, setFilters] = useState<TaskFilters>({ status: new Set(), priority: new Set(), projectId: new Set(), assigneeId: new Set(), due: 'All' });
    const [sort, setSort] = useState<{ key: SortKey, direction: 'asc' | 'desc' }>({ key: 'dueDate', direction: 'asc' });
    const [reminderError, setReminderError] = useState<string | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);

    const [activeViewId, setActiveViewId] = useState<string | null>(null);
    const [isViewsDropdownOpen, setIsViewsDropdownOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [newViewName, setNewViewName] = useState('');
    const [viewToRename, setViewToRename] = useState<SavedTaskView | null>(null);

    const viewsDropdownRef = useRef<HTMLDivElement>(null);

    const getCurrentParams = (): SavedTaskView['params'] => ({
        searchTerm,
        filters: {
            status: Array.from(filters.status),
            priority: Array.from(filters.priority),
            projectId: Array.from(filters.projectId),
            assigneeId: Array.from(filters.assigneeId),
            due: filters.due,
        },
        sort,
        viewMode
    });
    
    const handleSaveView = () => {
        if (!newViewName.trim()) { alert("View name cannot be empty."); return; }
        if (savedViews.some(v => v.name.toLowerCase() === newViewName.trim().toLowerCase() && v.id !== viewToRename?.id)) {
            alert("A view with this name already exists."); return;
        }

        if (viewToRename) { // Rename logic
            onUpdateSavedViews(savedViews.map(v => v.id === viewToRename.id ? { ...v, name: newViewName.trim() } : v));
        } else { // Save new or update logic
            const currentParams = getCurrentParams();
            const existingView = activeViewId ? savedViews.find(v => v.id === activeViewId) : null;
            if (existingView) { // Update existing view
                onUpdateSavedViews(savedViews.map(v => v.id === activeViewId ? { ...v, params: currentParams } : v));
            } else { // Save as new view
                const newView: SavedTaskView = { id: `view-${Date.now()}`, name: newViewName.trim(), params: currentParams };
                onUpdateSavedViews([...savedViews, newView]);
                setActiveViewId(newView.id);
            }
        }
        setIsSaveModalOpen(false);
        setViewToRename(null);
        setNewViewName('');
    };

    const handleDeleteView = (viewId: string) => {
        if (window.confirm("Are you sure you want to delete this view?")) {
            onUpdateSavedViews(savedViews.filter(v => v.id !== viewId));
            if (activeViewId === viewId) setActiveViewId(null);
        }
    };

    const applyView = (view: SavedTaskView) => {
        setSearchTerm(view.params.searchTerm);
        setFilters({
            status: new Set(view.params.filters.status),
            priority: new Set(view.params.filters.priority),
            projectId: new Set(view.params.filters.projectId),
            assigneeId: new Set(view.params.filters.assigneeId),
            due: view.params.filters.due,
        });
        setSort(view.params.sort);
        setViewMode(view.params.viewMode);
        setActiveViewId(view.id);
        setIsViewsDropdownOpen(false);
    };

    // --- FILTERING & SORTING LOGIC ---
    const filteredAndSortedTasks = useMemo(() => {
        const filtered = tasksSelectors.filterTasks({
            tasks: tasks,
            filters: {
                searchTerm,
                statusSet: filters.status,
                prioritySet: filters.priority,
                projectSet: filters.projectId,
                assigneeSet: viewMode === 'my' ? new Set([currentUser.id]) : filters.assigneeId,
                dueBucket: filters.due,
            }
        }).filter(task => isDateInRange(task.dueDate, dateRange));

        return tasksSelectors.sortTasks({
            tasks: filtered,
            key: sort.key,
            direction: sort.direction
        });
    }, [tasks, searchTerm, filters, sort, viewMode, currentUser.id]);

    const groupedTasks = useMemo(() => {
        return tasksSelectors.groupTasksByDeadline(filteredAndSortedTasks);
    }, [filteredAndSortedTasks]);

    const isFiltered = searchTerm.trim() !== '' || filters.status.size > 0 || filters.priority.size > 0 || filters.projectId.size > 0 || filters.assigneeId.size > 0 || filters.due !== 'All';

    const handleRetry = () => {
        setIsRetrying(true);
        // Simulate refetch
        setTimeout(() => {
            console.log("Retrying data fetch for tasks...");
            setIsRetrying(false);
            showToast({ title: "Refreshed", description: "Task data has been refreshed." });
        }, 1000);
    };


    return (
        <>
            {reminderError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md relative mb-4 flex justify-between items-center shadow-lg" role="alert">
                    <div>
                        <p className="font-bold">Reminder Engine Alert</p>
                        <p className="text-sm">{reminderError}</p>
                    </div>
                    <button onClick={() => setReminderError(null)} className="p-1 rounded-full hover:bg-red-200" aria-label="Dismiss">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}
            <Card 
                title="Tasks" 
                actions={
                    <div className="flex items-center gap-2">
                        <div ref={viewsDropdownRef} className="relative">
                            <Button variant="outline" onClick={() => setIsViewsDropdownOpen(p => !p)} rightIcon={<ChevronDown size={16}/>}>
                                {activeViewId ? savedViews.find(v => v.id === activeViewId)?.name : 'Unsaved View'}
                            </Button>
                            {isViewsDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 z-50 animate-in fade-in zoom-in-95 duration-200 p-1.5 origin-top-right ring-1 ring-black/5">
                                    {savedViews.map(view => (
                                        <div key={view.id} className="group flex items-center justify-between px-2 py-1 hover:bg-secondary-accent/10 hover:text-secondary-accent dark:hover:bg-secondary-accent/20 dark:hover:text-secondary-accent rounded-lg transition-colors">
                                            <button onClick={() => applyView(view)} className="flex-1 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{view.name}</button>
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="xs" className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" onClick={() => { setViewToRename(view); setNewViewName(view.name); setIsSaveModalOpen(true); setIsViewsDropdownOpen(false); }}><Edit2 size={14}/></Button>
                                                <Button variant="ghost" size="xs" className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDeleteView(view.id)}><Trash2 size={14}/></Button>
                                            </div>
                                        </div>
                                    ))}
                                    {savedViews.length === 0 && <p className="text-xs text-center text-gray-500 dark:text-gray-400 p-2">No saved views.</p>}
                                </div>
                            )}
                        </div>
                        <Button variant="secondary" onClick={() => setIsSaveModalOpen(true)} leftIcon={<Save size={16}/>}>
                            {activeViewId ? 'Update View' : 'Save View'}
                        </Button>
                        <Button variant="primary" onClick={onAddTask} leftIcon={<Plus />}>Add Task</Button>
                    </div>
                }
            >
                {/* Filters */}
                <div className="p-3 border-y border-border-base dark:border-slate-700 bg-slate-50 dark:bg-slate-800/20 mb-4 space-y-3">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1">
                            <Input type="search" placeholder="Search tasks by title, client, project..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} leftIcon={<Search size={16} />}/>
                        </div>
                        <DateRangePicker onApply={setDateRange} initialRange={dateRange || undefined} />
                    </div>
                    {/* Add more filter controls here if needed */}
                </div>
                <div className="space-y-6">
                    {tasks.length === 0 && !isFiltered ? (
                        <InlineErrorBanner
                            title="No Tasks Available"
                            message="There are currently no tasks in your workspace. Add a new task to get started."
                            onRetry={handleRetry}
                        />
                    ) : Object.values(groupedTasks).every(arr => (arr as any[]).length === 0) ? (
                        <EmptyStatePlaceholder
                            icon={<ClipboardList className="w-16 h-16"/>}
                            title="No Matching Tasks"
                            message="No tasks match your current filters. Try adjusting your search."
                        />
                    ) : (
                        [
                            { title: 'Overdue', tasks: groupedTasks.overdue },
                            { title: 'Due Today', tasks: groupedTasks.dueToday },
                            { title: 'This Week', tasks: groupedTasks.thisWeek },
                            { title: 'Later', tasks: groupedTasks.later },
                        ].filter(group => group.tasks.length > 0).map(group => <TaskSection key={group.title} {...group} onSelectTask={onSelectTask} onMarkTaskAsDone={onMarkTaskAsDone} onUpdateTaskFields={onUpdateTaskFields}/>)
                    )}
                </div>
            </Card>

            {isSaveModalOpen && (
                <Modal 
                    isOpen={true} 
                    onClose={() => {setIsSaveModalOpen(false); setViewToRename(null);}}
                    title={viewToRename ? 'Rename View' : (activeViewId ? 'Update View' : 'Save New View')}
                    size="md"
                    footer={<><Button variant="secondary" onClick={() => {setIsSaveModalOpen(false); setViewToRename(null);}}>Cancel</Button><Button onClick={handleSaveView}>Save</Button></>}
                >
                    {!viewToRename && activeViewId ? 
                        <p>This will update the current view with your new filter and sort settings. Are you sure?</p> :
                        <Input label="View Name" value={newViewName} onChange={e => setNewViewName(e.target.value)} placeholder="e.g., Q3 Marketing Tasks" autoFocus />
                    }
                </Modal>
            )}
        </>
    );
};
