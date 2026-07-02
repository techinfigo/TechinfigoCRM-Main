
import React, { useState, useEffect, useRef } from 'react';
import { TimeLog, Project, Task, TeamMember } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';

interface TimeLogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (timeLog: TimeLog) => void;
  timeLog: TimeLog | null;
  projects: Project[];
  tasks: Task[]; // All tasks from all projects, or filter based on selected project
  teamMembers: TeamMember[];
  currentUserId: string;
  defaultProjectId?: string;
  defaultTaskId?: string;
  onSetDirty: (isDirty: boolean) => void;
}

interface TimeLogFormData {
  projectId: string;
  taskId?: string;
  memberId: string;
  date: string;
  hours: string; // Stored as string for input
  notes?: string;
}

const initialFormData: TimeLogFormData = {
  projectId: '',
  taskId: '',
  memberId: '',
  date: new Date().toISOString().split('T')[0],
  hours: '',
  notes: '',
};

interface TimeLogFormErrors {
  projectId?: string;
  memberId?: string;
  date?: string;
  hours?: string;
}

export const TimeLogFormModal: React.FC<TimeLogFormModalProps> = ({
  isOpen, onClose, onSave, timeLog, projects, tasks, teamMembers, currentUserId, defaultProjectId, defaultTaskId, onSetDirty
}) => {
  const [formData, setFormData] = useState<TimeLogFormData>(initialFormData);
  const [errors, setErrors] = useState<TimeLogFormErrors>({});
  const initialFormStateRef = useRef<TimeLogFormData | null>(null);


  const availableTasksForSelectedProject = formData.projectId 
    ? tasks.filter(task => projects.find(p => p.id === formData.projectId)?.tasks.some(pt => pt.id === task.id)) 
    : [];

  useEffect(() => {
    if (isOpen) {
        let currentInitialState: TimeLogFormData;
        if (timeLog) {
            currentInitialState = {
                projectId: timeLog.projectId,
                taskId: timeLog.taskId || '',
                memberId: timeLog.memberId,
                date: (timeLog.date ?? '').split('T')[0],
                hours: (timeLog.hours ?? '').toString(),
                notes: timeLog.notes || '',
            };
        } else {
            currentInitialState = {
                ...initialFormData,
                memberId: currentUserId,
                projectId: defaultProjectId || (projects.length > 0 ? projects[0].id : ''),
                taskId: defaultTaskId || '',
            };
        }
        setFormData(currentInitialState);
        initialFormStateRef.current = JSON.parse(JSON.stringify(currentInitialState));
        onSetDirty(false);
        setErrors({});
    }
  }, [timeLog, isOpen, currentUserId, projects, defaultProjectId, defaultTaskId, onSetDirty]);
  
  useEffect(() => {
    if (!isOpen) return;
    if (JSON.stringify(formData) !== JSON.stringify(initialFormStateRef.current)) {
      onSetDirty(true);
    } else {
      onSetDirty(false);
    }
  }, [formData, isOpen, onSetDirty]);

  useEffect(() => {
    // If defaultProjectId is set and it's a new log, pre-select it
    if (!timeLog && defaultProjectId && projects.find(p => p.id === defaultProjectId)) {
      setFormData(prev => ({ ...prev, projectId: defaultProjectId, taskId: defaultTaskId || '' }));
    }
  }, [defaultProjectId, defaultTaskId, timeLog, projects, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof TimeLogFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (name === "projectId") { // Reset task if project changes
        setFormData(prev => ({ ...prev, taskId: '' }));
    }
  };
  
  const validate = (): boolean => {
    const newErrors: TimeLogFormErrors = {};
    if (!formData.projectId) newErrors.projectId = "Project is required.";
    if (!formData.memberId) newErrors.memberId = "Team member is required.";
    if (!formData.date) newErrors.date = "Date is required.";
    if (!formData.hours.trim()) {
      newErrors.hours = "Hours are required.";
    } else if (isNaN(parseFloat(formData.hours)) || parseFloat(formData.hours) <= 0) {
      newErrors.hours = "Hours must be a positive number.";
    } else if (parseFloat(formData.hours) > 24) {
      newErrors.hours = "Hours cannot exceed 24 for a single day.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const logToSave: TimeLog = {
      id: timeLog?.id || '', // ID will be set by App.tsx for new logs
      projectId: formData.projectId,
      taskId: formData.taskId || undefined,
      memberId: formData.memberId,
      date: formData.date,
      hours: parseFloat(formData.hours),
      notes: formData.notes?.trim() || undefined,
      dateLogged: timeLog?.dateLogged || new Date().toISOString(), // Keep original log date or set new
    };
    onSave(logToSave);
    onSetDirty(false);
  };

  const selectBaseClass = "w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 text-slate-900 dark:text-slate-100";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={timeLog ? 'Edit Time Log' : 'Log Time'}
      size="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} type="submit">
            {timeLog ? 'Save Changes' : 'Log Time'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="projectId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project *</label>
            <select id="projectId" name="projectId" value={formData.projectId} onChange={handleChange} className={`${selectBaseClass} ${errors.projectId ? 'border-red-500' : ''}`} required>
              <option value="">Select Project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {errors.projectId && <p className="mt-1 text-xs text-red-600">{errors.projectId}</p>}
          </div>
          <div>
            <label htmlFor="taskId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Task (Optional)</label>
            <select id="taskId" name="taskId" value={formData.taskId} onChange={handleChange} className={selectBaseClass} disabled={!formData.projectId || availableTasksForSelectedProject.length === 0}>
              <option value="">Select Task (Optional)</option>
              {availableTasksForSelectedProject.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Date *" id="date" name="date" type="date" value={formData.date} onChange={handleChange} error={errors.date} required />
          <Input label="Hours *" id="hours" name="hours" type="number" placeholder="e.g., 2.5" value={formData.hours} onChange={handleChange} error={errors.hours} min="0.1" step="0.1" required />
          <div>
            <label htmlFor="memberId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Team Member *</label>
            <select id="memberId" name="memberId" value={formData.memberId} onChange={handleChange} className={`${selectBaseClass} ${errors.memberId ? 'border-red-500' : ''}`} required>
              {/* Typically, this would be auto-set or admin-selectable. For simplicity, listing all. */}
              {teamMembers.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
            </select>
             {errors.memberId && <p className="mt-1 text-xs text-red-600">{errors.memberId}</p>}
          </div>
        </div>
        
        <TextArea label="Notes (Optional)" id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} placeholder="Describe the work done..." />
      </form>
    </Modal>
  );
};
