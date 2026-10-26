
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, TeamMember } from '../types';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { Checkbox } from './common/Checkbox';
import { MoreVertical, Edit, CornerDownRight, ArrowUpRight, PlusCircle, Trash, Trash2, Paperclip, Link2 } from 'lucide-react';

interface TaskItemProps {
    task: Task;
    level: number;
    projectTasks: Task[];
    onUpdateTask: (updatedTask: Task) => void;
    onDeleteTask: (taskId: string) => void;
    menuRef: React.RefObject<HTMLDivElement>;
    taskActionMenuOpen: string | null;
    setTaskActionMenuOpen: (id: string | null) => void;
    setIsReparentingTask: (task: Task | null) => void;
    /** People who can be assigned. Without it the assign / date row is hidden. */
    teamMembers?: TeamMember[];
}

/** The task's due day in the phone's own time zone (YYYY-MM-DD). */
const dayOf = (iso?: string) => {
    if (!iso) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const niceDue = (iso?: string) => (iso ? new Date(`${dayOf(iso)}T00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');

export const TaskItem: React.FC<TaskItemProps> = ({
    task, level, projectTasks, onUpdateTask, onDeleteTask, menuRef,
    taskActionMenuOpen, setTaskActionMenuOpen, setIsReparentingTask, teamMembers
}) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editingTitle, setEditingTitle] = useState(task.title);
    const [isAddingChecklistItem, setIsAddingChecklistItem] = useState(false);
    const [newChecklistItemTitle, setNewChecklistItemTitle] = useState('');

    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditingTitle) {
            titleInputRef.current?.focus();
        }
    }, [isEditingTitle]);

    const handleSaveTitle = () => {
        if (editingTitle.trim() && editingTitle.trim() !== task.title) {
            onUpdateTask({ ...task, title: editingTitle.trim() });
        }
        setIsEditingTitle(false);
    };

    const handleToggleChecklistItem = (itemIndex: number, checked: boolean) => {
        const newChecklist = [...(task.checklist || [])];
        newChecklist[itemIndex] = { ...newChecklist[itemIndex], done: checked };
        onUpdateTask({ ...task, checklist: newChecklist });
    };

    const handleAddChecklistItem = () => {
        if (newChecklistItemTitle.trim()) {
            const newItem = { id: `check-${Date.now()}`, title: newChecklistItemTitle.trim(), done: false };
            const newChecklist = [...(task.checklist || []), newItem];
            onUpdateTask({ ...task, checklist: newChecklist });
            setNewChecklistItemTitle('');
            setIsAddingChecklistItem(false);
        }
    };
    
    const checklistProgress = useMemo(() => {
        if (!task.checklist || task.checklist.length === 0) return 0;
        const completed = task.checklist.filter(item => item.done).length;
        return (completed / task.checklist.length) * 100;
    }, [task.checklist]);

    return (
        <div style={{ marginLeft: `${level * 24}px` }} className="bg-slate-50 dark:bg-slate-700/50 rounded-md p-3 group">
            <div className="flex items-center gap-2">
                <Checkbox
                    checked={task.status === 'Done'}
                    onChange={(e) => onUpdateTask({ ...task, status: e.target.checked ? 'Done' : 'To Do', completed: e.target.checked })}
                />
                {isEditingTitle ? (
                    <Input
                        ref={titleInputRef}
                        value={editingTitle}
                        onChange={e => setEditingTitle(e.target.value)}
                        onBlur={handleSaveTitle}
                        onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
                        className="!text-sm !p-1 flex-1"
                    />
                ) : (
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span onClick={() => setIsEditingTitle(true)} className={`text-sm font-medium cursor-pointer line-clamp-2 sm:line-clamp-1 break-words ${task.status === 'Done' ? 'line-through text-text-muted' : ''}`}>{task.title}</span>
                        {(task.attachmentCount ?? 0) > 0 && 
                            <span className="flex items-center gap-1 text-xs text-text-muted bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded-md" title={`${task.attachmentCount} file(s)`}>
                                <Paperclip size={12}/> {task.attachmentCount}
                            </span>
                        }
                        {(task.linkCount ?? 0) > 0 && 
                             <span className="flex items-center gap-1 text-xs text-text-muted bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded-md" title={`${task.linkCount} link(s)`}>
                                <Link2 size={12}/> {task.linkCount}
                            </span>
                        }
                    </div>
                )}
                 <div className="relative">
                    <Button variant="ghost" size="xs" className="p-2 sm:p-1 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100" aria-label="Task options" onClick={() => setTaskActionMenuOpen(taskActionMenuOpen === task.id ? null : task.id)}>
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                    {taskActionMenuOpen === task.id && (
                        <div 
                            ref={menuRef} 
                            className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl ring-1 ring-black/5 border border-gray-100 dark:border-zinc-800 z-50 p-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-right"
                        >
                            <button onClick={() => { setIsAddingChecklistItem(true); setTaskActionMenuOpen(null); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-secondary-accent/10 hover:text-secondary-accent dark:hover:bg-secondary-accent/20 dark:hover:text-secondary-accent rounded-lg transition-colors"><PlusCircle size={14}/> Add Checklist Item</button>
                            <button onClick={() => { setIsReparentingTask(task); setTaskActionMenuOpen(null); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-secondary-accent/10 hover:text-secondary-accent dark:hover:bg-secondary-accent/20 dark:hover:text-secondary-accent rounded-lg transition-colors"><CornerDownRight size={14}/> Make Sub-task</button>
                            {task.parentId && <button onClick={() => { onUpdateTask({ ...task, parentId: undefined }); setTaskActionMenuOpen(null); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-secondary-accent/10 hover:text-secondary-accent dark:hover:bg-secondary-accent/20 dark:hover:text-secondary-accent rounded-lg transition-colors"><ArrowUpRight size={14}/> Promote to Task</button>}
                            <div className="my-1 h-px bg-gray-100 dark:bg-zinc-800"/>
                            <button onClick={() => { onDeleteTask(task.id); setTaskActionMenuOpen(null); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash size={14}/> Delete Task</button>
                        </div>
                    )}
                 </div>
            </div>
            {teamMembers && (
                <div className="mt-2 pl-7 flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-2.5 pr-1 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <span aria-hidden="true">👤</span>
                        <span className="sr-only">Assigned to</span>
                        <select
                            value={task.assignedMemberId || ''}
                            onChange={(e) => {
                                const m = teamMembers.find((x) => x.id === e.target.value);
                                onUpdateTask({ ...task, assignedMemberId: m?.id, assigneeName: m?.name, updatedAt: new Date().toISOString() });
                            }}
                            className="bg-transparent border-0 py-1 pr-6 text-xs font-semibold focus:ring-0 max-w-[10rem]"
                        >
                            <option value="">Assign…</option>
                            {teamMembers.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </label>
                    <label className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        task.dueDate && task.status !== 'Done' && dayOf(task.dueDate) < dayOf(new Date().toISOString())
                            ? 'border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-300'
                            : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                        <span aria-hidden="true">📅</span>
                        <span className="sr-only">Due date</span>
                        <input
                            type="date"
                            value={dayOf(task.dueDate)}
                            onChange={(e) => onUpdateTask({ ...task, dueDate: e.target.value ? new Date(`${e.target.value}T00:00`).toISOString() : undefined, updatedAt: new Date().toISOString() })}
                            className="bg-transparent border-0 p-1 text-xs font-semibold focus:ring-0 w-[7.5rem]"
                            title={task.dueDate ? `Due ${niceDue(task.dueDate)}` : 'Set due date'}
                        />
                    </label>
                </div>
            )}
            {task.checklist && task.checklist.length > 0 && (
                <div className="pl-6 mt-2">
                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 my-2">
                        <div className="bg-status-positive h-1.5 rounded-full" style={{ width: `${checklistProgress}%` }}></div>
                    </div>
                    <ul className="space-y-1">
                        {task.checklist.map((item, index) => (
                            <li key={item.id} className="flex items-center gap-2 text-xs">
                                <Checkbox id={item.id} checked={item.done} onChange={e => handleToggleChecklistItem(index, e.target.checked)} />
                                <label htmlFor={item.id} className={`flex-1 ${item.done ? 'line-through text-text-muted' : ''}`}>{item.title}</label>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {isAddingChecklistItem && (
                 <div className="pl-6 mt-2 flex gap-2">
                     <Input
                        value={newChecklistItemTitle}
                        onChange={e => setNewChecklistItemTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem()}
                        placeholder="New item..."
                        className="!text-xs !py-1 flex-1"
                        autoFocus
                     />
                     <Button size="xs" onClick={handleAddChecklistItem}>Add</Button>
                     <Button size="xs" variant="ghost" onClick={() => setIsAddingChecklistItem(false)}>Cancel</Button>
                 </div>
            )}
        </div>
    );
};
