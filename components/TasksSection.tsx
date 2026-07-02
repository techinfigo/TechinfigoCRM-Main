
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Project, Task, TeamMember } from '../types';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { Checkbox } from './common/Checkbox';
import { Card } from './common/Card';
import { MoreVertical, Edit, CornerDownRight, ArrowUpRight, PlusCircle, Trash, Trash2 } from 'lucide-react';
import { TaskItem } from './TaskItem';

interface TasksSectionProps {
    project: Project;
    teamMembers: TeamMember[];
    onAddTask: (projectId: string, taskData: Omit<Task, 'id' | 'completed' | 'status'>) => void;
    onUpdateTask: (projectId: string, task: Task) => void;
    onDeleteTask: (projectId: string, taskId: string) => void;
}

export const TasksSection: React.FC<TasksSectionProps> = ({
    project, teamMembers, onAddTask, onUpdateTask, onDeleteTask
}) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [editingTask, setEditingTask] = useState<{ id: string, title: string } | null>(null);
    const [addingChecklistItemFor, setAddingChecklistItemFor] = useState<string | null>(null);
    const [newChecklistItemTitle, setNewChecklistItemTitle] = useState('');
    const [taskActionMenuOpen, setTaskActionMenuOpen] = useState<string | null>(null);
    const [isReparentingTask, setIsReparentingTask] = useState<Task | null>(null);

    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setTaskActionMenuOpen(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleUpdateTask = (updatedTask: Task) => {
        onUpdateTask(project.id, updatedTask);
    };

    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;
        onAddTask(project.id, { title: newTaskTitle.trim(), parentId: undefined });
        setNewTaskTitle('');
    };

    const tasksByParent = useMemo(() => {
        const grouped = new Map<string | undefined, Task[]>();
        project.tasks.forEach(task => {
            const parentId = task.parentId;
            if (!grouped.has(parentId)) {
                grouped.set(parentId, []);
            }
            grouped.get(parentId)!.push(task);
        });
        return grouped;
    }, [project.tasks]);

    const renderTasksRecursive = (parentId: string | undefined, level: number): React.ReactNode[] => {
        const tasks = tasksByParent.get(parentId) || [];
        return tasks.map(task => (
            <React.Fragment key={task.id}>
                <TaskItem
                    task={task}
                    level={level}
                    projectTasks={project.tasks}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={(taskId) => onDeleteTask(project.id, taskId)}
                    menuRef={menuRef}
                    taskActionMenuOpen={taskActionMenuOpen}
                    setTaskActionMenuOpen={setTaskActionMenuOpen}
                    setIsReparentingTask={setIsReparentingTask}
                />
                {renderTasksRecursive(task.id, level + 1)}
            </React.Fragment>
        ));
    };

    return (
        <Card title="Tasks">
            <div className="flex gap-2 mb-3">
                <Input
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                    placeholder="Add a new task..."
                    containerClassName="flex-grow"
                />
                <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}><PlusCircle className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                {project.tasks.length > 0 ? (
                    renderTasksRecursive(undefined, 0)
                ) : (
                    <p className="text-xs text-center text-text-muted py-4">No tasks added yet.</p>
                )}
            </div>
             {isReparentingTask && (
                <div className="fixed inset-0 bg-black/30 z-[1002] flex items-center justify-center" onClick={() => setIsReparentingTask(null)}>
                    <div className="bg-bg-base dark:bg-bg-muted p-4 rounded-lg shadow-xl w-96" onClick={e => e.stopPropagation()}>
                        <h4 className="font-semibold mb-2">Select new parent task</h4>
                        <ul className="max-h-60 overflow-y-auto">
                            {project.tasks.filter(p => p.id !== isReparentingTask.id && p.parentId !== isReparentingTask.id).map(p => (
                                <li key={p.id} onClick={() => {
                                    handleUpdateTask({ ...isReparentingTask, parentId: p.id });
                                    setIsReparentingTask(null);
                                }} className="p-2 hover:bg-highlight-accent rounded cursor-pointer">{p.title}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </Card>
    );
};
