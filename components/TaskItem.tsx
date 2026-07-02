
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task } from '../types';
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
}

export const TaskItem: React.FC<TaskItemProps> = ({
    task, level, projectTasks, onUpdateTask, onDeleteTask, menuRef,
    taskActionMenuOpen, setTaskActionMenuOpen, setIsReparentingTask
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
                        <span onClick={() => setIsEditingTitle(true)} className="text-sm font-medium cursor-pointer truncate">{task.title}</span>
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
                    <Button variant="ghost" size="xs" className="p-1 opacity-0 group-hover:opacity-100" onClick={() => setTaskActionMenuOpen(task.id)}>
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
