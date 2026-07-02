
import React, { useMemo } from 'react';
import { Task, View } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { EmptyStatePlaceholder } from '../partials/EmptyStatePlaceholder';
import { ClipboardList, Plus, Paperclip, Link2, Briefcase } from 'lucide-react';
import { Checkbox } from '../common/Checkbox';
import { safeFormatDate } from '@/utils';

interface MyTasksProps {
  tasks: (Task & { projectName?: string; projectId?: string; clientName?: string })[];
  onToggleTaskCompletion: (taskId: string, projectId?: string) => void;
  onSelectTask: (task: Task) => void;
  onOpenTaskModal: () => void;
  setCurrentView: (view: View) => void;
}

const getPriorityClasses = (priority?: Task['priority']) => {
  switch (priority) {
    case 'Critical': return 'border-l-status-negative bg-red-50/50 dark:bg-red-900/20';
    case 'High': return 'border-l-status-warning bg-amber-50/50 dark:bg-amber-900/20';
    case 'Medium': return 'border-l-status-info bg-sky-50/50 dark:bg-sky-900/20';
    case 'Low': return 'border-l-slate-400 bg-slate-50/50 dark:bg-slate-700/20';
    default: return 'border-l-slate-400 bg-slate-50/50 dark:bg-slate-700/20';
  }
};

const getHighlightClasses = (task: Task): string => {
    if (task.status === 'Done' || !task.dueDate) return '';
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueDate = new Date(task.dueDate);
    if (isNaN(dueDate.getTime())) return ''; // Invalid date
    const userTimezoneOffset = dueDate.getTimezoneOffset() * 60000;
    const normalizedDueDate = new Date(dueDate.getTime() + userTimezoneOffset);

    if (normalizedDueDate < today) return '!border-l-status-negative !bg-red-50 dark:!bg-red-900/30';
    if (normalizedDueDate.getTime() === today.getTime()) return '!border-l-status-warning !bg-amber-50 dark:!bg-amber-900/30';
    return '';
}

export const MyTasks: React.FC<MyTasksProps> = ({ tasks, onToggleTaskCompletion, onSelectTask, onOpenTaskModal, setCurrentView }) => {
  const next5Tasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'Done')
      .sort((a, b) => (new Date(a.dueDate || '9999').getTime()) - (new Date(b.dueDate || '9999').getTime()))
      .slice(0, 5);
  }, [tasks]);

  return (
    <Card 
        title="My Next 5 Tasks" 
        className="mt-6"
        actions={
            <div className="flex items-center space-x-2">
                <Button variant="outline" size="xs" onClick={() => setCurrentView('TASKS')}>View All Tasks</Button>
            </div>
        }
    >
      <div className="space-y-3">
        {next5Tasks.length > 0 ? next5Tasks.map(task => {
          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
          return (
            <div key={task.id} className={`p-3 rounded-lg border-l-4 flex items-start gap-3 ${getPriorityClasses(task.priority)} ${getHighlightClasses(task)}`}>
              <Checkbox
                id={`task-done-${task.id}`}
                checked={task.status === 'Done'}
                onChange={() => onToggleTaskCompletion(task.id, task.projectId)}
                className="mt-1"
                aria-label={`Mark task ${task.title} as complete`}
              />
              <div className="flex-1 min-w-0">
                <p 
                  className="font-semibold text-text-base dark:text-text-base cursor-pointer hover:underline"
                  onClick={() => onSelectTask(task)}
                >
                  {task.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-text-muted dark:slate-400 mt-1 flex-wrap">
                  {task.clientName && (
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Briefcase size={12} className="text-premium-accent"/>
                          {task.clientName}
                      </span>
                  )}
                  {task.clientName && <span className="text-slate-300 dark:text-slate-600">&bull;</span>}
                  <span>{task.projectName || 'Global'}</span>
                  {task.dueDate && <span className="text-slate-300 dark:text-slate-600">&bull;</span>}
                  {task.dueDate && (
                    <span className={isOverdue ? 'text-red-500 font-semibold' : ''}>
                      Due: {safeFormatDate(task.dueDate, 'MMM d')}
                    </span>
                  )}
                  {(task.attachmentCount ?? 0) > 0 && 
                      <span className="flex items-center gap-1" title={`${task.attachmentCount} file(s)`}>
                          <span className="text-slate-300 dark:text-slate-600">&bull;</span><Paperclip size={12}/> {task.attachmentCount}
                      </span>
                  }
                  {(task.linkCount ?? 0) > 0 && 
                        <span className="flex items-center gap-1" title={`${task.linkCount} link(s)`}>
                          <span className="text-slate-300 dark:text-slate-600">&bull;</span><Link2 size={12}/> {task.linkCount}
                      </span>
                  }
                </div>
              </div>
            </div>
          )
        }) : 
          <EmptyStatePlaceholder 
            icon={<ClipboardList className="w-12 h-12" />}
            title="No Upcoming Tasks"
            message="You're all caught up! There are no pending tasks assigned to you."
            actionButton={<Button onClick={onOpenTaskModal} size="sm" leftIcon={<Plus />}>Add New Task</Button>}
          />
        }
      </div>
    </Card>
  );
};
