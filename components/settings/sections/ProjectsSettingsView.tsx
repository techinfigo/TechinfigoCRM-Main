
import React, { useState } from 'react';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';

const EditableListItem: React.FC<{
    item: string;
    onDelete: () => void;
}> = ({ item, onDelete }) => (
    <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-border-muted">
        <p className="font-medium text-text-base dark:text-text-base text-sm">{item}</p>
        <Button variant="ghost" size="sm" className="text-status-negative" onClick={onDelete}>Delete</Button>
    </div>
);

export const ProjectsSettingsView: React.FC = () => {
    const [projectStatuses, setProjectStatuses] = useState(['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled']);
    const [taskStatuses, setTaskStatuses] = useState(['To Do', 'In Progress', 'Review', 'Done']);
    const [newProjectStatus, setNewProjectStatus] = useState('');
    const [newTaskStatus, setNewTaskStatus] = useState('');

    const addStatus = (type: 'project' | 'task') => {
        if (type === 'project' && newProjectStatus.trim()) {
            setProjectStatuses(prev => [...prev, newProjectStatus]);
            setNewProjectStatus('');
        } else if (type === 'task' && newTaskStatus.trim()) {
            setTaskStatuses(prev => [...prev, newTaskStatus]);
            setNewTaskStatus('');
        }
    };
    
    const deleteStatus = (type: 'project' | 'task', index: number) => {
        if (type === 'project') {
            setProjectStatuses(prev => prev.filter((_, i) => i !== index));
        } else if (type === 'task') {
            setTaskStatuses(prev => prev.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="space-y-6">
            <SettingsSectionCard
                title="Project & Task Statuses"
                description="Customize the workflow statuses for your projects and their associated tasks."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-text-heading mb-2">Project Statuses</h4>
                        <div className="space-y-2">
                           {projectStatuses.map((status, index) => (
                               <EditableListItem key={index} item={status} onDelete={() => deleteStatus('project', index)} />
                           ))}
                           <div className="flex items-center gap-2 pt-2 border-t border-border-muted dark:border-slate-700">
                               <Input value={newProjectStatus} onChange={e => setNewProjectStatus(e.target.value)} placeholder="New project status" containerClassName="flex-grow" />
                               <Button onClick={() => addStatus('project')}>Add</Button>
                           </div>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-text-heading mb-2">Task Statuses</h4>
                        <div className="space-y-2">
                           {taskStatuses.map((status, index) => (
                               <EditableListItem key={index} item={status} onDelete={() => deleteStatus('task', index)} />
                           ))}
                           <div className="flex items-center gap-2 pt-2 border-t border-border-muted dark:border-slate-700">
                               <Input value={newTaskStatus} onChange={e => setNewTaskStatus(e.target.value)} placeholder="New task status" containerClassName="flex-grow" />
                               <Button onClick={() => addStatus('task')}>Add</Button>
                           </div>
                        </div>
                    </div>
                </div>
            </SettingsSectionCard>
            <SettingsSectionCard
                title="Project Templates"
                description="Create templates with predefined tasks to quickly start new projects."
            >
                <p className="text-sm text-text-muted dark:text-text-muted">This feature is planned for a future update. It will allow you to save a project's structure and task list as a reusable template.</p>
                <Button className="mt-4" disabled>Create New Template</Button>
            </SettingsSectionCard>
             <div className="mt-6 flex justify-end">
                <Button onClick={() => alert('Projects settings saved!')}>Save Projects Settings</Button>
            </div>
        </div>
    );
};
